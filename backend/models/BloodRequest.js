const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
    // Request Identification
    requestId: {
        type: String,
        unique: true,
        uppercase: true,
        match: [/^REQ\d{6}$/, 'Invalid request ID format']
    },

    // Patient Information
    patientName: {
        type: String,
        required: [true, 'Please enter patient name'],
        trim: true
    },
    patientAge: Number,
    patientGender: {
        type: String,
        enum: ['Male', 'Female', 'Other']
    },

    // Blood Requirement
    bloodGroup: {
        type: String,
        required: [true, 'Please select blood group'],
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    requiredUnits: {
        type: Number,
        required: [true, 'Please enter required units'],
        min: [1, 'Minimum 1 unit required'],
        max: [10, 'Maximum 10 units per request']
    },
    componentType: {
        type: String,
        enum: ['Whole Blood', 'Packed RBC', 'Platelets', 'Plasma', 'Cryoprecipitate', 'Not Specified'],
        default: 'Whole Blood'
    },

    // Hospital & Location
    hospitalName: {
        type: String,
        required: [true, 'Please enter hospital name']
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    location: {
        address: String,
        city: String,
        district: String,
        state: String,
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    },

    // Contact Information
    contactPerson: {
        name: String,
        phone: {
            type: String,
            required: [true, 'Please enter contact phone'],
            match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
        },
        relationship: String
    },
    alternateContact: String,

    // Request Details
    reason: {
        type: String,
        required: [true, 'Please enter reason for request'],
        enum: ['Surgery', 'Accident', 'Chronic Illness', 'Cancer Treatment', 'Childbirth', 'Transfusion', 'Other']
    },
    reasonDetails: String,
    priority: {
        type: String,
        enum: ['Normal', 'Urgent', 'Emergency'],
        default: 'Normal'
    },
    neededBy: {
        type: Date,
        required: [true, 'Please specify when blood is needed']
    },
    notes: String,

    // Status Tracking
    status: {
        type: String,
        
        enum: ['Pending', 'Approved', 'Processing', 'Completed', 'Cancelled', 'Expired'],
        default: 'Pending'
    },
    statusHistory: [{
        status: String,
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        changedAt: {
            type: Date,
            default: Date.now
        },
        notes: String
    }],

    // Assignment & Fulfillment
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assignedAt: Date,

    // Fulfillment Details
    fulfilledUnits: {
        type: Number,
        default: 0
    },
    donors: [{
        donorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Donor'
        },
        unitsDonated: Number,
        donationDate: Date
    }],

    // Track donors who have volunteered/accepted the request
    acceptedDonors: [{
        donorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Donor',
            required: true
        },
        acceptedAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['Volunteered', 'Scheduled', 'Donated', 'Cancelled'],
            default: 'Volunteered'
        },
        notes: String
    }],

    // Selected donor (final choice)
    selectedDonor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Donor',
        default: null
    },

    // Requestor Information
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Emergency Notifications
    emergencyNotifications: {
        sentAt: Date,
        donorCount: Number,
        successful: Number,
        failed: Number
    },
    notifiedDonors: {
        type: Number,
        default: 0
    },

    // Documents
    documents: [{
        type: { type: String, enum: ['Prescription', 'Medical Report', 'ID Proof', 'Other'] },
        url: String,
        uploadedAt: Date
    }],

    completedAt: Date

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Auto-generate Request ID
bloodRequestSchema.pre('save', async function(next) {
    if (!this.requestId) {
        const lastRequest = await this.constructor.findOne().sort({ createdAt: -1 });
        const lastNumber = lastRequest ? parseInt(lastRequest.requestId.replace('REQ', '')) : 0;
        this.requestId = 'REQ' + String(lastNumber + 1).padStart(6, '0');
    }
    next();
});

// Virtual for remaining units
bloodRequestSchema.virtual('remainingUnits').get(function() {
    return this.requiredUnits - this.fulfilledUnits;
});

// Virtual for time remaining
bloodRequestSchema.virtual('timeRemaining').get(function() {
    if (this.status === 'Completed' || this.status === 'Cancelled') return null;
    
    const now = new Date();
    const needed = new Date(this.neededBy);
    const diffMs = needed - now;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return { days: diffDays, hours: diffHours };
});

// Virtual for urgency level
bloodRequestSchema.virtual('urgencyLevel').get(function() {
    if (this.status !== 'Pending' && this.status !== 'Approved') return 'none';
    
    const now = new Date();
    const needed = new Date(this.neededBy);
    const hoursRemaining = (needed - now) / (1000 * 60 * 60);
    
    if (hoursRemaining <= 6) return 'critical';
    if (hoursRemaining <= 24) return 'high';
    if (hoursRemaining <= 48) return 'medium';
    return 'low';
});

// Virtual for accepted donors count
bloodRequestSchema.virtual('acceptedDonorsCount').get(function() {
    return this.acceptedDonors?.length || 0;
});

// Method to check if a specific donor has accepted
bloodRequestSchema.methods.hasDonorAccepted = function(donorId) {
    return this.acceptedDonors?.some(
        d => d.donorId && d.donorId.toString() === donorId.toString()
    );
};

// Method to update status with history
bloodRequestSchema.methods.updateStatus = async function(newStatus, changedBy, notes = '') {
    this.status = newStatus;
    
    if (!this.statusHistory) {
        this.statusHistory = [];
    }
    
    this.statusHistory.push({
        status: newStatus,
        changedBy: changedBy,
        notes: notes,
        changedAt: new Date()
    });
    
    if (newStatus === 'Completed') {
        this.completedAt = new Date();
    }
    
    return await this.save();
};

// Method to add a donor to accepted list
bloodRequestSchema.methods.addAcceptedDonor = async function(donorId, notes = '') {
    if (!this.acceptedDonors) {
        this.acceptedDonors = [];
    }
    
    // Check if already accepted
    const alreadyAccepted = this.acceptedDonors.some(
        d => d.donorId && d.donorId.toString() === donorId.toString()
    );
    
    if (alreadyAccepted) {
        throw new Error('Donor has already accepted this request');
    }
    
    this.acceptedDonors.push({
        donorId: donorId,
        acceptedAt: new Date(),
        status: 'Volunteered',
        notes: notes
    });
    
    return await this.save();
};

// Method to update accepted donor status
bloodRequestSchema.methods.updateAcceptedDonorStatus = async function(donorId, newStatus, notes = '') {
    const donorEntry = this.acceptedDonors?.find(
        d => d.donorId && d.donorId.toString() === donorId.toString()
    );
    
    if (donorEntry) {
        donorEntry.status = newStatus;
        if (notes) donorEntry.notes = notes;
        return await this.save();
    }
    
    throw new Error('Donor not found in accepted list');
};

// Method to select a donor
bloodRequestSchema.methods.selectDonor = async function(donorId) {
    this.selectedDonor = donorId;
    this.status = 'Confirmed';
    return await this.save();
};

// Indexes
bloodRequestSchema.index({ bloodGroup: 1, status: 1 });
bloodRequestSchema.index({ hospitalId: 1, createdAt: -1 });
bloodRequestSchema.index({ neededBy: 1 });
bloodRequestSchema.index({ "location.city": 1, status: 1 });
bloodRequestSchema.index({ "acceptedDonors.donorId": 1 });
bloodRequestSchema.index({ priority: -1, neededBy: 1 });

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);