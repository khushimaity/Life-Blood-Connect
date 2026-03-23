const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const {
    registerDonor,
    registerAdmin,
    registerCollegeAdmin,
    login,
    getMe,
    logout,
    updateProfile,
    changePassword
} = require('../controllers/authController');

router.get('/test', (req, res) => {
    res.json({ 
        success: true,
        message: 'Auth API is working!',
        endpoints: {
            registerDonor: 'POST /api/auth/register/donor',
            registerAdmin: 'POST /api/auth/register/admin',
            registerCollegeAdmin: 'POST /api/auth/register/college-admin',
            login: 'POST /api/auth/login',
            getMe: 'GET /api/auth/me (protected)',
            logout: 'POST /api/auth/logout (protected)'
        }
    });
});

// Validation middleware
const donorRegisterValidation = [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').matches(/^[0-9]{10}$/).withMessage('Please enter a valid 10-digit phone number'),
    body('bloodGroup').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    body('age').isInt({ min: 18, max: 65 }).withMessage('Age must be between 18 and 65'),
    body('gender').isIn(['Male', 'Female', 'Other', 'Prefer not to say']).withMessage('Please select valid gender')
];

const adminRegisterValidation = [
    body('adminName').notEmpty().withMessage('Admin name is required'),
    body('organizationName').notEmpty().withMessage('Organization name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').matches(/^[0-9]{10}$/).withMessage('Please enter a valid 10-digit phone number'),
    body('centerType').isIn(['Hospital', 'Blood Bank', 'Medical College', 'Clinic', 'NGO', 'Other']),
    body('location.city').notEmpty().withMessage('City is required')
];

// College Admin Validation
const collegeAdminValidation = [
    body('collegeName').notEmpty().withMessage('College name is required'),
    body('adminName').notEmpty().withMessage('Admin name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional().matches(/^[0-9]{10}$/).withMessage('Please enter a valid 10-digit phone number')
];

const loginValidation = [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
];

// Public routes
router.post('/register/donor', donorRegisterValidation, registerDonor);
router.post('/register/admin', adminRegisterValidation, registerAdmin);
router.post('/register/college-admin', collegeAdminValidation, registerCollegeAdmin);
router.post('/login', loginValidation, login);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;