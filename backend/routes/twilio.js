const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const { protect } = require('../middleware/auth');

// In-memory store for verification codes (in production, use Redis or database)
const verificationStore = new Map();

// Initialize Twilio client
const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

/**
 * @route   POST /api/twilio/request-verification
 * @desc    Request SMS verification code
 * @access  Public (or protected if you want only logged-in users)
 */
router.post('/request-verification', async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        // Format phone number (add country code if not present)
        const formattedNumber = phoneNumber.startsWith('+') 
            ? phoneNumber 
            : `+91${phoneNumber}`; // Default to India

        // Generate a 6-digit random code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Store code with expiration (10 minutes)
        verificationStore.set(formattedNumber, {
            code: verificationCode,
            expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
            attempts: 0
        });

        // Send SMS with verification code
        try {
            await client.messages.create({
                body: `Your Lifeblood Connect verification code is: ${verificationCode}. Valid for 10 minutes.`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: formattedNumber
            });

            console.log(`✅ Verification code sent to ${formattedNumber}`);
            
            res.status(200).json({
                success: true,
                message: 'Verification code sent successfully'
            });
        } catch (twilioError) {
            console.error('Twilio error:', twilioError);
            
            // For development/testing - return the code in response
            if (process.env.NODE_ENV === 'development') {
                return res.status(200).json({
                    success: true,
                    message: 'DEV MODE - Code sent',
                    devCode: verificationCode // ONLY for testing!
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Failed to send verification code',
                error: twilioError.message
            });
        }

    } catch (error) {
        console.error('Verification request error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/twilio/verify-code
 * @desc    Verify SMS code
 * @access  Public
 */
router.post('/verify-code', async (req, res) => {
    try {
        const { phoneNumber, code } = req.body;

        if (!phoneNumber || !code) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and code are required'
            });
        }

        const formattedNumber = phoneNumber.startsWith('+') 
            ? phoneNumber 
            : `+91${phoneNumber}`;

        const storedData = verificationStore.get(formattedNumber);

        if (!storedData) {
            return res.status(400).json({
                success: false,
                message: 'No verification code found for this number. Please request a new code.'
            });
        }

        // Check if code has expired
        if (Date.now() > storedData.expiresAt) {
            verificationStore.delete(formattedNumber);
            return res.status(400).json({
                success: false,
                message: 'Verification code has expired. Please request a new one.'
            });
        }

        // Check attempts (prevent brute force)
        storedData.attempts += 1;
        if (storedData.attempts > 5) {
            verificationStore.delete(formattedNumber);
            return res.status(400).json({
                success: false,
                message: 'Too many failed attempts. Please request a new code.'
            });
        }

        // Verify code
        if (storedData.code === code) {
            // Code verified - remove from store
            verificationStore.delete(formattedNumber);
            
            res.status(200).json({
                success: true,
                message: 'Phone number verified successfully'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid verification code'
            });
        }

    } catch (error) {
        console.error('Code verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;