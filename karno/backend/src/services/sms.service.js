/**
 * SMS Service for sending verification codes
 * Using SMS.ir API
 */

import axios from 'axios';
import { smsConfig } from '../config/config.js';

class SmsService {
  constructor() {
    this.baseUrl = 'https://api.sms.ir/v1/send';
    this.lineNumber = smsConfig.lineNumber;
    this.apiKey = smsConfig.apiKey;
  }

  /**
   * Send a verification code to a phone number
   * @param {string} phoneNumber - The recipient's phone number
   * @param {string} verificationCode - The verification code to send
   * @returns {Promise<Object>} - The response from SMS.ir API
   */
  async sendVerificationCode(phoneNumber, verificationCode) {
    try {
      // Normalize phone number (remove +98 or 0 prefix if present)
      let normalizedPhone = phoneNumber.toString().replace(/\D/g, '');
      if (normalizedPhone.startsWith('98')) {
        normalizedPhone = normalizedPhone.substring(2);
      } else if (normalizedPhone.startsWith('0')) {
        normalizedPhone = normalizedPhone.substring(1);
      }

      // Add 0 prefix for SMS.ir format
      const recipientNumber = `0${normalizedPhone}`;

      // Message template
      const message = `کد تایید کارنو: ${verificationCode}\nاین کد تا ۱۰ دقیقه معتبر است.`;

      // Make request to SMS.ir API
      const response = await axios.post(
        this.baseUrl,
        {
          lineNumber: this.lineNumber,
          recipient: recipientNumber,
          message,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': this.apiKey,
          },
        },
      );

      return {
        success: true,
        messageId: response.data.messageId,
        message: 'OTP code sent successfully',
      };
    } catch (error) {
      console.error('SMS service error:', error.response?.data || error.message);

      return {
        success: false,
        error: error.response?.data?.message || 'Failed to send verification code',
        details: error.response?.data || error.message,
      };
    }
  }

  /**
   * Mock implementation for development without SMS API
   * @param {string} phoneNumber - The recipient's phone number
   * @param {string} verificationCode - The verification code to send
   * @returns {Promise<Object>} - Simulated API response
   */
  async mockSendVerificationCode(phoneNumber, verificationCode) {
    // Log the code to console for testing
    console.log(`[MOCK SMS] Sending code ${verificationCode} to ${phoneNumber}`);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      success: true,
      messageId: `mock_${Date.now()}`,
      message: 'Mock OTP code sent successfully',
    };
  }
}

// Choose the implementation based on environment
const smsService = {
  sendVerificationCode: async (phoneNumber, verificationCode) => {
    // Use mock implementation in development or when API keys are not properly configured
    if (smsConfig.mock || !smsConfig.apiKey || smsConfig.apiKey === 'your-api-key') {
      // Log the code to console for testing
      console.log(`[MOCK SMS] Sending code ${verificationCode} to ${phoneNumber}`);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        success: true,
        messageId: `mock_${Date.now()}`,
        message: 'Mock OTP code sent successfully',
      };
    }
    // Use the real implementation
    const service = new SmsService();
    return service.sendVerificationCode(phoneNumber, verificationCode);
  },
};

export default smsService;
