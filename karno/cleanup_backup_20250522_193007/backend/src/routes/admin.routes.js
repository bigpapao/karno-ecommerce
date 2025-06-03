import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import * as adminUserController from '../controllers/user.controller.js';
import * as adminProductController from '../controllers/product.controller.enhanced.js';
import * as adminOrderController from '../controllers/order.controller.js';
import * as adminDashboardController from '../controllers/dashboard.controller.js';
import performanceRoutes from './admin/performance.routes.js';
import securityRoutes from './admin/security.routes.js';
import paymentTestRoutes from './admin/payment-test.routes.js';

const router = express.Router();
// Apply auth middleware to all admin routes
router.use(authenticate);
router.use(authorize('admin'));

// Mount performance monitoring routes
router.use('/performance', performanceRoutes);
// Mount security monitoring routes
router.use('/security', securityRoutes);
// Mount payment test routes
router.use('/payment-test', paymentTestRoutes);

// User management routes
router.get('/users', adminUserController.getUsers);
router.get('/users/:id', adminUserController.getUserById);
router.put('/users/:id', adminUserController.updateUser);
router.delete('/users/:id', adminUserController.deleteUser);

// Product management routes
router.get('/products', adminProductController.getProducts);
router.post('/products', adminProductController.createProduct);
router.get('/products/:id', adminProductController.getProductById);
router.put('/products/:id', adminProductController.updateProduct);
router.delete('/products/:id', adminProductController.deleteProduct);

// Order management routes
router.get('/orders', adminOrderController.getOrders);
router.get('/orders/:id', adminOrderController.getOrderById);
router.put('/orders/:id/status', adminOrderController.updateOrderStatus);
router.put('/orders/:id/tracking', adminOrderController.updateOrderTracking);

// Dashboard routes
router.get('/dashboard/stats', adminDashboardController.getDashboardStats);

export default router;
