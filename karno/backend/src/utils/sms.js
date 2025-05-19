// SMS sending utility for verification codes using SMS.ir API
import axios from 'axios';

// Get SMS.ir API key from environment variables or use fallback for development
// IMPORTANT: In production, always set this as an environment variable
const SMS_API_KEY = process.env.SMS_API_KEY || 'NfDnjSqA6JIfoTdvNGL8hniWGiKII1cqRIq4lfDObPds8Xxk';

// SMS.ir template ID - should be set to your actual template ID
const SMS_TEMPLATE_ID = process.env.SMS_TEMPLATE_ID || 100000;

/**
 * Format Iranian phone number for SMS.ir (10 digits, no country code or leading zero)
 * @param {string} phone - Phone number (with or without country code/zero)
 * @returns {string} - 10-digit phone number
 */
function formatIranianPhone(phone) {
  // Remove country code if present
  let p = phone.replace(/^\+98|^0098|^098|^98/, '');
  // Remove leading zero
  if (p.startsWith('0')) p = p.substring(1);
  // Should now be 10 digits starting with '9'
  return p;
}

/**
 * Send SMS verification code to a phone number using SMS.ir API
 * @param {string} phone - Phone number (without country code)
 * @param {string} code - Verification code to send
 * @returns {Promise<boolean>} - Success status
 */
export const sendSmsVerification = async (phone, code) => {
  try {
    // Always log the code for debugging (mask part of the code in production)
    const maskedCode = process.env.NODE_ENV === 'production'
      ? `${code.substring(0, 2)}****`
      : code;
    console.log(`[SMS] Sending verification code ${maskedCode} to ${phone}`);

    // Format phone number for SMS.ir API (ensure it's 10 digits without leading zero)
    const formattedPhone = formatIranianPhone(phone);
    if (formattedPhone.length !== 10 || !formattedPhone.startsWith('9')) {
      console.warn(`[SMS] Phone number format may be incorrect: ${formattedPhone}`);
    }

    // In development, don't actually send SMS unless explicitly enabled
    // To enable SMS sending in development, set ENABLE_SMS_IN_DEV=true in your .env
    if (process.env.NODE_ENV !== 'production' && !process.env.ENABLE_SMS_IN_DEV) {
      console.log('[SMS] Development mode - SMS not actually sent');
      return true; // Always succeed in development
    }

    // Prepare the SMS.ir API request data
    // Make sure your SMS.ir template expects PARAMETER1 and PARAMETER2 as the code
    const data = JSON.stringify({
      mobile: formattedPhone, // Send as 10-digit format without country code
      templateId: SMS_TEMPLATE_ID, // Use the template ID from config
      parameters: [
        { name: 'PARAMETER1', value: code },
        { name: 'PARAMETER2', value: code },
      ],
    });

    // Prepare the request configuration
    const config = {
      method: 'post',
      url: 'https://api.sms.ir/v1/send/verify',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-api-key': SMS_API_KEY,
      },
      data,
    };

    // Send the request
    console.log(`[SMS] Sending request to SMS.ir API for phone: ${formattedPhone}`);
    const response = await axios(config);

    // Check if the SMS was sent successfully
    if (response.data && response.status === 200 && response.data.status === 1) {
      console.log(`[SMS] Successfully sent verification code to ${formattedPhone}`);
      return true;
    }
    console.error(`[SMS] Failed to send verification code: ${JSON.stringify(response.data)}`);
    return false;
  } catch (error) {
    // More detailed error logging
    if (error.response) {
      // The request was made and the server responded with a status code outside of 2xx range
      console.error(`[SMS] API Error: ${error.response.status}`, error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('[SMS] No response received from SMS.ir API', error.request);
    } else {
      // Something happened in setting up the request
      console.error('[SMS] Error setting up SMS request:', error.message);
    }
    return false;
  }
};
