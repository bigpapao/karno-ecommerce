import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  // Guest cart operations
  getGuestCart,
  addToGuestCart,
  updateGuestCartItem,
  removeFromGuestCart,
  clearGuestCart,
  mergeGuestCart,
} from '../controllers/cart.controller.js';

const router = express.Router();

// Authenticated cart routes (require login)
router.get('/', authenticate, getCart);
router.post('/add', authenticate, addToCart);
router.put('/update', authenticate, updateCartItem);
router.delete('/remove/:productId', authenticate, removeCartItem);
router.delete('/clear', authenticate, clearCart);

// Guest cart routes (no authentication required)
router.get('/guest', getGuestCart);
router.post('/guest/add', addToGuestCart);
router.put('/guest/update', updateGuestCartItem);
router.delete('/guest/remove/:productId', removeFromGuestCart);
router.delete('/guest/clear', clearGuestCart);

// Merge guest cart with user cart after login
router.post('/merge', authenticate, mergeGuestCart);

export default router;
