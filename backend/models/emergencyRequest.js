const mongoose = require('mongoose');

const emergencyRequestSchema = new mongoose.Schema({
    bloodGroup: {
        type: String,
        required: true,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    patientName: {
        type: String,
        required: true
    },
    hospitalName: {
        type: String,
        required: true
    },
    hospitalAddress: {
        type: String,
        required: true
    },
    area: {
        type: String,
        required: true
    },
    city: {
        type: String,
        default: 'Mumbai'
    },
    coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere'
    },
    contactPerson: {
        name: String,
        phone: {
            type: String,
            required: true
        },
        relationship: String
    },
    urgencyLevel: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'high'
    },
    units: {
        type: Number,
        default: 1
    },
    status: {
        type: String,
        enum: ['active', 'fulfilled', 'cancelled', 'expired'],
        default: 'active'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    notifiedDonors: {
        type: Number,
        default: 0
    },
    respondedDonors: [{
        donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor' },
        respondedAt: Date,
        status: String
    }],
    expiresAt: {
        type: Date,
        default: () => new Date(+new Date() + 24*60*60*1000) // 24 hours from now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('EmergencyRequest', emergencyRequestSchema);