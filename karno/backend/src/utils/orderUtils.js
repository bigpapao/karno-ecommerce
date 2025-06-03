/**
 * Utilities for order management
 */

/**
 * Generate a unique order number
 * Format: KRN-YYYYMMDD-XXXX (e.g., KRN-20230415-1234)
 * @returns {string} Order number
 */
export const generateOrderNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePart = `${year}${month}${day}`;

  // Generate a random 4-digit number
  const randomPart = Math.floor(1000 + Math.random() * 9000);

  return `KRN-${datePart}-${randomPart}`;
};

/**
 * Generate a tracking code (alphanumeric, 8 characters)
 * @returns {string} Tracking code
 */
export const generateTrackingCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';

  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return code;
};

/**
 * Format price for display (converts to Toman)
 * @param {number} priceInRials - Price in Rials
 * @returns {string} Formatted price in Toman
 */
export const formatPrice = (priceInRials) => {
  // Convert from Rials to Toman (1 Toman = 10 Rials)
  const priceInToman = priceInRials / 10;

  // Format with comma separators
  return new Intl.NumberFormat('fa-IR').format(priceInToman);
};
