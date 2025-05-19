import express from 'express';
import { getDashboardStats, getSalesAnalytics } from '../controllers/dashboard.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All dashboard routes require admin authentication
router.use(authenticate, authorize('admin'));

// Dashboard routes
router.get('/stats', getDashboardStats);
router.get('/sales', getSalesAnalytics);

export default router;
