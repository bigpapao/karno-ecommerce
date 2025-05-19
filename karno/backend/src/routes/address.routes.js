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
  validateAddressData
} from '../controllers/addressController.js';
import { validateAddress } from '../middleware/address.middleware.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protect all address routes
router.use(protect);

// GET /api/addresses - Get all addresses for the authenticated user
router.get('/', getUserAddresses);

// GET /api/addresses/:id - Get a specific address by ID
router.get('/:id', getAddressById);

// POST /api/addresses - Add a new address
router.post('/', validateAddress, addAddress);

// PUT /api/addresses/:id - Update an existing address
router.put('/:id', validateAddress, updateAddress);

// DELETE /api/addresses/:id - Delete an address
router.delete('/:id', deleteAddress);

// PATCH /api/addresses/:id/default - Set an address as default
router.patch('/:id/default', setDefaultAddress);

// POST /api/addresses/validate - Validate an address without saving it
router.post('/validate', validateAddress, validateAddressData);

export default router; 