/**
 * Phone number utility functions
 */

/**
 * Normalizes an Iranian phone number to standard format (10 digits starting with 9)
 *
 * @param {string} phone - Phone number to normalize
 * @returns {string} Normalized phone number
 */
export const normalizePhoneNumber = (phone) => {
  if (!phone) return '';

  // Remove all non-digit characters
  let normalizedPhone = phone.toString().replace(/\D/g, '');

  // Remove country code (98) if present
  if (normalizedPhone.startsWith('98')) {
    normalizedPhone = normalizedPhone.substring(2);
  }

  // Remove leading zero if present
  if (normalizedPhone.startsWith('0')) {
    normalizedPhone = normalizedPhone.substring(1);
  }

  // Validate if it's a valid Iranian phone number
  if (/^9\d{9}$/.test(normalizedPhone)) {
    return normalizedPhone;
  }

  // Return original value if it doesn't match the pattern
  return phone;
};

/**
 * Formats a phone number for display with proper spacing
 *
 * @param {string} phone - Raw phone number
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  const normalizedPhone = normalizePhoneNumber(phone);

  if (!normalizedPhone || !/^9\d{9}$/.test(normalizedPhone)) {
    return phone;
  }

  // Format as 0913 123 4567
  return `0${normalizedPhone.substring(0, 4)} ${normalizedPhone.substring(4, 7)} ${normalizedPhone.substring(7)}`;
};

/**
 * Validates if a phone number is a valid Iranian mobile number
 *
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Whether the phone number is valid
 */
export const isValidIranianMobile = (phone) => {
  if (!phone) return false;

  const normalizedPhone = normalizePhoneNumber(phone);
  return /^9\d{9}$/.test(normalizedPhone);
};
