const Admin = require('../models/Admin');
const User = require('../models/User');
const BloodRequest = require('../models/BloodRequest');
const BloodInventory = require('../models/BloodInventory');
const Donation = require('../models/Donation');
const Donor = require('../models/Donor');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
    try {
        const admin = await Admin.findOne({ userId: req.user.id });
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin profile not found'
            });
        }

        // Get all blood requests for this hospital (not just pending)
        const allRequests = await BloodRequest.find({
            hospitalId: admin._id
        })
        .sort({ createdAt: -1 })
        .limit(20);

        // Get counts by status
        const requestCounts = await BloodRequest.aggregate([
            { $match: { hospitalId: admin._id } },
            { $group: {
                _id: '$status',
                count: { $sum: 1 }
            }}
        ]);

        // Format request counts
        const stats = {
            total: 0,
            pending: 0,
            approved: 0,
            processing: 0,
            completed: 0,
            cancelled: 0,
            expired: 0
        };

        requestCounts.forEach(item => {
            stats.total += item.count;
            switch(item._id) {
                case 'Pending': stats.pending = item.count; break;
                case 'Approved': stats.approved = item.count; break;
                case 'Processing': stats.processing = item.count; break;
                case 'Completed': stats.completed = item.count; break;
                case 'Cancelled': stats.cancelled = item.count; break;
                case 'Expired': stats.expired = item.count; break;
            }
        });

        // Get inventory summary
        const inventory = await BloodInventory.aggregate([
            { $match: { adminId: admin._id } },
            { $group: {
                _id: '$bloodGroup',
                totalUnits: { $sum: '$availableUnits' },
                reservedUnits: { $sum: '$reservedUnits' }
            }}
        ]);

        // Get recent donations
        const recentDonations = await Donation.find({ collectionCenter: admin._id })
            .populate('donorId', 'userId')
            .populate('donorId.userId', 'name')
            .sort({ collectionDate: -1 })
            .limit(5);

        // Get donor count in admin's area
        const donorCount = await Donor.countDocuments({
            $or: [
                { 'address.city': admin.location?.city },
                { 'collegeDetails.district': admin.location?.district }
            ],
            isActive: true
        });

        // Get today's appointments
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todaysDonations = await Donation.countDocuments({
            collectionCenter: admin._id,
            collectionDate: {
                $gte: today,
                $lt: tomorrow
            },
            status: { $in: ['Scheduled', 'In Progress'] }
        });

        // Get low inventory alerts
        const lowInventory = await BloodInventory.find({
            adminId: admin._id,
            availableUnits: { $lt: 5 } // Less than 5 units
        }).select('bloodGroup availableUnits');

        // Format dashboard data
        const dashboardData = {
            organization: {
                name: admin.organizationName,
                type: admin.centerType,
                location: admin.location ? `${admin.location.city || ''}, ${admin.location.state || ''}` : '',
                isVerified: admin.isVerified,
                rating: admin.stats.rating || 0
            },
            stats: {
                totalRequests: stats.total,
                pendingRequests: stats.pending,
                approvedRequests: stats.approved,
                processingRequests: stats.processing,
                completedRequests: stats.completed,
                fulfilledRequests: stats.completed, // Same as completed for now
                activeDonors: donorCount,
                totalCollections: admin.stats.totalCollections || 0,
                todaysAppointments: todaysDonations,
                fulfillmentRate: stats.total > 0 ? 
                    Math.round((stats.completed / stats.total) * 100) : 0
            },
            inventory: inventory.reduce((acc, item) => {
                acc[item._id] = {
                    available: item.totalUnits,
                    reserved: item.reservedUnits
                };
                return acc;
            }, {}),
            recentRequests: allRequests.map(request => ({
                id: request._id,
                requestId: request.requestId,
                patientName: request.patientName,
                bloodGroup: request.bloodGroup,
                quantity: request.requiredUnits,
                fulfilledUnits: request.fulfilledUnits || 0,
                status: request.status,
                neededBy: request.neededBy,
                priority: request.priority,
                createdAt: request.createdAt,
                acceptedDonors: request.acceptedDonors?.length || 0
            })),
            recentDonations: recentDonations.map(donation => ({
                donationId: donation.donationId,
                donorName: donation.donorId?.userId?.name || 'Anonymous',
                bloodGroup: donation.bloodGroup,
                units: donation.unitsCollected,
                date: donation.collectionDate,
                type: donation.donationType,
                status: donation.status
            })),
            requestStatus: stats,
            alerts: {
                lowInventory: lowInventory.map(item => ({
                    bloodGroup: item.bloodGroup,
                    availableUnits: item.availableUnits
                })),
                pendingRequests: stats.pending
            }
        };

        res.status(200).json({
            success: true,
            dashboard: dashboardData
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get all admin centers
// @route   GET /api/admin/centers
// @access  Public
exports.getAllCenters = async (req, res) => {
    try {
        const {
            type,
            city,
            state,
            verified,
            page = 1,
            limit = 10,
            search
        } = req.query;

        const filter = {};
        
        if (type && type !== 'All') filter.centerType = type;
        if (city && city !== 'All') filter['location.city'] = new RegExp(city, 'i');
        if (state && state !== 'All') filter['location.state'] = new RegExp(state, 'i');
        if (verified !== undefined) filter.isVerified = verified === 'true';
        
        // Search by organization name or admin name
        if (search) {
            filter.$or = [
                { organizationName: new RegExp(search, 'i') },
                { adminName: new RegExp(search, 'i') },
                { 'location.city': new RegExp(search, 'i') }
            ];
        }

        const centers = await Admin.find(filter)
            .populate('userId', 'name email phone')
            .sort({ isVerified: -1, createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .select('organizationName centerType location contactInfo facilities services isVerified stats');

        const total = await Admin.countDocuments(filter);

        const centersData = centers.map(center => ({
            id: center._id,
            name: center.organizationName,
            type: center.centerType,
            location: {
                city: center.location?.city,
                state: center.location?.state,
                fullAddress: center.location ? 
                    `${center.location.address || ''}, ${center.location.city || ''}, ${center.location.state || ''}`.trim() : ''
            },
            phone: center.contactInfo?.phone?.[0] || '',
            email: center.contactInfo?.email?.[0] || '',
            isVerified: center.isVerified,
            rating: center.stats.rating || 0,
            services: center.services || [],
            facilities: center.facilities || [],
            stats: {
                totalCollections: center.stats.totalCollections || 0,
                activeDonors: center.stats.activeDonors || 0
            }
        }));

        res.status(200).json({
            success: true,
            count: centers.length,
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            centers: centersData
        });
    } catch (error) {
        console.error('Get all centers error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private/Admin
exports.updateAdminProfile = async (req, res) => {
    try {
        const admin = await Admin.findOne({ userId: req.user.id });

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin profile not found'
            });
        }

        // Update allowed fields
        const allowedUpdates = [
            'organizationName', 'adminName', 'centerType', 'centerCategory',
            'location', 'contactInfo', 'facilities', 'services', 'storageCapacity',
            'staffCount', 'operatingHours', 'settings', 'description'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                if (typeof req.body[field] === 'object' && !Array.isArray(req.body[field])) {
                    admin[field] = { ...admin[field], ...req.body[field] };
                } else {
                    admin[field] = req.body[field];
                }
            }
        });

        admin.updatedAt = new Date();
        await admin.save();

        const updatedAdmin = await Admin.findById(admin._id)
            .populate('userId', 'name email phone');

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            admin: {
                id: updatedAdmin._id,
                organizationName: updatedAdmin.organizationName,
                adminName: updatedAdmin.adminName,
                centerType: updatedAdmin.centerType,
                location: updatedAdmin.location,
                contactInfo: updatedAdmin.contactInfo,
                operatingHours: updatedAdmin.operatingHours,
                facilities: updatedAdmin.facilities,
                services: updatedAdmin.services,
                isVerified: updatedAdmin.isVerified,
                stats: updatedAdmin.stats
            }
        });
    } catch (error) {
        console.error('Update admin profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Verify admin center
// @route   PUT /api/admin/verify/:id
// @access  Private/SuperAdmin
exports.verifyAdminCenter = async (req, res) => {
    try {
        // Check if user is super admin
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to verify centers'
            });
        }

        const admin = await Admin.findById(req.params.id);

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin center not found'
            });
        }

        admin.isVerified = true;
        admin.verifiedBy = req.user.id;
        admin.verifiedAt = new Date();
        admin.verificationNotes = req.body.notes || '';

        await admin.save();

        // Also verify the user account
        await User.findByIdAndUpdate(admin.userId, { 
            isVerified: true,
            role: admin.centerType === 'Hospital' ? 'hospital_admin' : 'center_admin'
        });

        res.status(200).json({
            success: true,
            message: 'Admin center verified successfully',
            admin: {
                id: admin._id,
                organizationName: admin.organizationName,
                isVerified: admin.isVerified,
                verifiedAt: admin.verifiedAt,
                verifiedBy: admin.verifiedBy
            }
        });
    } catch (error) {
        console.error('Verify admin center error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get admin center details
// @route   GET /api/admin/center/:id
// @access  Public
exports.getCenterDetails = async (req, res) => {
    try {
        const center = await Admin.findById(req.params.id)
            .populate('userId', 'name email phone')
            .populate('verifiedBy', 'name');

        if (!center) {
            return res.status(404).json({
                success: false,
                message: 'Center not found'
            });
        }

        // Get current inventory with component types
        const inventory = await BloodInventory.aggregate([
            { $match: { adminId: center._id } },
            { $group: {
                _id: {
                    bloodGroup: '$bloodGroup',
                    componentType: '$componentType'
                },
                availableUnits: { $sum: '$availableUnits' },
                reservedUnits: { $sum: '$reservedUnits' },
                totalUnits: { $sum: '$totalUnits' }
            }}
        ]);

        // Get upcoming donations/scheduled appointments
        const upcomingDonations = await Donation.find({
            collectionCenter: center._id,
            collectionDate: { $gte: new Date() },
            status: 'Scheduled'
        })
        .populate('donorId', 'userId')
        .populate('donorId.userId', 'name bloodGroup phone')
        .sort({ collectionDate: 1 })
        .limit(5);

        const inventorySummary = {};
        inventory.forEach(item => {
            const bg = item._id.bloodGroup;
            const compType = item._id.componentType || 'Whole Blood';
            
            if (!inventorySummary[bg]) {
                inventorySummary[bg] = {};
            }
            
            inventorySummary[bg][compType] = {
                available: item.availableUnits,
                reserved: item.reservedUnits,
                total: item.totalUnits
            };
        });

        res.status(200).json({
            success: true,
            center: {
                id: center._id,
                name: center.organizationName,
                type: center.centerType,
                category: center.centerCategory,
                adminName: center.adminName,
                description: center.description,
                location: center.location || {},
                contact: center.contactInfo,
                operatingHours: center.operatingHours,
                facilities: center.facilities,
                services: center.services,
                staffCount: center.staffCount,
                storageCapacity: center.storageCapacity,
                isVerified: center.isVerified,
                verifiedAt: center.verifiedAt,
                verifiedBy: center.verifiedBy?.name,
                rating: center.stats.rating || 0,
                reviews: center.stats.reviews || 0,
                createdAt: center.createdAt
            },
            inventory: inventorySummary,
            upcomingDonations: upcomingDonations.map(donation => ({
                donationId: donation.donationId,
                donorName: donation.donorId?.userId?.name || 'Anonymous',
                bloodGroup: donation.donorId?.userId?.bloodGroup,
                appointmentTime: donation.collectionDate,
                type: donation.donationType,
                status: donation.status
            })),
            stats: {
                totalDonors: center.stats.activeDonors || 0,
                totalCollections: center.stats.totalCollections || 0,
                totalRequests: center.stats.totalRequests || 0,
                fulfilledRequests: center.stats.fulfilledRequests || 0,
                fulfillmentRate: center.stats.totalRequests > 0 ? 
                    Math.round((center.stats.fulfilledRequests / center.stats.totalRequests) * 100) : 0
            }
        });
    } catch (error) {
        console.error('Get center details error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Search blood in centers
// @route   GET /api/admin/search-blood
// @access  Public
exports.searchBlood = async (req, res) => {
    try {
        const { 
            bloodGroup, 
            componentType = 'Whole Blood', 
            city, 
            state, 
            minUnits = 1,
            maxDistance = 50
        } = req.query;

        if (!bloodGroup) {
            return res.status(400).json({
                success: false,
                message: 'Please specify blood group'
            });
        }

        // Base filter for centers
        const centerFilter = { isVerified: true };
        
        if (city && city !== 'All') {
            centerFilter['location.city'] = new RegExp(city, 'i');
        }
        if (state && state !== 'All') {
            centerFilter['location.state'] = new RegExp(state, 'i');
        }

        // Find centers with blood inventory
        const centers = await Admin.find(centerFilter)
            .select('organizationName centerType location contactInfo stats')
            .lean();

        if (centers.length === 0) {
            return res.status(200).json({
                success: true,
                count: 0,
                results: [],
                message: 'No centers found in the specified location'
            });
        }

        // Get center IDs
        const centerIds = centers.map(center => center._id);

        // Find blood inventory for these centers
        const bloodFilter = {
            adminId: { $in: centerIds },
            bloodGroup: bloodGroup,
            componentType: componentType === 'All' ? { $exists: true } : componentType,
            availableUnits: { $gte: parseInt(minUnits) },
            status: 'Available',
            expiryDate: { $gt: new Date() }
        };

        const bloodInventory = await BloodInventory.find(bloodFilter)
            .populate('adminId', 'organizationName centerType location contactInfo')
            .sort({ expiryDate: 1, availableUnits: -1 });

        if (bloodInventory.length === 0) {
            return res.status(200).json({
                success: true,
                count: 0,
                results: [],
                message: `No ${bloodGroup} blood available in ${city || 'the selected area'}`
            });
        }

        // Group by center for better presentation
        const resultsByCenter = {};
        bloodInventory.forEach(item => {
            const centerId = item.adminId._id.toString();
            if (!resultsByCenter[centerId]) {
                const center = centers.find(c => c._id.toString() === centerId);
                resultsByCenter[centerId] = {
                    center: {
                        id: centerId,
                        name: center.organizationName,
                        type: center.centerType,
                        location: center.location ? 
                            `${center.location.address || ''}, ${center.location.city || ''}, ${center.location.state || ''}`.trim() : '',
                        city: center.location?.city,
                        state: center.location?.state,
                        phone: center.contactInfo?.phone?.[0] || '',
                        email: center.contactInfo?.email?.[0] || '',
                        rating: center.stats?.rating || 0
                    },
                    bloodUnits: []
                };
            }
            
            resultsByCenter[centerId].bloodUnits.push({
                componentType: item.componentType,
                availableUnits: item.availableUnits,
                reservedUnits: item.reservedUnits,
                expiryDate: item.expiryDate,
                daysToExpiry: Math.ceil((item.expiryDate - new Date()) / (1000 * 60 * 60 * 24)),
                storageLocation: item.storageLocation
            });
        });

        // Convert to array and calculate total units per center
        const results = Object.values(resultsByCenter).map(result => {
            const totalUnits = result.bloodUnits.reduce((sum, unit) => sum + unit.availableUnits, 0);
            return {
                ...result,
                totalAvailableUnits: totalUnits,
                hasEnoughUnits: totalUnits >= parseInt(minUnits)
            };
        });

        // Sort by total available units (descending)
        results.sort((a, b) => b.totalAvailableUnits - a.totalAvailableUnits);

        res.status(200).json({
            success: true,
            count: results.length,
            totalUnits: results.reduce((sum, result) => sum + result.totalAvailableUnits, 0),
            filters: {
                bloodGroup,
                componentType,
                city: city || 'All',
                state: state || 'All',
                minUnits: parseInt(minUnits)
            },
            results
        });
    } catch (error) {
        console.error('Search blood error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
}

// @desc    Get center analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
exports.getCenterAnalytics = async (req, res) => {
    try {
        const admin = await Admin.findOne({ userId: req.user.id });
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin profile not found'
            });
        }

        const { period = 'month' } = req.query;
        const now = new Date();
        let startDate;

        switch (period) {
            case 'day':
                startDate = new Date(now.setDate(now.getDate() - 1));
                break;
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                startDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            case 'year':
                startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
            default:
                startDate = new Date(now.setMonth(now.getMonth() - 1));
        }

        // Get donation analytics
        const donationAnalytics = await Donation.aggregate([
            {
                $match: {
                    collectionCenter: admin._id,
                    collectionDate: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$collectionDate" }
                    },
                    count: { $sum: 1 },
                    totalUnits: { $sum: "$unitsCollected" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Get request fulfillment analytics
        const requestAnalytics = await BloodRequest.aggregate([
            {
                $match: {
                    hospitalId: admin._id,
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get inventory analytics
        const inventoryAnalytics = await BloodInventory.aggregate([
            {
                $match: {
                    adminId: admin._id,
                    updatedAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: "$bloodGroup",
                    avgUnits: { $avg: "$availableUnits" },
                    minUnits: { $min: "$availableUnits" },
                    maxUnits: { $max: "$availableUnits" }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            analytics: {
                period,
                startDate,
                endDate: new Date(),
                donations: donationAnalytics,
                requests: requestAnalytics,
                inventory: inventoryAnalytics
            }
        });
    } catch (error) {
        console.error('Get center analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private/Admin
exports.getAdminProfile = async (req, res) => {
    try {
        const admin = await Admin.findOne({ userId: req.user.id })
            .populate('userId', 'name email phone');
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin profile not found'
            });
        }

        res.status(200).json({
            success: true,
            admin
        });
    } catch (error) {
        console.error('Get admin profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};