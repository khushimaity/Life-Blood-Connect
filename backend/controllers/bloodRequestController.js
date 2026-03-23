const BloodRequest = require('../models/BloodRequest');
const Admin = require('../models/Admin');
const Donor = require('../models/Donor');
const BloodInventory = require('../models/BloodInventory');
const { findNearbyDonors, sendEmergencyAlert, sendSMS } = require('../utils/sendSMS');
// Helper function to generate request ID
const generateRequestId = async () => {
    const lastRequest = await BloodRequest.findOne().sort({ createdAt: -1 });
    
    let nextNumber = 1;
    if (lastRequest && lastRequest.requestId) {
        const lastNumber = parseInt(lastRequest.requestId.replace('REQ', ''));
        nextNumber = lastNumber + 1;
    }
    
    const paddedNumber = nextNumber.toString().padStart(6, '0');
    return `REQ${paddedNumber}`;
};

// @desc    Create new blood request
// @route   POST /api/blood-requests
// @access  Private
exports.createBloodRequest = async (req, res) => {
    try {
        const {
            patientName,
            patientAge,
            patientGender,
            bloodGroup,
            requiredUnits,
            componentType,
            hospitalName,
            location,
            contactPerson,
            reason,
            reasonDetails,
            priority,
            neededBy,
            notes
        } = req.body;

        // Check if user is admin or donor
        let finalHospitalName = hospitalName;
        let finalHospitalId = null;

        if (req.user.role === 'admin') {
            const admin = await Admin.findOne({ userId: req.user.id });
            if (admin) {
                finalHospitalId = admin._id;
                finalHospitalName = admin.organizationName;
            }
        }

        const requestId = await generateRequestId();

        const request = await BloodRequest.create({
            requestId,
            patientName,
            patientAge,
            patientGender,
            bloodGroup,
            requiredUnits,
            componentType: componentType || 'Whole Blood',
            hospitalName: finalHospitalName,
            hospitalId: finalHospitalId,
            location,
            contactPerson: contactPerson || {
                name: req.user.name,
                phone: req.user.phone,
                relationship: 'Self'
            },
            reason,
            reasonDetails,
            priority: priority || 'Normal',
            neededBy: neededBy || new Date(Date.now() + 24 * 60 * 60 * 1000),
            requestedBy: req.user.id,
            status: 'Pending',
            statusHistory: [{
                status: 'Pending',
                changedBy: req.user.id,
                notes: 'Request created'
            }]
        });

        // Send SMS to nearby donors for emergency requests
        if (priority === 'Emergency') {
            try {
                console.log('🚨 EMERGENCY REQUEST - Searching for nearby donors...');
                console.log("Blood group:", bloodGroup);
                console.log("Location object:", location);

                const nearbyDonors = await findNearbyDonors(
                    bloodGroup,
                    location.coordinates,
                    10
                );

                console.log(`📍 Found ${nearbyDonors.length} nearby compatible donors`);

                if (nearbyDonors.length > 0) {
                    const notificationResult = await sendEmergencyAlert(request, nearbyDonors);

                    request.emergencyNotifications = {
                        sentAt: new Date(),
                        donorCount: nearbyDonors.length,
                        successful: notificationResult.successful,
                        failed: notificationResult.failed || 0
                    };
                    
                    request.notifiedDonors = notificationResult.successful;

                    await request.save();

                    console.log(`✅ Emergency alert sent to ${notificationResult.successful} donors`);
                } else {
                    console.log('⚠️ No nearby compatible donors found');
                    
                    request.emergencyNotifications = {
                        sentAt: new Date(),
                        donorCount: 0,
                        successful: 0,
                        failed: 0
                    };
                    
                    await request.save();
                }
            } catch (smsError) {
                console.error('❌ Error sending emergency SMS:', smsError);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Blood request created successfully',
            request
        });
    } catch (error) {
        console.error('Create blood request error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get all blood requests
// @route   GET /api/blood-requests
// @access  Private
exports.getAllBloodRequests = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            bloodGroup,
            priority,
            hospitalId,
            requestedBy,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter based on user role
        const filter = {};
        
        if (req.user.role === 'admin') {
            const admin = await Admin.findOne({ userId: req.user.id });
            if (admin) {
                filter.hospitalId = admin._id;
            }
        } else if (req.user.role === 'donor') {
            filter.requestedBy = req.user.id;
        }

        // Additional filters
        if (status && status !== 'All') filter.status = status;
        if (bloodGroup && bloodGroup !== 'All') filter.bloodGroup = bloodGroup;
        if (priority && priority !== 'All') filter.priority = priority;
        if (hospitalId) filter.hospitalId = hospitalId;
        if (requestedBy) filter.requestedBy = requestedBy;

        // Build sort
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute query
        const requests = await BloodRequest.find(filter)
            .populate('requestedBy', 'name email phone')
            .populate('hospitalId', 'organizationName location.city')
            .populate({
                path: 'acceptedDonors.donorId',
                populate: {
                    path: 'userId',
                    select: 'name phone bloodGroup'
                }
            })
            .sort(sort)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await BloodRequest.countDocuments(filter);

        // Format response for frontend
        const formattedRequests = requests.map(request => ({
    requestId: request.requestId,
    patientName: request.patientName,
    bloodGroup: request.bloodGroup,
    quantity: request.requiredUnits,
    fulfilled: request.fulfilledUnits,
    remaining: request.requiredUnits - request.fulfilledUnits,
    hospital: request.hospitalName,
    location: `${request.location?.city || ''}`,
    priority: request.priority,
    status: request.status,
    neededBy: request.neededBy,
    createdAt: request.createdAt,
    contact: request.contactPerson?.phone,
    reason: request.reason,
    acceptedDonors: request.acceptedDonors || []
}));


        res.status(200).json({
            success: true,
            count: requests.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            requests: formattedRequests
        });
    } catch (error) {
        console.error('Get all blood requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Accept a request (donor volunteers)
// @route   POST /api/blood-requests/accept
// @access  Private/Donor
exports.acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.body;

    const request = await BloodRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found"
      });
    }

    // Prevent double accept
    const alreadyAccepted = request.acceptedDonors.find(
      d => d.donorId.toString() === req.user.id
    );

    if (alreadyAccepted) {
      return res.status(400).json({
        success: false,
        message: "Already accepted"
      });
    }

    request.acceptedDonors.push({
      donorId: req.user.id
    });

    await request.save();

    res.status(200).json({
      success: true,
      message: "Request accepted"
    });

  } catch (error) {
    console.error("Accept request error:", error);
    res.status(500).json({ success: false });
  }
};

