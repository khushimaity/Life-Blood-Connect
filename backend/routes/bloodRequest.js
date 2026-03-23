const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const bloodRequestController = require('../controllers/bloodRequestController');

const {
    createBloodRequest,
    getAllBloodRequests,
    getBloodRequest,
    updateRequestStatus,
    assignDonorToRequest,
    getEmergencyRequests,
    cancelBloodRequest,
    getMyBloodRequests,
    getAvailableRequests,
    acceptBloodRequest
} = bloodRequestController;

// ================= TEST ROUTE =================
router.get('/test', (req, res) => {
    res.json({ 
        success: true,
        message: 'Blood Request API is working!',
        endpoints: {
            emergencyRequests: 'GET /api/blood-requests/emergency',
            createRequest: 'POST /api/blood-requests (protected)',
            getAllRequests: 'GET /api/blood-requests (protected)',
            getMyRequests: 'GET /api/blood-requests/my-requests (protected, donor only)',
            acceptRequest: 'PUT /api/blood-requests/accept (protected, donor)',
            selectDonor: 'PUT /api/blood-requests/select-donor/:id (protected, admin)'
        }
    });
});

// ================= ACCEPT REQUEST (DONOR) =================
router.put(
    "/accept",
    protect,
    authorize("donor"),
    bloodRequestController.acceptRequest
);

// ================= SELECT DONOR (ADMIN) =================
router.put(
    "/select-donor/:id",
    protect,
    authorize("admin"),
    bloodRequestController.selectDonor
);

router.get(
  "/analytics",
  protect,
  authorize("admin"),
  bloodRequestController.getAnalytics
);
// ================= VALIDATION =================
const bloodRequestValidation = [
    body('patientName').notEmpty().withMessage('Patient name is required'),
    body('bloodGroup')
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        .withMessage('Valid blood group is required'),
    body('requiredUnits')
        .isInt({ min: 1, max: 10 })
        .withMessage('Units must be between 1 and 10'),
    body('hospitalName').notEmpty().withMessage('Hospital name is required'),
    body('contactPerson.phone')
        .matches(/^[0-9]{10}$/)
        .withMessage('Valid contact phone is required'),
    body('reason')
        .isIn(['Surgery', 'Accident', 'Chronic Illness', 'Cancer Treatment', 'Childbirth', 'Transfusion', 'Other']),
    body('neededBy')
        .isISO8601()
        .withMessage('Valid date is required'),
    body('priority')
        .optional()
        .isIn(['Normal', 'Urgent', 'Emergency'])
];

// ================= PUBLIC ROUTES =================
router.get('/emergency', getEmergencyRequests);

// ================= PROTECTED ROUTES =================
router.use(protect);

// Create request (both donors and admins)
router.post('/', bloodRequestValidation, createBloodRequest);

// ================= SPECIFIC ROUTES (MUST COME BEFORE /:id) =================
router.get('/available', authorize('donor'), getAvailableRequests);
router.get('/my-requests', authorize('donor'), getMyBloodRequests);

// Admin routes with params
router.post('/:id/assign-donor', authorize('admin'), assignDonorToRequest);
router.put('/:id/status', authorize('admin'), updateRequestStatus);

// Cancel request (donor or admin)
router.put('/:id/cancel', cancelBloodRequest);

// Donor accept request (by ID)
router.post('/:id/accept', authorize('donor'), acceptBloodRequest);

// ================= PARAMETERIZED ROUTES (MUST BE LAST) =================
router.get('/:id', getBloodRequest);
router.get('/', getAllBloodRequests);

exports.getAnalytics = async (req, res) => {
  try {
    // Count blood groups from BloodInventory
    const inventory = await BloodInventory.find();

    const bloodGroups = {};

    inventory.forEach((item) => {
      if (!bloodGroups[item.bloodGroup]) {
        bloodGroups[item.bloodGroup] = 0;
      }
      bloodGroups[item.bloodGroup] += item.unitsAvailable;
    });

    // Count donors by availability
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

module.exports = router;