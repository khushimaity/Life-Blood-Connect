const User = require('../models/User');
const Donor = require('../models/Donor');
const Admin = require('../models/Admin');
const generateToken = require('../utils/generateToken');
const { validationResult } = require('express-validator');

// @desc    Register a new donor
// @route   POST /api/auth/register/donor
// @access  Public
exports.registerDonor = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password, phone, bloodGroup, ...donorData } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            phone,
            bloodGroup,
            role: 'donor'
        });

        // Create donor profile
        // Create donor profile - ONLY donor-specific fields
        const donor = await Donor.create({
            userId: user._id,
            age: donorData.age,
            gender: donorData.gender,
            guardianName: donorData.guardianName,
            guardianPhone: donorData.guardianPhone,
            guardianRelation: donorData.guardianRelation,
            collegeDetails: donorData.collegeDetails,
            address: donorData.address || {
                city: donorData.collegeDetails?.district || '',
                district: donorData.collegeDetails?.district || '',
                state: donorData.collegeDetails?.state || ''
            }
        });

        // Generate token
        const token = generateToken(user._id, user.role);

        // Update last login
        await user.updateLastLogin();

        res.status(201).json({
            success: true,
            message: 'Donor registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                bloodGroup: user.bloodGroup,
                role: user.role
            },
            donorProfile: donor
        });
    } catch (error) {
        console.error('Register donor error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Register a new admin/hospital
// @route   POST /api/auth/register/admin
// @access  Public
// @desc    Register a new admin/hospital
// @route   POST /api/auth/register/admin
// @access  Public
exports.registerAdmin = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // ✅ DESTRUCTURE ALL FIELDS explicitly
        const { 
            adminName, 
            organizationName, 
            email, 
            password, 
            phone, 
            centerType,      // ← ADD THIS
            location,        // ← ADD THIS
            ...adminData     // ← Any additional fields
        } = req.body;

        console.log('Registration data received:', { 
            adminName, 
            organizationName, 
            email, 
            phone, 
            centerType,
            location 
        });

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Create user
        const user = await User.create({
            name: adminName,
            email,
            password,
            phone,
            role: 'admin'
        });

        console.log('User created successfully:', user._id);

        // Create admin profile with ALL fields
        const admin = await Admin.create({
            userId: user._id,
            adminName,
            organizationName,
            centerType,                    // ← NOW INCLUDED
            location: location || {        // ← NOW INCLUDED with fallback
                city: '',
                district: '',
                state: '',
                address: ''
            },
            ...adminData
        });

        console.log('Admin profile created successfully:', admin._id);

        // Generate token
        const token = generateToken(user._id, user.role);

        // Update last login
        await user.updateLastLogin();

        res.status(201).json({
            success: true,
            message: 'Admin registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            },
            adminProfile: admin
        });
    } catch (error) {
        console.error('Register admin error:', error);
        
        // If admin creation failed but user was created, clean up
        if (error.name === 'ValidationError' || error.code === 11000) {
            // Try to delete the user if it was created
            try {
                const user = await User.findOne({ email: req.body.email });
                if (user) await User.findByIdAndDelete(user._id);
            } catch (cleanupError) {
                console.error('Cleanup error:', cleanupError);
            }
        }

        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password, isAdmin } = req.body;

        // Validate
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Check if user exists
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Check if role matches
        if (isAdmin && user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin login required'
            });
        }

        if (!isAdmin && user.role !== 'donor') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Donor login required'
            });
        }

        // Check password
        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate token
        const token = generateToken(user._id, user.role);

        // Update last login
        await user.updateLastLogin();

        // Get profile based on role
        let profile = null;
        if (user.role === 'donor') {
            profile = await Donor.findOne({ userId: user._id });
        } else if (user.role === 'admin') {
            profile = await Admin.findOne({ userId: user._id });
        }

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                bloodGroup: user.bloodGroup,
                role: user.role,
                isVerified: user.isVerified
            },
            profile
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get profile based on role
        let profile = null;
        if (user.role === 'donor') {
            profile = await Donor.findOne({ userId: user._id });
        } else if (user.role === 'admin') {
            profile = await Admin.findOne({ userId: user._id });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                bloodGroup: user.bloodGroup,
                role: user.role,
                isVerified: user.isVerified,
                createdAt: user.createdAt
            },
            profile
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
    try {
        // In JWT-based auth, logout is handled client-side by removing token
        // But we can add blacklisting logic here if needed
        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, bloodGroup } = req.body;
        
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update user fields
        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (bloodGroup) user.bloodGroup = bloodGroup;

        await user.save();

        // Update profile based on role
        if (user.role === 'donor') {
            const donor = await Donor.findOne({ userId: user._id });
            if (donor && req.body.donorData) {
                Object.assign(donor, req.body.donorData);
                await donor.save();
            }
        } else if (user.role === 'admin') {
            const admin = await Admin.findOne({ userId: user._id });
            if (admin && req.body.adminData) {
                Object.assign(admin, req.body.adminData);
                await admin.save();
            }
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                bloodGroup: user.bloodGroup,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new password'
            });
        }

        const user = await User.findById(req.user.id).select('+password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};