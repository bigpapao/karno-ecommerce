import express from 'express';
import {
  getCategories,
  getCategory,
  getCategoryTree,
  getCategoriesByVehicleType,
  getAutomotiveCategoryStats,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoriesCSV,
  exportCategoriesCSV,
} from '../controllers/category.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes - Basic category operations
router.get('/', getCategories);
router.get('/tree', getCategoryTree);
router.get('/automotive/stats', getAutomotiveCategoryStats);
router.get('/vehicle/:vehicleType', getCategoriesByVehicleType);
router.get('/:id', getCategory);

// Protected routes (admin only)
router.use(authenticate, authorize('admin'));

// Admin category management
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

// Import/Export operations
router.post('/upload', uploadCategoriesCSV);
router.get('/export', exportCategoriesCSV);

export default router;
