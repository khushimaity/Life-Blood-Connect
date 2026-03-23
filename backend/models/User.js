const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
    // Personal Information
    name: {
        type: String,
        required: [true, 'Please enter your name'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Please enter your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please enter a password'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    phone: {
        type: String,
        required: [true, 'Please enter your phone number'],
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', null],
        default: null
    },
    
    // Role Management
    role: {
        type: String,
        enum: ['donor', 'admin', 'hospital_admin', 'college_admin'],
        default: 'donor'
    },
    
    // Account Status
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    verificationTokenExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual populate
userSchema.virtual('donorProfile', {
    ref: 'Donor',
    localField: '_id',
    foreignField: 'userId',
    justOne: true
});

userSchema.virtual('adminProfile', {
    ref: 'Admin',
    localField: '_id',
    foreignField: 'userId',
    justOne: true
});

userSchema.virtual('collegeAdminProfile', {
    ref: 'CollegeAdmin',
    localField: '_id',
    foreignField: 'userId',
    justOne: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Update last login on successful login
userSchema.methods.updateLastLogin = async function() {
    this.lastLogin = Date.now();
    await this.save({ validateBeforeSave: false });
};

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate password reset token
userSchema.methods.getResetPasswordToken = function() {
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    return resetToken;
};

module.exports = mongoose.model('User', userSchema);