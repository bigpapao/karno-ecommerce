import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validateRequest, schemas } from '../middleware/validation.middleware.js';
import { cacheMiddleware, clearCache } from '../middleware/cache.middleware.js';
import { CACHE_KEYS } from '../config/redis.js';
import { paginationMiddleware } from '../middleware/pagination.middleware.js';
import Brand from '../models/brand.model.js';

const router = express.Router();

// Get all brands
const getBrands = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search, isActive, featured } = req.query;
  
  let query = {};
  
  // Apply search filter
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { country: { $regex: search, $options: 'i' } }
    ];
  }
  
  // Apply active filter
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }
  
  // Apply featured filter
  if (featured !== undefined) {
    query.featured = featured === 'true';
  }
  
  const skip = (page - 1) * limit;
  
  const [brands, total] = await Promise.all([
    Brand.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Brand.countDocuments(query)
  ]);
  
  res.json({
    success: true,
    data: {
      brands,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Get single brand by ID
const getBrandById = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id).lean();
  
  if (!brand) {
    return res.status(404).json({
      success: false,
      message: 'Brand not found'
    });
  }
  
  res.json({
    success: true,
    data: brand
  });
});

// Create new brand (admin only)
const createBrand = asyncHandler(async (req, res) => {
  const brand = new Brand(req.body);
  await brand.save();
  
  res.status(201).json({
    success: true,
    data: brand,
    message: 'Brand created successfully'
  });
});

// Update brand (admin only)
const updateBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  if (!brand) {
    return res.status(404).json({
      success: false,
      message: 'Brand not found'
    });
  }
  
  res.json({
    success: true,
    data: brand,
    message: 'Brand updated successfully'
  });
});

// Delete brand (admin only)
const deleteBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findByIdAndDelete(req.params.id);
  
  if (!brand) {
    return res.status(404).json({
      success: false,
      message: 'Brand not found'
    });
  }
  
  res.json({
    success: true,
    message: 'Brand deleted successfully'
  });
});

// Get featured brands
const getFeaturedBrands = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  
  const brands = await Brand.find({ featured: true, isActive: true })
    .sort({ name: 1 })
    .limit(parseInt(limit))
    .lean();
  
  res.json({
    success: true,
    data: { brands }
  });
});

// Public routes
router.get('/', paginationMiddleware, cacheMiddleware(CACHE_KEYS.BRANDS || 'brands'), getBrands);
router.get('/featured', getFeaturedBrands);
router.get('/:id', getBrandById);

// Protected routes (admin only)
router.use(authenticate, authorize('admin'));

router.post('/', createBrand);
router.put('/:id', updateBrand);
router.delete('/:id', deleteBrand);

export default router; 