// @desc    Select a donor for request
// @route   POST /api/blood-requests/select-donor
// @access  Private/Admin
exports.selectDonor = async (req, res) => {
  try {
    const donorId = req.body.donorId;

    if (!donorId) {
      return res.status(400).json({
        success: false,
        message: "Donor ID is required"
      });
    }

    const request = await BloodRequest.findOne({
      requestId: req.params.id
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found"
      });
    }

    const donor = await Donor.findById(donorId).populate("userId");

    if (!donor) {
      return res.status(404).json({
        success: false,
        message: "Donor not found"
      });
    }

    // ✅ Update request
    request.selectedDonor = donorId;
    request.status = "Approved";
    await request.save();

    // ✅ Notify selected donor (safe)
    try {
      let selectedPhone = donor.userId?.phone;

      if (selectedPhone && !selectedPhone.startsWith("+")) {
        selectedPhone = `+91${selectedPhone}`;
      }

      if (selectedPhone) {
        await sendSMS(
          selectedPhone,
          `🎉 You have been selected for Blood Request ${request.requestId}. Please contact the hospital immediately.`
        );
      }
    } catch (err) {
      console.log("Selected donor SMS failed:", err.message);
    }

    // ❌ Notify other accepted donors (safe)
    for (let accepted of request.acceptedDonors) {
      if (accepted.donorId.toString() === donorId.toString()) continue;

      try {
        const otherDonor = await Donor.findById(
          accepted.donorId
        ).populate("userId");

        let phone = otherDonor?.userId?.phone;

        if (phone && !phone.startsWith("+")) {
          phone = `+91${phone}`;
        }

        if (phone) {
          await sendSMS(
            phone,
            `Update for Blood Request ${request.requestId}: Another donor has been selected. Thank you for volunteering ❤️`
          );
        }
      } catch (err) {
        console.log("Other donor SMS failed:", err.message);
      }
    }

    return res.status(200).json({
      success: true,
      selectedDonor: donorId
    });

  } catch (error) {
    console.error("Select donor error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// @desc    Get single blood request
// @route   GET /api/blood-requests/:id
// @access  Private
exports.getBloodRequest = async (req, res) => {
    try {
        const request = await BloodRequest.findById(req.params.id)
            .populate('requestedBy', 'name email phone')
            .populate('hospitalId', 'organizationName location contactInfo')
            .populate('acceptedDonors.donorId')
            .populate('acceptedDonors.donorId.userId', 'name phone bloodGroup')
            .populate('selectedDonor')
            .populate('selectedDonor.userId', 'name phone bloodGroup');
            
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Blood request not found'
            });
        }

        // Check permissions
        if (req.user.role === 'donor' && request.requestedBy._id.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this request'
            });
        }

        res.status(200).json({
            success: true,
            request
        });
    } catch (error) {
        console.error('Get blood request error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update blood request status
// @route   PUT /api/blood-requests/:id/status
// @access  Private/Admin
exports.updateRequestStatus = async (req, res) => {
    try {
        const { status, notes } = req.body;
        
        console.log('Updating request status:', { id: req.params.id, status, notes });
        
        const request = await BloodRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Blood request not found'
            });
        }

        // Check if admin has permission
        const admin = await Admin.findOne({ userId: req.user.id });
        if (!admin) {
            return res.status(403).json({
                success: false,
                message: 'Admin profile not found'
            });
        }

        // Check if this request belongs to this admin's hospital
        if (request.hospitalId && request.hospitalId.toString() !== admin._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this request'
            });
        }

        // Validate status transition
        const validTransitions = {
            'Pending': ['Approved', 'Cancelled'],
            'Approved': ['Processing', 'Completed', 'Cancelled'],
            'Processing': ['Completed', 'Cancelled'],
            'Completed': [],
            'Cancelled': [],
            'Expired': []
        };

        if (!validTransitions[request.status]?.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot transition from ${request.status} to ${status}`
            });
        }

        // Update the status
        request.status = status;
        
        // Add to status history
        if (!request.statusHistory) {
            request.statusHistory = [];
        }
        
        request.statusHistory.push({
            status: status,
            changedBy: req.user.id,
            notes: notes || `Status updated to ${status}`,
            changedAt: new Date()
        });

        // If status is Approved, update admin stats
        if (status === 'Approved') {
            admin.stats.totalRequests = (admin.stats.totalRequests || 0) + 1;
            await admin.save();
        }

        // If status is Completed, update fulfilled stats
        if (status === 'Completed') {
            admin.stats.fulfilledRequests = (admin.stats.fulfilledRequests || 0) + 1;
            await admin.save();
            request.completedAt = new Date();
        }

        await request.save();

        res.status(200).json({
            success: true,
            message: `Request status updated to ${status}`,
            request
        });
    } catch (error) {
        console.error('Update request status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Assign donor to request
// @route   POST /api/blood-requests/:id/assign-donor
// @access  Private/Admin
exports.assignDonorToRequest = async (req, res) => {
    try {
        const { donorId, unitsDonated } = req.body;
        
        const request = await BloodRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Blood request not found'
            });
        }

        // Check if request is still open
        if (request.status === 'Completed' || request.status === 'Cancelled') {
            return res.status(400).json({
                success: false,
                message: `Cannot assign donor to ${request.status} request`
            });
        }

        // Check if donor exists
        const donor = await Donor.findById(donorId);
        if (!donor) {
            return res.status(404).json({
                success: false,
                message: 'Donor not found'
            });
        }

        // Check if donor is eligible
        if (!donor.isEligibleToDonate()) {
            return res.status(400).json({
                success: false,
                message: 'Donor is not eligible to donate'
            });
        }

        // Add donor to request
        if (!request.donors) {
            request.donors = [];
        }
        
        request.donors.push({
            donorId: donor._id,
            unitsDonated: unitsDonated || 1,
            donationDate: new Date()
        });

        // Update fulfilled units
        request.fulfilledUnits += unitsDonated || 1;

        // Check if request is completed
        if (request.fulfilledUnits >= request.requiredUnits) {
            await this.updateRequestStatus(
                { params: { id: request._id }, body: { status: 'Completed', notes: 'All units fulfilled' }, user: req.user },
                res
            );
        } else {
            await this.updateRequestStatus(
                { params: { id: request._id }, body: { status: 'Processing', notes: 'Donor assigned' }, user: req.user },
                res
            );
        }

        // Update donor's last donation date
        donor.lastDonationDate = new Date();
        await donor.updateNextEligibleDate();
        await donor.save();

        res.status(200).json({
            success: true,
            message: 'Donor assigned successfully',
            request
        });
    } catch (error) {
        console.error('Assign donor error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get emergency requests
// @route   GET /api/blood-requests/emergency
// @access  Public
exports.getEmergencyRequests = async (req, res) => {
    try {
        const emergencyRequests = await BloodRequest.find({
            priority: 'Emergency',
            status: { $in: ['Pending', 'Approved', 'Processing'] },
            neededBy: { $gte: new Date() }
        })
        .populate('hospitalId', 'organizationName location.city')
        .sort({ neededBy: 1 })
        .limit(10);

        const formattedRequests = emergencyRequests.map(request => ({
            patient: request.patientName,
            bloodGroup: request.bloodGroup,
            hospital: request.hospitalName,
            reason: request.reason,
            neededBy: request.neededBy.toLocaleString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            }),
            contact: request.contactPerson?.phone,
            unitsNeeded: request.requiredUnits - request.fulfilledUnits,
            requestId: request.requestId
        }));

        res.status(200).json({
            success: true,
            count: emergencyRequests.length,
            requests: formattedRequests
        });
    } catch (error) {
        console.error('Get emergency requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Cancel blood request
// @route   PUT /api/blood-requests/:id/cancel
// @access  Private
exports.cancelBloodRequest = async (req, res) => {
    try {
        const request = await BloodRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Blood request not found'
            });
        }

        // Check permissions
        if (req.user.role === 'donor' && request.requestedBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to cancel this request'
            });
        }

        if (req.user.role === 'admin') {
            const admin = await Admin.findOne({ userId: req.user.id });
            if (!admin || request.hospitalId.toString() !== admin._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to cancel this request'
                });
            }
        }

        await this.updateRequestStatus(
            { params: { id: request._id }, body: { status: 'Cancelled', notes: 'Request cancelled by user' }, user: req.user },
            res
        );

        res.status(200).json({
            success: true,
            message: 'Blood request cancelled successfully'
        });
    } catch (error) {
        console.error('Cancel blood request error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get my blood requests (for donor) - includes both created and accepted
// @route   GET /api/blood-requests/my-requests
// @access  Private/Donor
exports.getMyBloodRequests = async (req, res) => {
    try {
        // Get donor info
        const donor = await Donor.findOne({ userId: req.user.id });
        
        if (!donor) {
            return res.status(404).json({
                success: false,
                message: 'Donor profile not found'
            });
        }

        // Get requests created by this donor
        const createdRequests = await BloodRequest.find({ requestedBy: req.user.id })
            .populate('hospitalId', 'organizationName location.city')
            .sort({ createdAt: -1 });

        // Get requests this donor has accepted (using acceptedDonors array)
        const acceptedRequests = await BloodRequest.find({
            'acceptedDonors.donorId': donor._id
        })
        .populate('hospitalId', 'organizationName location.city')
        .sort({ 'acceptedDonors.acceptedAt': -1 });

        // Format created requests
        const formattedCreated = createdRequests.map(req => ({
            id: req._id,
            requestId: req.requestId,
            patientName: req.patientName,
            bloodGroup: req.bloodGroup,
            requiredUnits: req.requiredUnits,
            fulfilledUnits: req.fulfilledUnits,
            remainingUnits: req.requiredUnits - req.fulfilledUnits,
            hospital: req.hospitalName,
            location: req.location?.city || '',
            status: req.status,
            neededBy: req.neededBy,
            createdAt: req.createdAt,
            priority: req.priority,
            reason: req.reason,
            role: 'creator'
        }));

        // Format accepted requests
        const formattedAccepted = acceptedRequests.map(req => {
            // Find the acceptance record for this donor
            const acceptedInfo = req.acceptedDonors?.find(
                a => a.donorId && a.donorId.toString() === donor._id.toString()
            );
            
            return {
                id: req._id,
                requestId: req.requestId,
                patientName: req.patientName,
                bloodGroup: req.bloodGroup,
                requiredUnits: req.requiredUnits,
                fulfilledUnits: req.fulfilledUnits,
                remainingUnits: req.requiredUnits - req.fulfilledUnits,
                hospital: req.hospitalName,
                location: req.location?.city || '',
                status: 'Accepted', // Show as Accepted in UI
                neededBy: req.neededBy,
                acceptedAt: acceptedInfo?.acceptedAt || new Date(),
                priority: req.priority,
                reason: req.reason,
                role: 'volunteer',
                originalStatus: req.status // Keep original status if needed
            };
        });

        // Combine and sort by date (most recent first)
        const allRequests = [...formattedCreated, ...formattedAccepted].sort((a, b) => {
            const dateA = a.acceptedAt || a.createdAt || a.neededBy;
            const dateB = b.acceptedAt || b.createdAt || b.neededBy;
            return new Date(dateB) - new Date(dateA);
        });

        res.status(200).json({
            success: true,
            count: allRequests.length,
            requests: allRequests
        });
    } catch (error) {
        console.error('Get my blood requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get available blood requests for donors to accept
// @route   GET /api/blood-requests/available
// @access  Private/Donor
exports.getAvailableRequests = async (req, res) => {
    try {
        // Get donor info including blood group
        const donor = await Donor.findOne({ userId: req.user.id })
            .populate('userId', 'bloodGroup');
        
        if (!donor) {
            return res.status(404).json({
                success: false,
                message: 'Donor profile not found'
            });
        }

        const donorBloodGroup = donor.userId?.bloodGroup;
        
        // Blood type compatibility matrix
        const compatibleBloodGroups = {
            'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
            'O+': ['O+', 'A+', 'B+', 'AB+'],
            'A-': ['A-', 'A+', 'AB-', 'AB+'],
            'A+': ['A+', 'AB+'],
            'B-': ['B-', 'B+', 'AB-', 'AB+'],
            'B+': ['B+', 'AB+'],
            'AB-': ['AB-', 'AB+'],
            'AB+': ['AB+'] // Universal recipient
        };

        const compatibleGroups = compatibleBloodGroups[donorBloodGroup] || [];

        // Find requests that are:
        // 1. Not created by this donor
        // 2. Blood group is compatible with donor
        // 3. Still pending or approved
        // 4. Not expired
        // 5. Not already fulfilled
        // 6. Donor hasn't already accepted
        const requests = await BloodRequest.find({
            requestedBy: { $ne: req.user.id },
            bloodGroup: { $in: compatibleGroups }, // Only show compatible requests
            status: { $in: ['Pending', 'Approved'] },
            neededBy: { $gte: new Date() },
            $expr: { $lt: ["$fulfilledUnits", "$requiredUnits"] },
            ...(donor && {
                'acceptedDonors.donorId': { $ne: donor._id }
            })
        })
        .populate('hospitalId', 'organizationName location.city')
        .populate('requestedBy', 'name phone')
        .sort({ priority: -1, neededBy: 1 })
        .limit(20);

        // Add compatibility info to response
        const formattedRequests = requests.map(request => ({
            id: request._id,
            requestId: request.requestId,
            patientName: request.patientName,
            bloodGroup: request.bloodGroup,
            requiredUnits: request.requiredUnits,
            fulfilledUnits: request.fulfilledUnits,
            remainingUnits: request.requiredUnits - request.fulfilledUnits,
            hospital: request.hospitalName,
            location: request.location?.city || '',
            priority: request.priority,
            neededBy: request.neededBy,
            reason: request.reason,
            contact: request.contactPerson?.phone,
            compatibility: {
                isCompatible: true,
                type: request.bloodGroup === donorBloodGroup ? 'exact' : 'compatible',
                description: request.bloodGroup === donorBloodGroup 
                    ? 'Perfect match - same blood type' 
                    : `${donorBloodGroup} can donate to ${request.bloodGroup}`
            }
        }));

        res.status(200).json({
            success: true,
            count: formattedRequests.length,
            donorBloodGroup,
            requests: formattedRequests
        });
    } catch (error) {
        console.error('Get available requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Accept a blood request (donor volunteers)
// @route   POST /api/blood-requests/:id/accept
// @access  Private/Donor
exports.acceptBloodRequest = async (req, res) => {
    try {
        const request = await BloodRequest.findById(req.params.id);
        
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        // Check if request is still available
        if (request.status !== 'Pending' && request.status !== 'Approved') {
            return res.status(400).json({
                success: false,
                message: 'This request is no longer available'
            });
        }

        if (request.fulfilledUnits >= request.requiredUnits) {
            return res.status(400).json({
                success: false,
                message: 'This request has already been fulfilled'
            });
        }

        if (request.neededBy < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'This request has expired'
            });
        }

        // Get donor info
        const donor = await Donor.findOne({ userId: req.user.id });
        if (!donor) {
            return res.status(404).json({
                success: false,
                message: 'Donor profile not found'
            });
        }

        // Check if donor already accepted this request
        const alreadyAccepted = request.acceptedDonors?.some(
            d => d.donorId && d.donorId.toString() === donor._id.toString()
        );
        
        if (alreadyAccepted) {
            return res.status(400).json({
                success: false,
                message: 'You have already accepted this request'
            });
        }

        // Initialize acceptedDonors array if it doesn't exist
        if (!request.acceptedDonors) {
            request.acceptedDonors = [];
        }
        
        // Add donor to accepted donors
        request.acceptedDonors.push({
            donorId: donor._id,
            acceptedAt: new Date(),
            status: 'Volunteered'
        });

        await request.save();

        // Return the accepted request data so frontend can update immediately
        const acceptedRequestData = {
            id: request._id,
            requestId: request.requestId,
            patientName: request.patientName,
            bloodGroup: request.bloodGroup,
            requiredUnits: request.requiredUnits,
            fulfilledUnits: request.fulfilledUnits,
            remainingUnits: request.requiredUnits - request.fulfilledUnits,
            hospital: request.hospitalName,
            location: request.location?.city || '',
            priority: request.priority,
            neededBy: request.neededBy,
            reason: request.reason,
            status: 'Accepted',
            role: 'volunteer',
            acceptedAt: new Date()
        };

        res.status(200).json({
            success: true,
            message: 'You have volunteered for this request. The hospital will contact you soon.',
            requestId: request.requestId,
            acceptedRequest: acceptedRequestData
        });

    } catch (error) {
        console.error('Accept request error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

exports.getAnalytics = async (req, res) => {
  try {
    const inventory = await BloodInventory.find().lean();
    console.log("Inventory Count:", inventory.length);
    console.log("Inventory Data:", inventory);

    const bloodGroups = {};

    inventory.forEach((item) => {
      if (!bloodGroups[item.bloodGroup]) {
        bloodGroups[item.bloodGroup] = 0;
      }
      bloodGroups[item.bloodGroup] += item.availableUnits;
    });

    const donors = await Donor.find();

    let available = 0;
    let unavailable = 0;

    donors.forEach((donor) => {
      if (donor.isAvailable) {
        available++;
      } else {
        unavailable++;
      }
    });

    return res.status(200).json({
      bloodGroups,
      donors: {
        available,
        unavailable,
      },
    });

  } catch (error) {
    console.error("Analytics error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};