import express from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getUserOrders,
  cancelOrder,
  updatePaymentStatus,
  updateOrderTracking,
  getOrderStats,
  bulkUpdateOrderStatus,
  getOrderByTracking,
  verifyGuestOrder
} from '../controllers/order.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { verifyGuestOrderAccess } from '../utils/guestOrderToken.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/guest/verify', verifyGuestOrder);
router.get('/track/:tracking', getOrderByTracking);

// Routes that support both guest checkout and authenticated users
router.post('/', createOrder);

// Routes below this middleware require authentication
router.use(authenticate);

// User routes
router.get('/user', getUserOrders);
router.get('/:id', getOrderById);
router.post('/:id/cancel', cancelOrder);

// Admin only routes
router.get('/', authorize('admin'), getOrders);
router.get('/stats', authorize('admin'), getOrderStats);
router.put('/bulk-status-update', authorize('admin'), bulkUpdateOrderStatus);
router.put('/:id/status', authorize('admin'), updateOrderStatus);
router.put('/:id/payment', authorize('admin'), updatePaymentStatus);
router.put('/:id/tracking', authorize('admin'), updateOrderTracking);

export default router;
