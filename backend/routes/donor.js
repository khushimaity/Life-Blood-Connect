const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const donorController = require('../controllers/donorController');

const {
    getAllDonors,
    getDonorById,
    getMyProfile,
    updateDonorProfile,
    findDonors,
    getDonationHistory,
    updateAvailability,
    getNearbyDonors,
    getDonorCountBefore,
    getLeaderboard,
    markDonationCompleted
} = donorController;

router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Donor API test working!' });
});

// Public routes
router.get('/leaderboard', getLeaderboard);
router.get('/find', findDonors);
router.get('/nearby', getNearbyDonors);

// Protected routes
router.use(protect);

// Donor specific routes
router.get('/profile/me', authorize('donor'), getMyProfile);
router.put('/profile', authorize('donor'), updateDonorProfile);
router.get('/donation-history', authorize('donor'), getDonationHistory);
router.put('/availability', authorize('donor'), updateAvailability);
router.get('/count-before', authorize('donor'), getDonorCountBefore);

// Admin routes
router.put('/mark-donated', authorize('admin'), markDonationCompleted);
router.get('/', authorize('admin'), getAllDonors);

// Parameterized route
router.get('/:id', getDonorById);

module.exports = router;

// Export router
module.exports = router;