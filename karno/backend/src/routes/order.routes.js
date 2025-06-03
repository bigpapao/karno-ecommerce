import express from 'express';
import {
  getOrders,
  getUserOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  updatePaymentStatus,
  updateOrderTracking,
  getOrderStats,
  bulkUpdateOrderStatus,
  getOrderByTracking,
  verifyGuestOrder,
} from '../controllers/order.controller.js';
import { validateRequest, schemas } from '../middleware/validation.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/track/:trackingCode', asyncHandler(getOrderByTracking));
router.post('/verify-guest', asyncHandler(verifyGuestOrder));

// Protected routes
router.use(verifyToken);

// User routes
router.get('/user', asyncHandler(getUserOrders));
router.get('/:id', asyncHandler(getOrderById));
router.post('/', validateRequest(schemas.createOrder), asyncHandler(createOrder));
router.post('/:id/cancel', asyncHandler(cancelOrder));

// Admin routes
router.use(isAdmin);
router.get('/', validateRequest(schemas.getOrders, 'query'), asyncHandler(getOrders));
router.get('/stats', asyncHandler(getOrderStats));
router.put('/:id/status', validateRequest(schemas.updateOrderStatus), asyncHandler(updateOrderStatus));
router.put('/:id/payment', validateRequest(schemas.updatePaymentStatus), asyncHandler(updatePaymentStatus));
router.put('/:id/tracking', validateRequest(schemas.updateOrderTracking), asyncHandler(updateOrderTracking));
router.put('/bulk-status', validateRequest(schemas.bulkUpdateOrderStatus), asyncHandler(bulkUpdateOrderStatus));

export default router;
