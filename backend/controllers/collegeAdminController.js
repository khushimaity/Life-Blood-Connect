const CollegeAdmin = require('../models/CollegeAdmin');
const User = require('../models/User');
const BloodDonationDrive = require('../models/BloodDonationDrive');
const Donor = require('../models/Donor');

// @desc    Get college admin profile
// @route   GET /api/college-admin/profile
// @access  Private/CollegeAdmin
exports.getCollegeAdminProfile = async (req, res) => {
    try {
        const collegeAdmin = await CollegeAdmin.findOne({ userId: req.user.id })
            .populate('userId', 'name email phone');
        
        if (!collegeAdmin) {
            return res.status(404).json({
                success: false,
                message: 'College admin profile not found'
            });
        }

        res.status(200).json({
            success: true,
            collegeAdmin
        });
    } catch (error) {
        console.error('Get college admin profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update college admin profile
// @route   PUT /api/college-admin/profile
// @access  Private/CollegeAdmin
exports.updateCollegeAdminProfile = async (req, res) => {
    try {
        const collegeAdmin = await CollegeAdmin.findOne({ userId: req.user.id });

        if (!collegeAdmin) {
            return res.status(404).json({
                success: false,
                message: 'College admin profile not found'
            });
        }

        const allowedUpdates = [
            'collegeName', 'adminName', 'collegeType',
            'location', 'contactInfo'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                if (typeof req.body[field] === 'object' && !Array.isArray(req.body[field])) {
                    collegeAdmin[field] = { ...collegeAdmin[field], ...req.body[field] };
                } else {
                    collegeAdmin[field] = req.body[field];
                }
            }
        });

        collegeAdmin.updatedAt = new Date();
        await collegeAdmin.save();

        const updatedCollegeAdmin = await CollegeAdmin.findById(collegeAdmin._id)
            .populate('userId', 'name email phone');

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            collegeAdmin: updatedCollegeAdmin
        });
    } catch (error) {
        console.error('Update college admin profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get college admin dashboard stats
// @route   GET /api/college-admin/dashboard
// @access  Private/CollegeAdmin
exports.getDashboardStats = async (req, res) => {
    try {
        const collegeAdmin = await CollegeAdmin.findOne({ userId: req.user.id });
        
        if (!collegeAdmin) {
            return res.status(404).json({
                success: false,
                message: 'College admin profile not found'
            });
        }

        const drives = await BloodDonationDrive.find({ collegeId: collegeAdmin._id })
            .sort({ driveDate: -1 });

        const donorsInArea = await Donor.countDocuments({
            $or: [
                { 'collegeDetails.collegeName': collegeAdmin.collegeName },
                { 'address.city': collegeAdmin.location?.city }
            ],
            isActive: true
        });

        const donorsByDepartment = await Donor.aggregate([
            {
                $match: {
                    'collegeDetails.collegeName': collegeAdmin.collegeName,
                    isActive: true
                }
            },
            {
                $group: {
                    _id: '$collegeDetails.department',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const departmentData = donorsByDepartment.map(d => ({
            department: d._id || 'Other',
            donors: d.count
        }));

        if (departmentData.length === 0) {
            departmentData.push(
                { department: 'CSE', donors: 0 },
                { department: 'ECE', donors: 0 },
                { department: 'MECH', donors: 0 },
                { department: 'CIVIL', donors: 0 },
                { department: 'IT', donors: 0 }
            );
        }

        let totalDriveRegistrations = 0;
        drives.forEach(drive => {
            totalDriveRegistrations += drive.registeredDonors || 0;
        });

        const driveStats = {
            upcoming: drives.filter(d => d.status === 'Upcoming').length,
            ongoing: drives.filter(d => d.status === 'Ongoing').length,
            completed: drives.filter(d => d.status === 'Completed').length,
            cancelled: drives.filter(d => d.status === 'Cancelled').length,
            total: drives.length
        };

        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        const upcomingDrives = drives.filter(d => 
            d.driveDate <= thirtyDaysFromNow && 
            d.driveDate >= new Date() &&
            d.status === 'Upcoming'
        );

        collegeAdmin.stats = {
            totalDonors: donorsInArea,
            activeDonors: donorsInArea,
            totalCamps: driveStats.total,
            totalDonations: totalDriveRegistrations
        };
        await collegeAdmin.save();

        const bloodGroupDistribution = await Donor.aggregate([
            {
                $match: {
                    'collegeDetails.collegeName': collegeAdmin.collegeName
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $group: {
                    _id: '$user.bloodGroup',
                    count: { $sum: 1 }
                }
            }
        ]);

        const bloodGroupMap = {
            'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0,
            'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0
        };

        bloodGroupDistribution.forEach(item => {
            if (item._id && bloodGroupMap.hasOwnProperty(item._id)) {
                bloodGroupMap[item._id] = item.count;
            }
        });

        const donationData = Object.entries(bloodGroupMap).map(([bloodGroup, donations]) => ({
            bloodGroup,
            donations
        }));

        const dashboardData = {
            collegeAdmin: {
                collegeName: collegeAdmin.collegeName,
                adminName: collegeAdmin.adminName,
                collegeType: collegeAdmin.collegeType,
                location: collegeAdmin.location,
                contactInfo: collegeAdmin.contactInfo,
                isVerified: collegeAdmin.isVerified
            },
            stats: {
                totalDonors: donorsInArea,
                verifiedDonors: donorsInArea,
                pendingVerifications: 0,
                totalCamps: driveStats.total,
                upcomingCamps: driveStats.upcoming,
                totalDonations: totalDriveRegistrations,
                activeAlerts: 0
            },
            driveStats,
            upcomingDrives: upcomingDrives.slice(0, 5).map(drive => ({
                id: drive._id,
                driveName: drive.driveName,
                driveDate: drive.driveDate,
                driveTime: drive.driveTime,
                location: drive.location,
                registeredDonors: drive.registeredDonors,
                targetDonors: drive.targetDonors,
                status: drive.status
            })),
            donationData,
            departmentData
        };

        res.status(200).json({
            success: true,
            dashboard: dashboardData
        });
    } catch (error) {
        console.error('Get college admin dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Create blood donation drive - FIXED to match frontend
// @route   POST /api/college-admin/drives
// @access  Private/CollegeAdmin
exports.createDonationDrive = async (req, res) => {
    try {
        console.log('📝 Creating drive with data:', req.body);
        
        const collegeAdmin = await CollegeAdmin.findOne({ userId: req.user.id });
        
        if (!collegeAdmin) {
            console.log('❌ College admin not found');
            return res.status(404).json({
                success: false,
                message: 'College admin profile not found'
            });
        }

        const {
            driveName,
            driveDate,
            driveTime,
            location,
            targetDonors,
            coordinatorName,
            coordinatorPhone,
            description,
            facilities,
            bloodGroupsNeeded
        } = req.body;

        // Validate required fields
        if (!driveName || !driveDate || !driveTime || !location || !targetDonors) {
            console.log('❌ Missing required fields:', { driveName, driveDate, driveTime, location, targetDonors });
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Validate date
        const driveDateObj = new Date(driveDate);
        if (isNaN(driveDateObj.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format'
            });
        }

        // Check if date is in the past
        if (driveDateObj < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Drive date cannot be in the past'
            });
        }

        // Create the drive
        const drive = await BloodDonationDrive.create({
            collegeId: collegeAdmin._id,
            driveName,
            driveDate: driveDateObj,
            driveTime,
            location,
            targetDonors: parseInt(targetDonors),
            registeredDonors: 0,
            coordinatorName: coordinatorName || '',
            coordinatorPhone: coordinatorPhone || '',
            description: description || '',
            facilities: facilities || [],
            bloodGroupsNeeded: bloodGroupsNeeded || [],
            status: 'Upcoming',
            organizedBy: collegeAdmin.collegeName
        });

        console.log('✅ Drive created successfully:', drive._id);

        res.status(201).json({
            success: true,
            message: 'Blood donation drive created successfully',
            drive
        });
    } catch (error) {
        console.error('❌ Create donation drive error:', error);
        console.error('❌ Error name:', error.name);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get all donation drives for college
// @route   GET /api/college-admin/drives
// @access  Private/CollegeAdmin
exports.getDonationDrives = async (req, res) => {
    try {
        const collegeAdmin = await CollegeAdmin.findOne({ userId: req.user.id });
        
        if (!collegeAdmin) {
            return res.status(404).json({
                success: false,
                message: 'College admin profile not found'
            });
        }

        const { status, page = 1, limit = 10 } = req.query;

        const filter = { collegeId: collegeAdmin._id };
        if (status && status !== 'All') {
            filter.status = status;
        }

        const drives = await BloodDonationDrive.find(filter)
            .sort({ driveDate: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await BloodDonationDrive.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: drives.length,
            total,
            totalPages: Math.ceil(total / parseInt(limit)),
            currentPage: parseInt(page),
            drives
        });
    } catch (error) {
        console.error('Get donation drives error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update donation drive
// @route   PUT /api/college-admin/drives/:id
// @access  Private/CollegeAdmin
exports.updateDonationDrive = async (req, res) => {
    try {
        const collegeAdmin = await CollegeAdmin.findOne({ userId: req.user.id });
        
        if (!collegeAdmin) {
            return res.status(404).json({
                success: false,
                message: 'College admin profile not found'
            });
        }

        const drive = await BloodDonationDrive.findById(req.params.id);
        
        if (!drive) {
            return res.status(404).json({
                success: false,
                message: 'Donation drive not found'
            });
        }

        if (drive.collegeId.toString() !== collegeAdmin._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this drive'
            });
        }

        const allowedUpdates = [
            'driveName', 'description', 'driveDate', 'driveTime',
            'location', 'targetDonors', 'coordinatorName',
            'coordinatorPhone', 'facilities', 'bloodGroupsNeeded', 'status'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                drive[field] = req.body[field];
            }
        });

        drive.updatedAt = new Date();
        await drive.save();

        res.status(200).json({
            success: true,
            message: 'Donation drive updated successfully',
            drive
        });
    } catch (error) {
        console.error('Update donation drive error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Delete donation drive
// @route   DELETE /api/college-admin/drives/:id
// @access  Private/CollegeAdmin
exports.deleteDonationDrive = async (req, res) => {
    try {
        const collegeAdmin = await CollegeAdmin.findOne({ userId: req.user.id });
        
        if (!collegeAdmin) {
            return res.status(404).json({
                success: false,
                message: 'College admin profile not found'
            });
        }

        const drive = await BloodDonationDrive.findById(req.params.id);
        
        if (!drive) {
            return res.status(404).json({
                success: false,
                message: 'Donation drive not found'
            });
        }

        if (drive.collegeId.toString() !== collegeAdmin._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this drive'
            });
        }

        if (drive.status !== 'Upcoming') {
            return res.status(400).json({
                success: false,
                message: 'Only upcoming drives can be deleted'
            });
        }

        await drive.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Donation drive deleted successfully'
        });
    } catch (error) {
        console.error('Delete donation drive error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get public donation drives for home page
// @route   GET /api/college-admin/public-drives
// @access  Public
exports.getPublicDonationDrives = async (req, res) => {
    try {
        const { city, state } = req.query;

        const filter = {
            status: { $in: ['Upcoming', 'Ongoing'] },
            driveDate: { $gte: new Date() }
        };

        if (city && city !== 'All') {
            filter['location'] = new RegExp(city, 'i');
        }

        const drives = await BloodDonationDrive.find(filter)
            .populate('collegeId', 'collegeName location contactInfo')
            .sort({ driveDate: 1 })
            .limit(10);

        const formattedDrives = drives.map(drive => ({
            id: drive._id,
            driveName: drive.driveName,
            description: drive.description,
            collegeName: drive.collegeId?.collegeName,
            driveDate: drive.driveDate,
            driveTime: drive.driveTime,
            location: drive.location,
            coordinatorName: drive.coordinatorName,
            coordinatorPhone: drive.coordinatorPhone,
            targetDonors: drive.targetDonors,
            registeredDonors: drive.registeredDonors,
            bloodGroupsNeeded: drive.bloodGroupsNeeded,
            status: drive.status,
            facilities: drive.facilities
        }));

        res.status(200).json({
            success: true,
            count: formattedDrives.length,
            drives: formattedDrives
        });
    } catch (error) {
        console.error('Get public donation drives error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};