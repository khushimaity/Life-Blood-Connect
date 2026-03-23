const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// ================= TEST ROUTE =================
router.get('/test', (req, res) => {
    res.json({ 
        success: true,
        message: 'Admin API is working!'
    });
});

// ================= PUBLIC ROUTES =================
router.get('/centers', adminController.getAllCenters);
router.get('/center/:id', adminController.getCenterDetails);
router.get('/search-blood', adminController.searchBlood);

// ================= PROTECTED ROUTES (require admin auth) =================
router.use(protect);
router.use(authorize('admin'));

// Profile routes
router.get('/profile', adminController.getAdminProfile);
router.put('/profile', adminController.updateAdminProfile);

// Dashboard and stats
router.get('/dashboard', adminController.getDashboardStats);  // Detailed dashboard
router.get('/dashboard-stats', adminController.getDashboard); // Simple dashboard stats
router.get('/analytics', adminController.getCenterAnalytics);

// Center management
router.put('/verify/:id', adminController.verifyAdminCenter);

module.exports = router;