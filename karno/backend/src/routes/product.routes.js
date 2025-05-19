import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  getProductsByBrand,
  searchProducts,
  getFeaturedProducts,
} from '../controllers/product.controller.js';
import {
  getProductAnalytics,
  updateProductStock,
  bulkUpdateProductStock,
} from '../controllers/product-analytics.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validateProduct } from '../middleware/validation.middleware.js';
import { uploadProductImages } from '../utils/fileUpload.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/search', searchProducts);
router.get('/category/:categoryId', getProductsByCategory);
router.get('/brand/:brandId', getProductsByBrand);
router.get('/:id', getProductById);

// Protected routes (admin only)
router.use(authenticate, authorize('admin'));

// Product management
router.post('/', uploadProductImages, validateProduct, createProduct);
router.put('/:id', uploadProductImages, validateProduct, updateProduct);
router.delete('/:id', deleteProduct);

// Product analytics and inventory management
router.get('/analytics/stats', getProductAnalytics);
router.put('/bulk-stock-update', bulkUpdateProductStock);
router.put('/:id/stock', updateProductStock);

export default router;
