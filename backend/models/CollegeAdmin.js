const mongoose = require('mongoose');

const collegeAdminSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    
    // College Information
    collegeName: {
        type: String,
        required: [true, 'Please enter college name']
    },
    adminName: {
        type: String,
        required: [true, 'Please enter admin name']
    },
    
    // Email - IMPORTANT: Added with sparse:true to allow multiple nulls
    email: {
        type: String,
        unique: true,
        sparse: true,  // ← THIS FIXES THE DUPLICATE KEY ERROR
        lowercase: true,
        trim: true
    },
    
    // College Details
    collegeType: {
        type: String,
        enum: ['Engineering', 'Medical', 'Arts', 'Science', 'Commerce', 'Other'],
        default: 'Engineering'
    },
    
    // Location
    location: {
        address: String,
        city: String,
        district: String,
        state: String,
        pincode: String,
        coordinates: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number],
                default: [0, 0]
            }
        }
    },
    
    // Contact Information
    contactInfo: {
        phone: [String],
        email: [String],
        website: String
    },
    
    // College Stats
    stats: {
        totalDonors: { type: Number, default: 0 },
        activeDonors: { type: Number, default: 0 },
        totalCamps: { type: Number, default: 0 },
        totalDonations: { type: Number, default: 0 }
    },
    
    // Verification Status
    isVerified: {
        type: Boolean,
        default: false
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: Date
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for full address
collegeAdminSchema.virtual('fullAddress').get(function() {
    return `${this.location.address || ''}, ${this.location.city || ''}, ${this.location.district || ''}, ${this.location.state || ''} - ${this.location.pincode || ''}`.trim();
});

// Indexes
collegeAdminSchema.index({ "location.coordinates": "2dsphere" });
collegeAdminSchema.index({ collegeName: 1 });
// Add index for email
collegeAdminSchema.index({ email: 1 }, { sparse: true, unique: true });

// Pre-save middleware to update updatedAt
collegeAdminSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('CollegeAdmin', collegeAdminSchema);