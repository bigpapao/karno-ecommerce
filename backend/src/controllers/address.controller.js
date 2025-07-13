/**
 * Address Controller
 *
 * Handles all address-related operations, including:
 * - Retrieving user addresses
 * - Adding new addresses
 * - Updating existing addresses
 * - Deleting addresses
 * - Setting default address
 * - Validating addresses via external API
 */

import User from '../models/user.model.js';
import Order from '../models/order.model.js';
import * as addressValidationService from '../services/addressValidation.service.js';
import { AppError } from '../middleware/error-handler.middleware.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Get all addresses for the authenticated user
 * @route GET /api/addresses
 * @access Private
 */
export const getUserAddresses = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError('User not found', 404, 'ERR_USER_NOT_FOUND'));
  }

  const addresses = user.addresses.map((addr) => {
    const obj = addr.toObject();
    obj.isDefaultAddress = addr.isDefault;
    return obj;
  });

  res.status(200).json({
    success: true,
    count: addresses.length,
    data: addresses,
  });
});

/**
 * Get a specific address by ID
 * @route GET /api/addresses/:id
 * @access Private
 */
export const getAddressById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError('User not found', 404, 'ERR_USER_NOT_FOUND'));
  }

  const address = user.addresses.id(req.params.id);

  if (!address) {
    return next(new AppError('Address not found', 404, 'ERR_ADDRESS_NOT_FOUND'));
  }

  const addressObj = address.toObject();
  addressObj.isDefaultAddress = address.isDefault;

  res.status(200).json({
    success: true,
    data: addressObj,
  });
});

/**
 * Add a new address
 * @route POST /api/addresses
 * @access Private
 */
export const addAddress = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError('User not found', 404, 'ERR_USER_NOT_FOUND'));
  }

  // Check if this is the first address and set it as default
  const isFirst = user.addresses.length === 0;

  // Include any warnings from address validation
  const warnings = req.addressWarnings || [];

  // If the validated address has better data and we have explicit permission from the user to correct it
  if (req.validatedAddress && req.body.useValidatedAddress === true) {
    const { suggestion } = req.validatedAddress;

    // Update with the validated address data
    if (suggestion && suggestion.streetNumber && suggestion.streetName) {
      req.body.address = `${suggestion.streetNumber} ${suggestion.streetName}`;
    }

    if (suggestion && suggestion.city) {
      req.body.city = suggestion.city;
    }

    if (suggestion && suggestion.state) {
      req.body.state = suggestion.state;
    }

    if (suggestion && suggestion.zipCode) {
      req.body.zipCode = suggestion.zipCode;
    }

    if (suggestion && suggestion.country) {
      req.body.country = suggestion.country;
    }
  }

  // Map frontend field to schema field
  if (req.body.isDefaultAddress !== undefined) {
    req.body.isDefault = req.body.isDefaultAddress;
  }

  // Add new address to the user's addresses array
  user.addresses.push({
    ...req.body,
    isDefault: req.body.isDefault || isFirst,
  });

  // If this address is set as default, update all other addresses
  if (req.body.isDefault || isFirst) {
    user.addresses.forEach((address) => {
      if (address._id.toString() !== user.addresses[user.addresses.length - 1]._id.toString()) {
        address.isDefault = false;
      }
    });
  }

  await user.save();

  const newAddress = user.addresses[user.addresses.length - 1];
  const addressObj = newAddress.toObject();
  addressObj.isDefaultAddress = newAddress.isDefault;

  res.status(201).json({
    success: true,
    data: addressObj,
    warnings,
  });
});

/**
 * Update an existing address
 * @route PUT /api/addresses/:id
 * @access Private
 */
