const twilio = require('twilio');
const Donor = require('../models/Donor');
const { canDonateTo } = require('./bloodCompatibility');

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

/**
 * Send single SMS
 */
const sendSMS = async (to, message) => {
    try {
        return await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to
        });
    } catch (error) {
        console.error("Twilio Error:", error.message);
        throw error;
    }
};


/**
 * Find nearby donors (used by bloodRequestController)
 */
 const findNearbyDonors = async (requiredBloodGroup, coordinates, radiusKm) => {

   if (!coordinates || coordinates.length !== 2) {
    console.log("❌ No coordinates provided");
    return [];
}

const [longitude, latitude] = coordinates;

    console.log("📍 Searching within 10km of:", latitude, longitude);

    const radiusInMeters = radiusKm * 1000;

    const donors = await Donor.find({
        isAvailable: true,
        'address.coordinates': {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [longitude, latitude]
                },
                $maxDistance: radiusInMeters
            }
        }
    }).populate('userId', 'name phone bloodGroup');

    console.log("Raw nearby donors:", donors.length);

    const compatibleDonors = donors.filter(donor =>
        donor.userId?.bloodGroup &&
        canDonateTo(donor.userId.bloodGroup, requiredBloodGroup)
    );

    console.log("Compatible nearby donors:", compatibleDonors.length);

    return compatibleDonors;
};


/**
 * Send emergency alert to donors
 */
const sendEmergencyAlert = async (request, donors) => {

    let result = {
        notified: donors.length,
        successful: 0,
        failed: 0
    };

    for (let donor of donors) {
        try {

            let phone = donor.userId?.phone;

if (phone && !phone.startsWith('+')) {
    phone = `+91${phone}`;
}
            if (!phone) continue;

            const message = `🚨 URGENT BLOOD REQUEST

Blood Group Needed: ${request.bloodGroup}
Hospital: ${request.hospitalName}
Area: ${request.area}
City: ${request.city}

Please login and respond immediately.`;

            await sendSMS(phone, message);

            result.successful++;

        } catch (error) {
            result.failed++;
        }
    }

    return result;
};

module.exports = {
    sendSMS,
    findNearbyDonors,
    sendEmergencyAlert
};