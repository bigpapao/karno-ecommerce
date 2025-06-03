/**
 * Enhanced Product Routes (ACTIVE ROUTES)
 *
 * IMPORTANT: This is the current active product routes file used in the application.
 * The original product.routes.js file has been removed.
 *
 * This file defines all routes related to products, including enhanced search functionality.
 */

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
  getSearchSuggestions,
  searchByVehicle,
  getVehicleMakes,
  getVehicleModels,
  getVehicleYears,
} from '../controllers/product.controller.enhanced.js';
import {
  getProductAnalytics,
  updateProductStock,
  bulkUpdateProductStock,
} from '../controllers/product-analytics.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validateProduct } from '../middleware/validation.middleware.js';
import { uploadProductImages } from '../utils/fileUpload.js';
import { cacheMiddleware } from '../middleware/cache.middleware.js';
import { trackEvent } from '../middleware/event-tracking.middleware.js';

const router = express.Router();

// Public routes
router.get('/', cacheMiddleware(60), getProducts);
router.get('/featured', cacheMiddleware(300), getFeaturedProducts);

// Enhanced search endpoints
router.get('/search', trackEvent('search'), searchProducts);
router.get('/suggest', getSearchSuggestions);
router.get('/vehicle-search', searchByVehicle);

// Vehicle compatibility endpoints
router.get('/vehicle-makes', cacheMiddleware(86400), getVehicleMakes); // Cache for 1 day
router.get('/vehicle-models', cacheMiddleware(86400), getVehicleModels);
router.get('/vehicle-years', cacheMiddleware(86400), getVehicleYears);

// Standard product retrieval endpoints
router.get('/category/:categoryId', cacheMiddleware(300), getProductsByCategory);
router.get('/brand/:brandId', cacheMiddleware(300), getProductsByBrand);
router.get('/:id', cacheMiddleware(300), trackEvent('view'), getProductById);

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
