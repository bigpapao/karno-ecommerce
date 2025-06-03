/**
 * Enhanced Product Routes (ACTIVE ROUTES)
 *
 * IMPORTANT: This is the current active product routes file used in the application.
 * The original product.routes.js file has been removed.
 *
 * This file defines all routes related to products, including enhanced search functionality.
 */

import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  getProducts,
  getProductById,
  getProductsByCategory,
  getProductsByBrand,
  searchProducts,
  getFeaturedProducts,
  clearProductCache,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller.js';
import {
  getProductAnalytics,
  updateProductStock,
  bulkUpdateProductStock,
} from '../controllers/product-analytics.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validateRequest, schemas } from '../middleware/validation.middleware.js';
import { uploadProductImages } from '../utils/fileUpload.js';
import { cacheMiddleware, clearCache } from '../middleware/cache.middleware.js';
import { trackEvent } from '../middleware/event-tracking.middleware.js';
import {
  getSearchSuggestions, searchByVehicle, getVehicleMakes, getVehicleModels, getVehicleYears,
} from '../controllers/product.controller.enhanced.js';
import { CACHE_KEYS } from '../config/redis.js';
import { paginationMiddleware } from '../middleware/pagination.middleware.js';
import mongoose from 'mongoose';

const router = express.Router();

// Public routes with caching and pagination
router.get(
  '/',
  paginationMiddleware,
  cacheMiddleware(CACHE_KEYS.PRODUCTS),
  asyncHandler(getProducts),
);

router.get(
  '/featured',
  paginationMiddleware,
  asyncHandler(getFeaturedProducts),
);

router.get(
  '/search',
  paginationMiddleware,
  validateRequest(schemas.search, 'query'),
  asyncHandler(searchProducts),
);

// Enhanced search endpoints - MUST be before /:id route
router.get('/suggest', getSearchSuggestions);

router.get(
  '/:id',
  validateRequest(schemas.id, 'params'),
  cacheMiddleware(CACHE_KEYS.PRODUCT),
  asyncHandler(getProductById),
);

router.get(
  '/category/:categoryId',
  paginationMiddleware,
  validateRequest(schemas.category, 'params'),
  cacheMiddleware(CACHE_KEYS.PRODUCTS),
  asyncHandler(getProductsByCategory),
);

router.get(
  '/brand/:brandId',
  paginationMiddleware,
  asyncHandler(getProductsByBrand),
);

// Get products by model ID
router.get(
  '/model/:modelId',
  paginationMiddleware,
  asyncHandler(async (req, res) => {
    const { modelId } = req.params;
    const { page = 1, limit = 12 } = req.query;
    
    // Import Product model at the top of the file if not already imported
    const Product = (await import('../models/product.model.js')).default;
    const VehicleModel = (await import('../models/VehicleModel.js')).default;
    
    // Create query that checks both _id and slug
    let vehicleModelQuery = { isActive: true };
    
    // Check if modelId is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(modelId)) {
      vehicleModelQuery.$or = [
        { _id: modelId },
        { slug: modelId }
      ];
    } else {
      // If not a valid ObjectId, only search by slug
      vehicleModelQuery.slug = modelId;
    }
    
    // First, find the vehicle model to ensure it exists
    const vehicleModel = await VehicleModel.findOne(vehicleModelQuery);
    
    if (!vehicleModel) {
      return res.status(404).json({ error: 'Vehicle model not found' });
    }
    
    // Query products that are compatible with this vehicle model
    const query = {
      'compatibleVehicles.modelId': vehicleModel._id,
      $or: [
        { status: { $exists: false } },
        { status: 'active' }
      ]
    };
    
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);
    const skip = (page - 1) * limit;
    
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .populate('brand', 'name slug logo')
      .sort({ featured: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // If no products found, return empty array with pagination info
    res.json({
      products: products || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalProducts,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      vehicleModel: {
        _id: vehicleModel._id,
        name: vehicleModel.name,
        manufacturer: vehicleModel.manufacturer
      }
    });
  })
);

// Vehicle compatibility endpoints
router.get('/vehicle-search', searchByVehicle);
router.get('/vehicle-makes', cacheMiddleware(86400), getVehicleMakes); // Cache for 1 day
router.get('/vehicle-models', cacheMiddleware(86400), getVehicleModels);
router.get('/vehicle-years', cacheMiddleware(86400), getVehicleYears);

// Protected routes (admin only)
router.use(authenticate, authorize('admin'));

// Product management
router.post(
  '/',
  uploadProductImages,
  validateRequest(schemas.createProduct),
  clearCache(CACHE_KEYS.PRODUCTS),
  asyncHandler(createProduct),
);

router.put(
  '/:id',
  uploadProductImages,
  validateRequest(schemas.id, 'params'),
  validateRequest(schemas.updateProduct, 'body'),
  clearCache(CACHE_KEYS.PRODUCTS),
  clearCache(CACHE_KEYS.PRODUCT),
  asyncHandler(updateProduct),
);

router.delete(
  '/:id',
  validateRequest(schemas.id, 'params'),
  clearCache(CACHE_KEYS.PRODUCTS),
  clearCache(CACHE_KEYS.PRODUCT),
  asyncHandler(deleteProduct),
);

// Product analytics and inventory management
router.get('/analytics/stats', getProductAnalytics);
router.put('/bulk-stock-update', bulkUpdateProductStock);
router.put('/:id/stock', updateProductStock);

export default router;
