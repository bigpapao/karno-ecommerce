/**
 * Address Validation Middleware
 *
 * Middleware functions for validating and sanitizing address data
 * from HTTP requests before it reaches the controller.
 */

import { validateAddressData, sanitizeAddressData } from '../schemas/address.schema.js';
import addressValidationService from '../services/addressValidation.service.js';
import config from '../config/config.js';
import { AppError } from './error-handler.middleware.js';
import { logger } from '../utils/logger.js';

// Configuration
const VALIDATE_ON_SUBMIT = config.addressValidation?.validateOnSubmit || true;

/**
 * Validate address form data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const validateAddress = async (req, res, next) => {
  try {
    // Sanitize input data to prevent XSS attacks
    const sanitizedData = sanitizeAddressData(req.body);

    // Validate against schema
    const { error, value } = validateAddressData(sanitizedData);

    if (error) {
      // Format validation errors
      const errorMessages = error.details.map((detail) => ({
        field: detail.path[0],
        message: detail.message,
      }));

      return next(new AppError('Validation error', 400, errorMessages));
    }

    // Replace request body with validated and sanitized data
    req.body = value;

    // Skip external API validation if not needed
    if (!VALIDATE_ON_SUBMIT) {
      return next();
    }

    try {
      // Validate with external API
      const addressValidationResult = await addressValidationService.validateAddress({
        address: value.address,
        city: value.city,
        state: value.state,
        zipCode: value.zipCode,
        country: value.country,
      });

      // Attach validation result to request for controller usage
      req.validatedAddress = addressValidationResult;

      // If address is invalid but we have a suggestion
      if (!addressValidationResult.isValid && addressValidationResult.suggestion) {
        // Still allow the request to proceed, but attach warnings
        req.addressWarnings = [{
          type: 'suggestion',
          message: 'We found a better match for your address',
          suggestion: addressValidationResult.suggestion,
          formattedAddress: addressValidationResult.formattedAddress,
        }];
      }

      next();
    } catch (validationError) {
      // API validation error is not fatal, log it and continue
      logger.error('External address validation failed:', { error: validationError.message });
      req.addressWarnings = [{
        type: 'error',
        message: 'Address validation service is temporarily unavailable',
      }];
      next();
    }
  } catch (err) {
    next(new AppError(`Address validation error: ${err.message}`, 500));
  }
};

/**
 * Validate shipping option
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const validateShippingOption = (req, res, next) => {
  try {
    const { shippingOption } = req.body;

    if (!shippingOption) {
      return next(new AppError('Shipping option is required', 400));
    }

    const validOptions = ['standard', 'express', 'same_day'];

    if (!validOptions.includes(shippingOption)) {
      return next(new AppError('Invalid shipping option. Must be one of: standard, express, same_day', 400));
    }

    // Check if same-day delivery is restricted by city
    if (shippingOption === 'same_day') {
      const { city } = req.body;
      const eligibleCities = ['Tehran', 'Isfahan', 'Shiraz', 'Mashhad', 'Tabriz'];

      if (!city || !eligibleCities.includes(city)) {
        return next(
          new AppError(
            `Same-day delivery is only available in: ${eligibleCities.join(', ')}`,
            400,
          ),
        );
      }

      // Check if the order is being placed before cutoff time (12 PM)
      const now = new Date();
      const cutoffHour = 12;

      if (now.getHours() >= cutoffHour) {
        return next(
          new AppError(
            'Same-day delivery is only available for orders placed before 12 PM',
            400,
          ),
        );
      }
    }

    next();
  } catch (err) {
    next(new AppError(`Shipping option validation error: ${err.message}`, 500));
  }
};

/**
 * Check if address already exists for user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const checkExistingAddress = async (req, res, next) => {
  try {
    // Skip check if not authenticated
    if (!req.user) {
      return next();
    }

    const { User } = req.app.get('models');
    const userId = req.user._id;

    // Get user with addresses populated
    const user = await User.findById(userId).select('addresses');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Extract key parts of the address
    const {
      address, city, state, zipCode, country,
    } = req.body;

    // Check if similar address already exists
    const existingAddress = user.addresses && user.addresses.find((addr) => addr.address === address
      && addr.city === city
      && addr.state === state
      && addr.zipCode === zipCode
      && addr.country === country);

    if (existingAddress) {
      // Add existing address ID to the request for later use
      req.existingAddressId = existingAddress._id;
    }

    next();
  } catch (err) {
    next(new AppError(`Error checking existing address: ${err.message}`, 500));
  }
};
