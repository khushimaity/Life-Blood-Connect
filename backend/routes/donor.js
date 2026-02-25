const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getAllDonors,
    getDonorById,
    getMyProfile,
    updateDonorProfile,
    findDonors,
    getDonationHistory,
    updateAvailability,
    getNearbyDonors,
    getDonorCountBefore  // Make sure to import this if you have it
} = require('../controllers/donorController');

// All routes are protected
router.use(protect);

// Test route
router.get('/test', (req, res) => {
    res.json({ 
        success: true,
        message: 'Donor API is working!',
        endpoints: {
            findDonors: 'GET /api/donors/find',
            nearbyDonors: 'GET /api/donors/nearby',
            myProfile: 'GET /api/donors/profile/me (protected, donor only)',
            updateProfile: 'PUT /api/donors/profile (protected, donor only)',
            donationHistory: 'GET /api/donors/donation-history (protected, donor only)'
        }
    });
});

// ============= SPECIFIC ROUTES (must come before /:id) =============

// Donor only routes - specific paths
router.get('/profile/me', authorize('donor'), getMyProfile);
router.put('/profile', authorize('donor'), updateDonorProfile);
router.get('/donation-history', authorize('donor'), getDonationHistory);
router.put('/availability', authorize('donor'), updateAvailability);

// Public access routes (but requires authentication)
router.get('/find', findDonors);  // Changed from '/find/donors' to '/find'
router.get('/nearby', getNearbyDonors);

// Add this if you have the count-before endpoint
router.get('/count-before', authorize('donor'), getDonorCountBefore);

// ============= PARAMETERIZED ROUTES (must come AFTER specific routes) =============

// Get donor by ID - this must be LAST because it catches any route with a parameter
router.get('/:id', getDonorById);

// Admin only route for getting all donors
router.get('/', authorize('admin'), getAllDonors);

module.exports = router;