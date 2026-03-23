const EmergencyRequest = require('../models/EmergencyRequest');
const Donor = require('../models/Donor');
const User = require('../models/User');

const { 
    findDonorsForEmergency, 
    sendEmergencyAlert
} = require('../utils/sendSMS');

/**
 * Create a new emergency request
 */
exports.createEmergencyRequest = async (req, res) => {
    try {
        console.log('📝 Creating new emergency request');

        const {
            bloodGroup,
            patientName,
            hospitalName,
            hospitalAddress,
            area,
            city,
            coordinates,
            contactPerson,
            urgencyLevel,
            units,
            additionalNotes
        } = req.body;

        if (!bloodGroup || !patientName || !hospitalName || !hospitalAddress || !area || !contactPerson?.phone) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const emergencyRequest = new EmergencyRequest({
            bloodGroup,
            patientName,
            hospitalName,
            hospitalAddress,
            area,
            city: city || 'Mumbai',
            coordinates: coordinates || null,
            contactPerson: {
                name: contactPerson.name || 'Hospital Staff',
                phone: contactPerson.phone,
                relationship: contactPerson.relationship || 'Hospital'
            },
            urgencyLevel: urgencyLevel || 'high',
            units: units || 1,
            createdBy: req.user.id,
            status: 'active',
            additionalNotes
        });

        await emergencyRequest.save();
        console.log('✅ Emergency request saved:', emergencyRequest._id);

        // 🔍 Find donors within radius
        const donors = await findDonorsForEmergency(bloodGroup, {
            coordinates,
            area,
            city: city || 'Mumbai',
            radius: 10
        });

        console.log(`📢 Found ${donors.length} donors`);

        let notificationResult = {
            notified: 0,
            successful: 0,
            failed: 0,
            donors: []
        };

        if (donors.length > 0) {

            // Only donors with phone numbers
            const validDonors = donors.filter(d => d.userId?.phone);

            notificationResult = await sendEmergencyAlert(
                emergencyRequest,
                validDonors
            );

            emergencyRequest.notifiedDonors = notificationResult.successful;
            await emergencyRequest.save();
        }

        res.status(201).json({
            success: true,
            message: 'Emergency request created successfully',
            request: emergencyRequest,
            notification: notificationResult
        });

    } catch (error) {
        console.error('❌ Error creating emergency request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create emergency request',
            error: error.message
        });
    }
};

/**
 * Get all emergency requests
 */
exports.getEmergencyRequests = async (req, res) => {
    try {
        const { status, area } = req.query;
        
        let query = {};
        if (status) query.status = status;
        if (area) query.area = { $regex: new RegExp(area, 'i') };

        const requests = await EmergencyRequest.find(query)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            success: true,
            count: requests.length,
            requests
        });

    } catch (error) {
        console.error('❌ Get emergency requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch emergency requests'
        });
    }
};

/**
 * Get single emergency request
 */
exports.getEmergencyRequestById = async (req, res) => {
    try {
        const request = await EmergencyRequest.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Emergency request not found'
            });
        }

        res.json({
            success: true,
            request
        });

    } catch (error) {
        console.error('❌ Get emergency request by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch emergency request'
        });
    }
};

/**
 * Update emergency status
 */
exports.updateEmergencyStatus = async (req, res) => {
    try {
        const request = await EmergencyRequest.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Emergency request not found'
            });
        }

        res.json({
            success: true,
            message: 'Status updated',
            request
        });

    } catch (error) {
        console.error('❌ Update emergency status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update request'
        });
    }
};

/**
 * @desc    Respond to emergency (donor volunteers)
 * @route   POST /api/emergency/:id/respond
 * @access  Private/Donor
 */
exports.respondToEmergency = async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log(`📢 Donor responding to emergency: ${id}`);

        // Find donor profile
        const donor = await Donor.findOne({ userId: req.user.id });
        if (!donor) {
            return res.status(404).json({
                success: false,
                message: 'Donor profile not found'
            });
        }

        // Find emergency request
        const emergency = await EmergencyRequest.findById(id);
        if (!emergency) {
            return res.status(404).json({
                success: false,
                message: 'Emergency request not found'
            });
        }

        // Check if emergency is still active
        if (emergency.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'This emergency request is no longer active'
            });
        }

        // Check if donor already responded
        const alreadyResponded = emergency.respondedDonors?.some(
            d => d.donorId && d.donorId.toString() === donor._id.toString()
        );

        if (alreadyResponded) {
            return res.status(400).json({
                success: false,
                message: 'You have already responded to this emergency'
            });
        }

        // Initialize respondedDonors array if it doesn't exist
        if (!emergency.respondedDonors) {
            emergency.respondedDonors = [];
        }

        // Add donor response
        emergency.respondedDonors.push({
            donorId: donor._id,
            respondedAt: new Date(),
            status: 'responded'
        });

        await emergency.save();

        console.log(`✅ Donor ${donor._id} responded to emergency ${id}`);

        res.status(200).json({
            success: true,
            message: 'Response recorded successfully. The hospital will contact you soon.',
            data: {
                emergencyId: emergency._id,
                respondedAt: new Date()
            }
        });

    } catch (error) {
        console.error('❌ Respond to emergency error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @desc    Debug donors - find donors near a location (admin only)
 * @route   GET /api/emergency/debug
 * @access  Private/Admin
 */
exports.debugDonors = async (req, res) => {
    try {
        const { lat, lng, radius = 10, bloodGroup } = req.query;
        
        let query = {};
        
        // If coordinates provided, find nearby donors
        if (lat && lng) {
            query = {
                isAvailable: true,
                'address.coordinates': {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [parseFloat(lng), parseFloat(lat)]
                        },
                        $maxDistance: parseInt(radius) * 1000
                    }
                }
            };
        }

        // Filter by blood group if specified
        if (bloodGroup && bloodGroup !== 'All') {
            const users = await User.find({ bloodGroup, role: 'donor' }).select('_id');
            const userIds = users.map(u => u._id);
            query.userId = { $in: userIds };
        }

        const donors = await Donor.find(query)
            .populate('userId', 'name phone bloodGroup')
            .limit(20);

        // Get total counts
        const totalDonors = await Donor.countDocuments();
        const availableDonors = await Donor.countDocuments({ isAvailable: true });
        const eligibleDonors = await Donor.countDocuments({
            isAvailable: true,
            nextEligibleDate: { $lte: new Date() }
        });

        res.status(200).json({
            success: true,
            debug: {
                totalDonors,
                availableDonors,
                eligibleDonors,
                queryFilters: query,
                resultsCount: donors.length
            },
            donors: donors.map(d => ({
                id: d._id,
                name: d.userId?.name,
                phone: d.userId?.phone,
                bloodGroup: d.userId?.bloodGroup,
                isAvailable: d.isAvailable,
                isEligible: d.isEligibleToDonate(),
                lastDonation: d.lastDonationDate,
                nextEligible: d.nextEligibleDate,
                location: d.address?.city || d.collegeDetails?.district,
                hasCoordinates: !!(d.address?.coordinates?.coordinates)
            }))
        });

    } catch (error) {
        console.error('❌ Debug donors error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};