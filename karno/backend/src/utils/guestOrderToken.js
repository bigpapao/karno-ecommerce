import jwt from 'jsonwebtoken';
import { AppError } from '../middleware/error-handler.middleware.js';

/**
 * Generate a token for guest order verification
 * @param {string} orderId - Order ID to encode in token
 * @param {Object} guestInfo - Guest information (email and phone)
 * @returns {string} JWT token
 */
export const generateGuestOrderToken = (orderId, guestInfo) => {
  const payload = {
    orderId,
    guestInfo,
    type: 'guest_order',
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_production',
    { expiresIn: '30d' }, // Guest order tokens valid for 30 days
  );
};

/**
 * Verify a guest order token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
export const verifyGuestOrderToken = (token) => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_production',
    );

    if (decoded.type !== 'guest_order') {
      throw new AppError('Invalid token type', 400);
    }

    return decoded;
  } catch (error) {
    throw new AppError('Invalid or expired token', 401);
  }
};

/**
 * Middleware to verify guest order access
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const verifyGuestOrderAccess = (req, res, next) => {
  try {
    // Get token from headers, query or body
    const token = req.headers.authorization?.split(' ')[1]
      || req.query.token
      || req.body.token;

    if (!token) {
      return next(new AppError('Authentication token is required', 401));
    }

    // Verify token
    const decoded = verifyGuestOrderToken(token);

    // Check if the order ID matches
    if (decoded.orderId !== req.params.id && decoded.orderId !== req.body.orderId) {
      return next(new AppError('You do not have permission to access this order', 403));
    }

    // Attach guest info to request
    req.guestInfo = decoded.guestInfo;

    next();
  } catch (error) {
    next(error);
  }
};

export default {
  generateGuestOrderToken,
  verifyGuestOrderToken,
  verifyGuestOrderAccess,
};
