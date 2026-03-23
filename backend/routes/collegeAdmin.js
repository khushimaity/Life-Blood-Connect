const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const collegeAdminController = require('../controllers/collegeAdminController');

// Test route
router.get('/test', (req, res) => {
    res.json({ 
        success: true,
        message: 'College Admin API is working!'
    });
});

// Public routes
router.get('/public-drives', collegeAdminController.getPublicDonationDrives);

// Protected routes
router.use(protect);
router.use(authorize('college_admin'));

// Profile routes
router.get('/profile', collegeAdminController.getCollegeAdminProfile);
router.put('/profile', collegeAdminController.updateCollegeAdminProfile);

// Dashboard
router.get('/dashboard', collegeAdminController.getDashboardStats);

// Donation drive management
router.post('/drives', collegeAdminController.createDonationDrive);
router.get('/drives', collegeAdminController.getDonationDrives);
router.put('/drives/:id', collegeAdminController.updateDonationDrive);
router.delete('/drives/:id', collegeAdminController.deleteDonationDrive);

module.exports = router;