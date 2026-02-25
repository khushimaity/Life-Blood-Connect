const twilio = require('twilio');

// Initialize Twilio client
const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

/**
 * Send SMS notification
 * @param {string} to - Recipient phone number (with country code)
 * @param {string} message - SMS content
 * @returns {Promise<boolean>} - Success status
 */
const sendSMS = async (to, message) => {
    try {
        // Ensure phone number has country code
        const formattedNumber = to.startsWith('+') ? to : `+91${to}`; // Default to India (+91)
        
        const result = await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: formattedNumber
        });
        
        console.log('✅ SMS sent:', result.sid);
        return true;
    } catch (error) {
        console.error('❌ SMS sending error:', error);
        return false;
    }
};

/**
 * Send bulk SMS to multiple recipients
 * @param {Array<string>} numbers - Array of phone numbers
 * @param {string} message - SMS content
 * @returns {Promise<Array>} - Results for each number
 */
const sendBulkSMS = async (numbers, message) => {
    const results = await Promise.allSettled(
        numbers.map(number => sendSMS(number, message))
    );
    
    return results.map((result, index) => ({
        number: numbers[index],
        success: result.status === 'fulfilled' && result.value,
        error: result.reason?.message
    }));
};

/**
 * SMS Templates for different scenarios
 */
const smsTemplates = {
    // Emergency request to nearby donors
    emergencyAlert: (patientName, bloodGroup, hospital, contact) => `
🚨 EMERGENCY BLOOD NEEDED!
Patient: ${patientName}
Blood Group: ${bloodGroup}
Hospital: ${hospital}
Contact: ${contact}
Please respond if you can donate. Lifeblood Connect
    `.trim(),

    // Donor accepted request
    requestAccepted: (patientName, hospital) => `
✅ You've accepted a blood request!
Patient: ${patientName}
Hospital: ${hospital}
The hospital will contact you shortly.
Thank you for saving lives! 🩸
    `.trim(),

    // Donation reminder
    donationReminder: (nextEligibleDate) => `
🩸 You're eligible to donate again!
Next donation date: ${nextEligibleDate}
Visit your nearest blood bank today.
Every donation saves 3 lives!
    `.trim(),

    // Request fulfilled
    requestFulfilled: (patientName) => `
🎉 The blood request for ${patientName} has been fulfilled!
Thank you for your contribution.
You're a hero! 💪
    `.trim(),

    // New donor welcome
    welcomeDonor: (name) => `
Welcome to Lifeblood Connect, ${name}!
Thank you for registering as a donor.
You'll receive alerts for emergency needs.
    `.trim(),

    // Emergency request creation confirmation
    emergencyCreated: (requestId, bloodGroup) => `
🚨 Emergency request created!
Request ID: ${requestId}
Blood Group: ${bloodGroup}
Donors in your area have been notified.
    `.trim()
};

/**
 * Send emergency alert to matching donors
 * @param {Array} donors - List of donor objects with phone numbers
 * @param {Object} request - Blood request details
 */
const notifyMatchingDonors = async (donors, request) => {
    const phoneNumbers = donors
        .map(d => d.userId?.phone)
        .filter(phone => phone && phone.length === 10);
    
    if (phoneNumbers.length === 0) return [];
    
    const message = smsTemplates.emergencyAlert(
        request.patientName,
        request.bloodGroup,
        request.hospitalName,
        request.contactPerson?.phone
    );
    
    return await sendBulkSMS(phoneNumbers, message);
};

module.exports = {
    sendSMS,
    sendBulkSMS,
    smsTemplates,
    notifyMatchingDonors
};