export const updateAddress = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError('User not found', 404, 'ERR_USER_NOT_FOUND'));
  }

  const address = user.addresses.id(req.params.id);

  if (!address) {
    return next(new AppError('Address not found', 404, 'ERR_ADDRESS_NOT_FOUND'));
  }

  // Include any warnings from address validation
  const warnings = req.addressWarnings || [];

  // If the validated address has better data and we have explicit permission from the user to correct it
  if (req.validatedAddress && req.body.useValidatedAddress === true) {
    const { suggestion } = req.validatedAddress;

    // Update with the validated address data
    if (suggestion && suggestion.streetNumber && suggestion.streetName) {
      req.body.address = `${suggestion.streetNumber} ${suggestion.streetName}`;
    }

    if (suggestion && suggestion.city) {
      req.body.city = suggestion.city;
    }

    if (suggestion && suggestion.state) {
      req.body.state = suggestion.state;
    }

    if (suggestion && suggestion.zipCode) {
      req.body.zipCode = suggestion.zipCode;
    }

    if (suggestion && suggestion.country) {
      req.body.country = suggestion.country;
    }
  }

  // Map frontend field to schema field
  if (req.body.isDefaultAddress !== undefined) {
    req.body.isDefault = req.body.isDefaultAddress;
  }

  // If this is being set as default address
  if (req.body.isDefault && !address.isDefault) {
    // Update all other addresses
    user.addresses.forEach((addr) => {
      if (addr._id.toString() !== address._id.toString()) {
        addr.isDefault = false;
      }
    });
  }

  // Update address fields
  const updateFields = [
    'fullName', 'address', 'city', 'state', 'zipCode', 'country',
    'phoneNumber', 'addressType', 'isDefault', 'notes',
  ];

  updateFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      address[field] = req.body[field];
    }
  });

  await user.save();

  const addressObj = address.toObject();
  addressObj.isDefaultAddress = address.isDefault;

  res.status(200).json({
    success: true,
    data: addressObj,
    warnings,
  });
});

/**
 * Delete an address
 * @route DELETE /api/addresses/:id
 * @access Private
 */
export const deleteAddress = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError('User not found', 404, 'ERR_USER_NOT_FOUND'));
  }

  // Check if this address is used in any pending/processing orders
  const activeOrders = await Order.find({
    user: req.user.id,
    shippingAddress: req.params.id,
    status: { $in: ['pending', 'processing', 'shipped'] },
  });

  if (activeOrders.length > 0) {
    return next(new AppError(
      'Cannot delete address used in active orders',
      400,
      'ERR_ADDRESS_IN_USE',
    ));
  }

  const address = user.addresses.id(req.params.id);

  if (!address) {
    return next(new AppError('Address not found', 404, 'ERR_ADDRESS_NOT_FOUND'));
  }

  // If this is the default address, we need to set another as default if possible
  const wasDefault = address.isDefault;

  // Remove the address
  address.deleteOne();

  // If the removed address was the default, set another one as default
  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Address removed successfully',
  });
});

/**
 * Set an address as the default
 * @route PATCH /api/addresses/:id/default
 * @access Private
 */
export const setDefaultAddress = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError('User not found', 404, 'ERR_USER_NOT_FOUND'));
  }

  const address = user.addresses.id(req.params.id);

  if (!address) {
    return next(new AppError('Address not found', 404, 'ERR_ADDRESS_NOT_FOUND'));
  }

  // Update all addresses to not be default
  user.addresses.forEach((addr) => {
    addr.isDefault = addr._id.toString() === req.params.id;
  });

  await user.save();

  const addressObj = address.toObject();
  addressObj.isDefaultAddress = address.isDefault;

  res.status(200).json({
    success: true,
    message: 'Default address updated successfully',
    data: addressObj,
  });
});

/**
 * Validate address data without saving
 * @route POST /api/addresses/validate
 * @access Private
 */
export const validateAddressData = asyncHandler(async (req, res, next) => {
  // Get validation results from middleware
  const validationResult = req.validatedAddress || {
    isValid: true,
    score: 100,
    message: 'Address format is valid',
  };

  const warnings = req.addressWarnings || [];

  res.status(200).json({
    success: true,
    data: validationResult,
    warnings,
  });
});
