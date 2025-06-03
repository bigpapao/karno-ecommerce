/**
 * Zarinpal Payment Gateway Service
 *
 * This service provides methods to interact with the Zarinpal payment gateway.
 * Contains placeholder functionality that can be replaced with actual Zarinpal API calls.
 */

import axios from 'axios';
import { logger } from '../utils/logger.js';

// Constants for Zarinpal API
const ZARINPAL_API = {
  // Sandbox endpoints
  SANDBOX: {
    PAYMENT_REQUEST: 'https://sandbox.zarinpal.com/pg/rest/WebGate/PaymentRequest.json',
    PAYMENT_VERIFICATION: 'https://sandbox.zarinpal.com/pg/rest/WebGate/PaymentVerification.json',
    PAYMENT_GATEWAY_URL: 'https://sandbox.zarinpal.com/pg/StartPay/',
  },
  // Production endpoints
  PRODUCTION: {
    PAYMENT_REQUEST: 'https://api.zarinpal.com/pg/v4/payment/request.json',
    PAYMENT_VERIFICATION: 'https://api.zarinpal.com/pg/v4/payment/verify.json',
    PAYMENT_GATEWAY_URL: 'https://www.zarinpal.com/pg/StartPay/',
  },
};

// Choose which environment to use based on NODE_ENV
const environment = process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'SANDBOX';

/**
 * Create a payment request to Zarinpal
 *
 * @param {Object} options - Payment options
 * @param {number} options.amount - Amount in IRR (Toman * 10)
 * @param {string} options.description - Description of the payment
 * @param {string} options.email - Customer's email (optional)
 * @param {string} options.mobile - Customer's mobile number (optional)
 * @param {string} options.callbackUrl - URL to redirect after payment
 * @returns {Promise<Object>} Payment request response
 */
export const createPaymentRequest = async (options) => {
  try {
    logger.info({
      message: 'Creating Zarinpal payment request',
      amount: options.amount,
      description: options.description,
    });

    // PLACEHOLDER: In a real implementation, you would make an API call to Zarinpal
    // For now, we'll simulate a successful response

    // Simulated successful response
    const simulatedResponse = {
      Status: 100, // 100 means success in Zarinpal
      Authority: `ZP_${Date.now()}_${Math.floor(Math.random() * 1000000)}`, // Generate a fake Authority code
    };

    // In actual implementation, the code would look like this:
    /*
    const response = await axios.post(ZARINPAL_API[environment].PAYMENT_REQUEST, {
      MerchantID: process.env.ZARINPAL_MERCHANT_ID,
      Amount: options.amount,
      Description: options.description,
      Email: options.email,
      Mobile: options.mobile,
      CallbackURL: options.callbackUrl,
    });
    return response.data;
    */

    logger.info({
      message: 'Zarinpal payment request created',
      authority: simulatedResponse.Authority,
      status: simulatedResponse.Status,
    });

    return simulatedResponse;
  } catch (error) {
    logger.error({
      message: 'Error creating Zarinpal payment request',
      error: error.message,
      stack: error.stack,
    });
    throw new Error(`Failed to create Zarinpal payment request: ${error.message}`);
  }
};

/**
 * Get the payment gateway URL for redirecting the user
 *
 * @param {string} authority - Authority code from payment request
 * @returns {string} Payment gateway URL
 */
export const getPaymentURL = (authority) => `${ZARINPAL_API[environment].PAYMENT_GATEWAY_URL}${authority}`;

/**
 * Verify a payment with Zarinpal
 *
 * @param {Object} options - Verification options
 * @param {string} options.authority - Authority code from callback
 * @param {number} options.amount - Amount in IRR (Toman * 10) - must match the original payment request
 * @returns {Promise<Object>} Verification response
 */
export const verifyPayment = async (options) => {
  try {
    logger.info({
      message: 'Verifying Zarinpal payment',
      authority: options.authority,
      amount: options.amount,
    });

    // PLACEHOLDER: In a real implementation, you would make an API call to Zarinpal
    // For now, we'll simulate a successful response

    // Simulated successful response
    const simulatedResponse = {
      Status: 100, // 100 means success in Zarinpal
      RefID: `REFID_${Date.now()}_${Math.floor(Math.random() * 1000000)}`, // Generate a fake RefID
    };

    // In actual implementation, the code would look like this:
    /*
    const response = await axios.post(ZARINPAL_API[environment].PAYMENT_VERIFICATION, {
      MerchantID: process.env.ZARINPAL_MERCHANT_ID,
      Authority: options.authority,
      Amount: options.amount,
    });
    return response.data;
    */

    logger.info({
      message: 'Zarinpal payment verified',
      refId: simulatedResponse.RefID,
      status: simulatedResponse.Status,
    });

    return simulatedResponse;
  } catch (error) {
    logger.error({
      message: 'Error verifying Zarinpal payment',
      error: error.message,
      stack: error.stack,
    });
    throw new Error(`Failed to verify Zarinpal payment: ${error.message}`);
  }
};

/**
 * Get Zarinpal status message based on status code
 *
 * @param {number} statusCode - Zarinpal status code
 * @returns {string} Status message
 */
export const getStatusMessage = (statusCode) => {
  // Convert statusCode to string to ensure consistent lookup
  const code = String(statusCode);

  // Define messages using a switch statement instead of an object literal
  switch (code) {
    // Success
    case '100':
      return 'Payment was successful';
    case '101':
      return 'Payment was successful but already verified';

    // Errors
    case '-1':
      return 'Invalid information provided';
    case '-2':
      return 'Merchant ID is invalid';
    case '-3':
      return 'Amount is too low (minimum 1000 IRR)';
    case '-4':
      return 'Amount is higher than the allowed limit';
    case '-11':
      return 'Payment request record not found';
    case '-12':
      return 'Transaction failed';
    case '-21':
      return 'Transaction canceled by user';
    case '-22':
      return 'Transaction failed (unknown error)';
    case '-33':
      return 'Transaction amount does not match with the payment amount';
    case '-34':
      return 'Transaction has already been divided into smaller parts';
    case '-40':
      return 'Payment session has expired';
    case '-41':
      return 'Payment request information does not match with the payment';
    case '-42':
      return 'Your payment initiation request has been previously processed';
    case '-54':
      return 'The reference transaction for this transaction was not found or has been settled';
    default:
      return 'Unknown status code';
  }
};

export default {
  createPaymentRequest,
  getPaymentURL,
  verifyPayment,
  getStatusMessage,
};
