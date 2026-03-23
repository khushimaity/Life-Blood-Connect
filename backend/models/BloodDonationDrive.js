const mongoose = require('mongoose');

const bloodDonationDriveSchema = new mongoose.Schema({
    // College Reference
    collegeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CollegeAdmin',
        required: true
    },
    
    // Basic Information
    driveName: {
        type: String,
        required: [true, 'Drive name is required'],
        trim: true
    },
    driveDate: {
        type: Date,
        required: [true, 'Drive date is required']
    },
    driveTime: {
        type: String,
        required: [true, 'Drive time is required'],
        trim: true
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true
    },
    
    // Donor Information
    targetDonors: {
        type: Number,
        required: [true, 'Target donors is required'],
        min: [1, 'Target donors must be at least 1']
    },
    registeredDonors: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Coordinator Details
    coordinatorName: {
        type: String,
        trim: true
    },
    coordinatorPhone: {
        type: String,
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    },
    
    // Additional Information
    description: {
        type: String,
        trim: true
    },
    facilities: [{
        type: String,
        enum: ['bp', 'hb', 'refreshments', 'certificate', 'transport', 'medical']
    }],
    bloodGroupsNeeded: [{
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    }],
    
    // Status
    status: {
        type: String,
        enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'],
        default: 'Upcoming'
    },
    
    organizedBy: {
        type: String,
        trim: true
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual to check if drive is upcoming
bloodDonationDriveSchema.virtual('isUpcoming').get(function() {
    const now = new Date();
    const driveDate = new Date(this.driveDate);
    return driveDate > now && this.status === 'Upcoming';
});

// Virtual to check if drive is ongoing
bloodDonationDriveSchema.virtual('isOngoing').get(function() {
    const now = new Date();
    const driveDate = new Date(this.driveDate);
    const driveEndDate = new Date(driveDate);
    driveEndDate.setHours(23, 59, 59, 999);
    
    return driveDate <= now && driveEndDate >= now && this.status === 'Ongoing';
});

// Virtual to check if drive is completed
bloodDonationDriveSchema.virtual('isCompleted').get(function() {
    const now = new Date();
    const driveDate = new Date(this.driveDate);
    const driveEndDate = new Date(driveDate);
    driveEndDate.setHours(23, 59, 59, 999);
    
    return driveEndDate < now || this.status === 'Completed';
});

// Virtual to get registration percentage
bloodDonationDriveSchema.virtual('registrationPercentage').get(function() {
    if (this.targetDonors === 0) return 0;
    return Math.min(Math.round((this.registeredDonors / this.targetDonors) * 100), 100);
});

// Pre-save middleware to update updatedAt
bloodDonationDriveSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Method to register a donor
bloodDonationDriveSchema.methods.registerDonor = async function() {
    if (this.registeredDonors < this.targetDonors) {
        this.registeredDonors += 1;
        return await this.save();
    }
    throw new Error('Drive has reached maximum capacity');
};

// Method to update status based on date
bloodDonationDriveSchema.methods.updateStatus = async function() {
    const now = new Date();
    const driveDate = new Date(this.driveDate);
    const driveEndDate = new Date(driveDate);
    driveEndDate.setHours(23, 59, 59, 999);
    
    if (this.status === 'Cancelled') return;
    
    if (driveEndDate < now) {
        this.status = 'Completed';
    } else if (driveDate <= now && driveEndDate >= now) {
        this.status = 'Ongoing';
    } else if (driveDate > now) {
        this.status = 'Upcoming';
    }
    
    return await this.save();
};

// Static method to get upcoming drives
bloodDonationDriveSchema.statics.getUpcomingDrives = function(collegeId, limit = 5) {
    return this.find({
        collegeId,
        status: 'Upcoming',
        driveDate: { $gte: new Date() }
    })
    .sort({ driveDate: 1 })
    .limit(limit);
};

// Static method to get drive statistics for a college
bloodDonationDriveSchema.statics.getDriveStats = async function(collegeId) {
    const stats = await this.aggregate([
        { $match: { collegeId: mongoose.Types.ObjectId(collegeId) } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalRegistered: { $sum: '$registeredDonors' },
                totalTarget: { $sum: '$targetDonors' }
            }
        }
    ]);
    
    const result = {
        total: 0,
        upcoming: 0,
        ongoing: 0,
        completed: 0,
        cancelled: 0,
        totalRegistered: 0,
        totalTarget: 0
    };
    
    stats.forEach(stat => {
        result.total += stat.count;
        result.totalRegistered += stat.totalRegistered || 0;
        result.totalTarget += stat.totalTarget || 0;
        
        switch(stat._id) {
            case 'Upcoming':
                result.upcoming = stat.count;
                break;
            case 'Ongoing':
                result.ongoing = stat.count;
                break;
            case 'Completed':
                result.completed = stat.count;
                break;
            case 'Cancelled':
                result.cancelled = stat.count;
                break;
        }
    });
    
    return result;
};

// Indexes for better query performance
bloodDonationDriveSchema.index({ collegeId: 1, driveDate: -1 });
bloodDonationDriveSchema.index({ status: 1, driveDate: 1 });
bloodDonationDriveSchema.index({ coordinatorPhone: 1 });

module.exports = mongoose.model('BloodDonationDrive', bloodDonationDriveSchema);