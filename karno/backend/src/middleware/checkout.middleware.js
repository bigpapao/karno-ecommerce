/**
 * Checkout Middleware
 * Ensures the user has a complete profile and verified mobile before checkout
 */

import User from '../models/user.model.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware to check if user can proceed with checkout
 * Verifies profile completeness and mobile verification
 */
export const canCheckout = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if profile is complete
    const { isProfileComplete } = user;

    // Check if mobile is verified
    const isMobileVerified = user.mobileVerified;

    // If requirements are not met, return error
    if (!isProfileComplete || !isMobileVerified) {
      return res.status(403).json({
        success: false,
        message: 'Profile completion and mobile verification required',
        data: {
          isProfileComplete,
          isMobileVerified,
          missingFields: getIncompleteFields(user),
          redirectTo: '/profile',
        },
      });
    }

    // Requirements met, proceed
    next();
  } catch (error) {
    logger.error('Checkout middleware error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * Helper function to determine which fields are incomplete
 * @param {Object} user - User object
 * @returns {Array} Array of incomplete field names
 */
const getIncompleteFields = (user) => {
  const missingFields = [];

  if (!user.firstName) missingFields.push('firstName');
  if (!user.lastName) missingFields.push('lastName');
  if (!user.address) missingFields.push('address');
  if (!user.city) missingFields.push('city');
  if (!user.province) missingFields.push('province');
  if (!user.postalCode) missingFields.push('postalCode');
  if (!user.phone) missingFields.push('phone');
  if (!user.mobileVerified) missingFields.push('mobileVerification');

  return missingFields;
};

export default {
  canCheckout,
};
