import Product from '../models/product.model.js';
import { AppError } from '../middleware/error-handler.middleware.js';

/**
 * Validate product for cart addition
 * @param {string} productId - MongoDB ID of the product
 * @param {number} quantity - Quantity to add
 * @returns {Promise<Object>} - Product if valid
 * @throws {AppError} - If validation fails
 */
export const validateProductForCart = async (productId, quantity) => {
  if (!productId) {
    throw new AppError('Product ID is required', 400);
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (product.stock < quantity) {
    throw new AppError(`Only ${product.stock} items available in stock`, 400);
  }

  return product;
};

/**
 * Format product for cart
 * @param {Object} product - Product document
 * @param {number} quantity - Quantity to add to cart
 * @returns {Object} - Formatted cart item
 */
export const formatProductForCart = (product, quantity) => ({
  product: product._id,
  name: sanitizeText(product.name),
  quantity,
  price: product.discountPrice || product.price,
  image: product.images && product.images.length > 0 ? {
    url: sanitizeUrl(product.images[0].url),
    alt: sanitizeText(product.images[0].alt),
  } : null,
});

/**
 * Sanitize text to prevent XSS attacks
 * @param {string} text - Text to sanitize
 * @returns {string} - Sanitized text
 */
export const sanitizeText = (text) => {
  if (!text) return '';

  // Replace HTML special characters to prevent XSS
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Sanitize URL to prevent malicious URLs
 * @param {string} url - URL to sanitize
 * @returns {string} - Sanitized URL
 */
export const sanitizeUrl = (url) => {
  if (!url) return '';

  // Basic URL validation - should be improved for production
  // This allows http:// and https:// URLs, relative URLs, and data URLs for images
  if (!/^(https?:\/\/|\/|data:image\/)/.test(url)) {
    return '';
  }

  return url;
};

/**
 * Recalculate cart totals
 * @param {Array} items - Cart items array
 * @returns {Object} - Cart totals
 */
export const calculateCartTotals = (items) => {
  const totalPrice = items.reduce((total, item) => total + (item.price * item.quantity), 0);

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  return { totalPrice, totalItems };
};

/**
 * Check if cart needs update
 * @param {Object} cart - Cart document
 * @returns {boolean} - True if cart needs update
 */
export const cartNeedsUpdate = (cart) => {
  const calculatedTotals = calculateCartTotals(cart.items);

  return (
    cart.totalPrice !== calculatedTotals.totalPrice
    || cart.totalItems !== calculatedTotals.totalItems
  );
};

/**
 * Update cart totals
 * @param {Object} cart - Cart document
 */
export const updateCartTotals = (cart) => {
  cart.totalPrice = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

  cart.totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);

  return cart;
};

/**
 * Check for suspicious activity in cart operations
 * @param {Object} cart - Cart document
 * @param {Object} operation - Operation details
 * @returns {boolean} - True if suspicious
 */
export const detectSuspiciousActivity = (cart, operation) => {
  const { type, quantity, ip } = operation;

  // Check for rapid successive operations
  if (cart.lastOperationTime) {
    const timeSinceLastOperation = new Date() - new Date(cart.lastOperationTime);
    if (timeSinceLastOperation < 1000) { // Less than 1 second between operations
      return true;
    }
  }

  // Check for unusually large quantities
  if (quantity && quantity > 20) {
    return true;
  }

  // Check for excessive items in cart
  if (cart.items.length > 50) {
    return true;
  }

  // Check for excessive item quantity
  if (cart.totalItems > 100) {
    return true;
  }

  return false;
};
