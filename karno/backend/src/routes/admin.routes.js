import express from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import adminUserController from '../controllers/user.controller.js';
import adminProductController from '../controllers/product.controller.js';
import adminOrderController from '../controllers/order.controller.js';
import adminDashboardController from '../controllers/dashboard.controller.js';
import performanceRoutes from './admin/performance.routes.js';
import securityRoutes from './admin/security.routes.js';
import paymentTestRoutes from './admin/payment-test.routes.js';
const router = express.Router();
// Apply auth middleware to all admin routes
router.use(protect);
router.use(restrictTo('admin'));
// Mount performance monitoring routes
router.use('/performance', performanceRoutes);
// Mount security monitoring routes
router.use('/security', securityRoutes);
// Mount payment test routes
router.use('/payment-test', paymentTestRoutes);

// User management routes
router.get('/users', adminUserController.getAllUsers);
router.get('/users/:id', adminUserController.getUser);
router.put('/users/:id', adminUserController.updateUser);
router.delete('/users/:id', adminUserController.deleteUser);

// Product management routes
router.get('/products', adminProductController.getAllProducts);
router.post('/products', adminProductController.createProduct);
router.get('/products/:id', adminProductController.getProduct);
router.put('/products/:id', adminProductController.updateProduct);
router.delete('/products/:id', adminProductController.deleteProduct);

// Order management routes
router.get('/orders', adminOrderController.getAllOrders);
router.get('/orders/:id', adminOrderController.getOrder);
router.put('/orders/:id', adminOrderController.updateOrder);
router.delete('/orders/:id', adminOrderController.deleteOrder);

// Dashboard routes
router.get('/dashboard/summary', adminDashboardController.getDashboardSummary);
router.get('/dashboard/sales', adminDashboardController.getSalesStats);
router.get('/dashboard/products', adminDashboardController.getProductStats);
router.get('/dashboard/users', adminDashboardController.getUserStats);

export default router; 