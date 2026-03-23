const express = require('express');
const router = express.Router();
const {
    createEmergencyRequest,
    getEmergencyRequests,
    getEmergencyRequestById,
    updateEmergencyStatus,
    respondToEmergency,
    debugDonors
} = require('../controllers/emergencyController');
const { protect, authorize } = require('../middleware/auth'); // ✅ Import authorize

// Public routes (with authentication)
router.get('/', protect, getEmergencyRequests);
router.get('/debug', protect, authorize('admin'), debugDonors); // ✅ Use authorize('admin') instead of adminOnly
router.get('/:id', protect, getEmergencyRequestById);

// Protected routes (admin only)
router.post('/', protect, authorize('admin'), createEmergencyRequest); // ✅ Use authorize('admin')
router.put('/:id/status', protect, authorize('admin'), updateEmergencyStatus); // ✅ Use authorize('admin')

// Donor response route
router.post('/:id/respond', protect, respondToEmergency);

module.exports = router;