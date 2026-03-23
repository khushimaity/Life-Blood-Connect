const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },

    // Organization Information
    organizationName: {
        type: String,
        required: [true, 'Please enter organization name']
    },
    adminName: {
        type: String,
        required: [true, 'Please enter admin name']
    },

    // Center Details
    centerType: {
        type: String,
        enum: ['Hospital', 'Blood Bank', 'Medical College', 'Clinic', 'NGO', 'Other'],
        required: [true, 'Please select center type']
    },
    centerCategory: {
        type: String,
        enum: ['Government', 'Private', 'Trust', 'Corporate'],
        default: 'Private'
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
        emergencyPhone: String,
        email: [String],
        website: String,
        fax: String
    },

    // License & Registration
    licenseNumber: {
        type: String,
        unique: true,
        sparse: true,
        default: null
    },
    registrationNumber: String,
    registrationAuthority: String,
    validFrom: Date,
    validUntil: Date,

    // Facilities
    facilities: [{
        name: String,
        available: Boolean,
        description: String
    }],

    // Services Offered
    services: [{
        type: String,
        enum: ['Blood Donation', 'Blood Testing', 'Blood Storage', 'Emergency Service', 'Home Collection', 'Camps']
    }],

    // Blood Storage Capacity
    storageCapacity: {
        totalUnits: Number,
        currentStock: Number,
        refrigerators: Number,
        deepFreezers: Number,
        plateletIncubators: Number
    },

    // Staff Information
    staffCount: {
        doctors: Number,
        nurses: Number,
        technicians: Number,
        administrators: Number
    },

    // Operating Hours
    operatingHours: {
        monday: { open: String, close: String },
        tuesday: { open: String, close: String },
        wednesday: { open: String, close: String },
        thursday: { open: String, close: String },
        friday: { open: String, close: String },
        saturday: { open: String, close: String },
        sunday: { open: String, close: String },
        emergency24x7: { type: Boolean, default: false }
    },

    // Verification Status
    isVerified: {
        type: Boolean,
        default: false
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verifiedAt: Date,
    verificationNotes: String,

    // Documents
    documents: [{
        type: { type: String, enum: ['License', 'Registration', 'Certificate', 'Other'] },
        url: String,
        uploadedAt: Date,
        verified: { type: Boolean, default: false }
    }],

    // Statistics
    stats: {
        totalRequests: { type: Number, default: 0 },
        fulfilledRequests: { type: Number, default: 0 },
        activeDonors: { type: Number, default: 0 },
        totalCollections: { type: Number, default: 0 },
        rating: { type: Number, default: 0, min: 0, max: 5 },
        reviews: { type: Number, default: 0 }
    },

    // Settings
    settings: {
        autoApproveRequests: { type: Boolean, default: false },
        notificationPreferences: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: true },
            push: { type: Boolean, default: true }
        },
        requestThreshold: { type: Number, default: 10 }
    },

    description: String

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for full address
adminSchema.virtual('fullAddress').get(function() {
    return `${this.location?.address || ''}, ${this.location?.city || ''}, ${this.location?.district || ''}, ${this.location?.state || ''} ${this.location?.pincode || ''}`.trim().replace(/^, |, $/g, '');
});

// Virtual for isOpen status
adminSchema.virtual('isOpen').get(function() {
    if (this.operatingHours?.emergency24x7) return true;
    
    const now = new Date();
    const day = now.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    
    if (this.operatingHours && this.operatingHours[day]) {
        const openTime = this.operatingHours[day].open;
        const closeTime = this.operatingHours[day].close;
        
        if (openTime && closeTime) {
            const open = parseInt(openTime.replace(':', ''));
            const close = parseInt(closeTime.replace(':', ''));
            return currentTime >= open && currentTime <= close;
        }
    }
    
    return false;
});

// Indexes
adminSchema.index({ "location.coordinates": "2dsphere" });
adminSchema.index({ centerType: 1, "location.city": 1 });
adminSchema.index({ isVerified: 1 });

module.exports = mongoose.model('Admin', adminSchema);