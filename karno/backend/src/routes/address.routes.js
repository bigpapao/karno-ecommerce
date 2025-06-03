/**
 * Address Routes
 *
 * API routes for managing user addresses.
 */

import express from 'express';
import {
  getUserAddresses,
  getAddressById,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../controllers/address.controller.js';
import { validateRequest, schemas } from '../middleware/validation.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Address routes
router.get('/', asyncHandler(getUserAddresses));
router.get('/:id', asyncHandler(getAddressById));
router.post('/', validateRequest(schemas.createAddress), asyncHandler(addAddress));
router.put('/:id', validateRequest(schemas.updateAddress), asyncHandler(updateAddress));
router.delete('/:id', asyncHandler(deleteAddress));
router.put('/:id/default', asyncHandler(setDefaultAddress));

export default router;
