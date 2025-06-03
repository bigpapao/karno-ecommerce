/**
 * Tracking Number Utility
 *
 * This utility provides functions for generating and validating
 * tracking numbers for the order tracking system.
 */

import crypto from 'crypto';

// Constants for tracking number format
const PREFIX = 'KN'; // Karno prefix
const TIMESTAMP_LENGTH = 8; // YYYYMMDD format
const RANDOM_LENGTH = 6; // Random alphanumeric characters

/**
 * Generate a unique tracking number for an order
 * Format: KN-YYYYMMDD-XXXXXX-ID
 * Where:
 * - KN: Karno prefix
 * - YYYYMMDD: Date of order creation
 * - XXXXXX: Random alphanumeric characters
 * - ID: Order ID (or part of it)
 *
 * @param {string} orderId - MongoDB ObjectId of the order
 * @returns {string} Generated tracking number
 */
export const generateTrackingNumber = (orderId) => {
  if (!orderId) {
    throw new Error('Order ID is required to generate tracking number');
  }

  // Get current date in YYYYMMDD format
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const timestamp = `${year}${month}${day}`;

  // Generate random alphanumeric string
  const randomChars = crypto
    .randomBytes(Math.ceil(RANDOM_LENGTH / 2))
    .toString('hex')
    .toUpperCase()
    .slice(0, RANDOM_LENGTH);

  // Use last 6 characters of the order ID
  const idPart = orderId.toString().slice(-6);

  // Construct tracking number with hyphens for readability
  return `${PREFIX}-${timestamp}-${randomChars}-${idPart}`;
};

/**
 * Validate tracking number format
 *
 * @param {string} trackingNumber - Tracking number to validate
 * @returns {boolean} Whether tracking number has valid format
 */
export const validateTrackingNumber = (trackingNumber) => {
  if (!trackingNumber) return false;

  // Validate against expected format
  const regex = new RegExp(
    `^${PREFIX}-\\d{${TIMESTAMP_LENGTH}}-[A-Z0-9]{${RANDOM_LENGTH}}-[A-F0-9]{6}$`,
  );

  return regex.test(trackingNumber);
};

/**
 * Extract information from tracking number
 *
 * @param {string} trackingNumber - Tracking number to parse
 * @returns {Object|null} Extracted information or null if invalid
 */
export const parseTrackingNumber = (trackingNumber) => {
  if (!validateTrackingNumber(trackingNumber)) {
    return null;
  }

  const parts = trackingNumber.split('-');

  // Extract date from timestamp
  const timestamp = parts[1];
  const year = parseInt(timestamp.substring(0, 4), 10);
  const month = parseInt(timestamp.substring(4, 6), 10) - 1; // Months are 0-indexed
  const day = parseInt(timestamp.substring(6, 8), 10);
  const date = new Date(year, month, day);

  return {
    prefix: parts[0],
    date,
    randomPart: parts[2],
    idPart: parts[3],
  };
};

export default {
  generate: generateTrackingNumber,
  validate: validateTrackingNumber,
  parse: parseTrackingNumber,
};
