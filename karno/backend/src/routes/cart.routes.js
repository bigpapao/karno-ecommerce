import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  verifyCartItemOwnership,
  validateCartPayload,
  validateSessionId
} from '../middleware/cart.middleware.js';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  getGuestCart,
  addToGuestCart,
  mergeGuestCart,
  getCartPricing,
  applyPromoCode,
} from '../controllers/cart.controller.js';

const router = express.Router();

// Guest cart routes (no authentication required)
router.get('/guest/:sessionId', validateSessionId, getGuestCart);
router.post('/guest/:sessionId', validateSessionId, validateCartPayload, addToGuestCart);

// Merge carts after login (requires authentication)
router.post('/merge/:sessionId', authenticate, validateSessionId, mergeGuestCart);

// All other cart routes require authentication
router.use(authenticate);

// Get user's cart
router.get('/', getCart);

// Add item to cart
router.post('/', validateCartPayload, addToCart);

// Update cart item quantity
router.put('/:itemId', verifyCartItemOwnership, validateCartPayload, updateCartItem);

// Remove item from cart
router.delete('/:itemId', verifyCartItemOwnership, removeCartItem);

// Clear entire cart
router.delete('/', clearCart);

// Get detailed cart pricing
router.get('/pricing', getCartPricing);

// Apply promo code to cart
router.post('/promo', applyPromoCode);

export default router; 