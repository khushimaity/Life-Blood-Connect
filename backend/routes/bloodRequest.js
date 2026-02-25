const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const {
    createBloodRequest,
    getAllBloodRequests,
    getBloodRequest,
    updateRequestStatus,
    assignDonorToRequest,
    getEmergencyRequests,
    cancelBloodRequest,
    getMyBloodRequests,
    getAvailableRequests,  // Make sure this is imported
    acceptBloodRequest      // Make sure this is imported
} = require('../controllers/bloodRequestController');

// Test route
router.get('/test', (req, res) => {
    res.json({ 
        success: true,
        message: 'Blood Request API is working!',
        endpoints: {
            emergencyRequests: 'GET /api/blood-requests/emergency',
            createRequest: 'POST /api/blood-requests (protected)',
            getAllRequests: 'GET /api/blood-requests (protected)',
            getMyRequests: 'GET /api/blood-requests/my-requests (protected, donor only)'
        }
    });
});

// Validation middleware
const bloodRequestValidation = [
    body('patientName').notEmpty().withMessage('Patient name is required'),
    body('bloodGroup').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).withMessage('Valid blood group is required'),
    body('requiredUnits').isInt({ min: 1, max: 10 }).withMessage('Units must be between 1 and 10'),
    body('hospitalName').notEmpty().withMessage('Hospital name is required'),
    body('contactPerson.phone').matches(/^[0-9]{10}$/).withMessage('Valid contact phone is required'),
    body('reason').isIn(['Surgery', 'Accident', 'Chronic Illness', 'Cancer Treatment', 'Childbirth', 'Transfusion', 'Other']),
    body('neededBy').isISO8601().withMessage('Valid date is required'),
    body('priority').optional().isIn(['Normal', 'Urgent', 'Emergency'])
];

// Public routes
router.get('/emergency', getEmergencyRequests);

// All protected routes
router.use(protect);

// Create request (both donors and admins)
router.post('/', bloodRequestValidation, createBloodRequest);

// IMPORTANT: SPECIFIC ROUTES MUST COME BEFORE PARAMETERIZED ROUTES
router.get('/available', authorize('donor'), getAvailableRequests);
router.get('/my-requests', authorize('donor'), getMyBloodRequests);

// Parameterized routes (these must come AFTER specific routes)
router.get('/:id', getBloodRequest);
router.get('/', getAllBloodRequests);

// Update/cancel requests
router.put('/:id/status', authorize('admin'), updateRequestStatus);
router.put('/:id/cancel', cancelBloodRequest);
router.post('/:id/accept', authorize('donor'), acceptBloodRequest);

// Admin only routes
router.post('/:id/assign-donor', authorize('admin'), assignDonorToRequest);

module.exports = router;