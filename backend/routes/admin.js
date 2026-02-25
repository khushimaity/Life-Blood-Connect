const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController'); // ← ADD THIS LINE!

// Test route
router.get('/test', (req, res) => {
    res.json({ 
        success: true,
        message: 'Admin API is working!'
    });
});

// Public routes
router.get('/centers', adminController.getAllCenters);
router.get('/center/:id', adminController.getCenterDetails);
router.get('/search-blood', adminController.searchBlood);

// Protected routes - require admin authentication
router.use(protect);
router.use(authorize('admin'));

// Profile routes
router.get('/profile', adminController.getAdminProfile); // ← Now this will work
router.put('/profile', adminController.updateAdminProfile);

// Dashboard and stats
router.get('/dashboard', adminController.getDashboardStats);
router.get('/analytics', adminController.getCenterAnalytics);

// Center management
router.put('/verify/:id', adminController.verifyAdminCenter);

module.exports = router;