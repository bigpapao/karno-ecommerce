/**
 * Enhanced Product Controller
 * 
 * This controller extends the functionality of the optimized product controller
 * with improved search capabilities, including:
 * - Full text search with relevance scoring
 * - Search suggestions and auto-completion
 * - Vehicle compatibility search
 * - Faceted search capabilities
 */

import fs from 'fs/promises';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import slugify from 'slugify';
import { AppError } from '../middleware/errorHandler.js';
import Product from '../models/product.model.js';
import Category from '../models/category.model.js';
import Brand from '../models/brand.model.js';
import { logger } from '../utils/logger.js';
import asyncHandler from '../utils/asyncHandler.js';
import { createAPIFeatures, leanQuery } from '../utils/query-helpers.js';
import { getSearchCache, setSearchCache } from '../utils/cache.js';

// ES Module __dirname setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define allowed filter fields for API queries
const ALLOWED_PRODUCT_FILTERS = {
  category: 'category',
  brand: 'brand',
  featured: 'featured',
  price: 'price',
  minPrice: 'minPrice', 
  maxPrice: 'maxPrice',
  name: 'name',
  stock: 'stock',
  rating: 'rating',
  slug: 'slug',
  sku: 'sku',
};

// Helper function to delete image files
const deleteImageFiles = async (imageUrls) => {
  if (!imageUrls || imageUrls.length === 0) return;

  const deletionPromises = imageUrls.map((url) => {
    try {
      const filename = path.basename(new URL(url).pathname);
      const filePath = path.join(__dirname, '..', 'public', 'uploads', 'products', filename);
      return fs.unlink(filePath).catch((err) => {
        logger.error(`Failed to delete image ${filename}: ${err.message}`);
      });
    } catch (error) {
      logger.error(`Invalid image URL or path construction error for ${url}: ${error.message}`);
      return Promise.resolve(); // Don't break Promise.all
    }
  });
  await Promise.all(deletionPromises);
};

/**
 * @desc    Enhanced full-text search for products
 * @route   GET /api/products/search
 * @access  Public
 */
export const searchProducts = asyncHandler(async (req, res, next) => {
  const { q, page = 1, limit = 10, filter } = req.query;
  
  if (!q) {
    return next(new AppError('Search query is required', 400));
  }
  
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;
  
  // Try to get from cache first
  const cacheKey = `search:${q}:${pageNum}:${limitNum}:${filter || ''}`;
  const cachedResult = await getSearchCache(cacheKey);
  
  if (cachedResult) {
    return res.status(200).json(cachedResult);
  }
  
  // Parse additional filters if provided
  let additionalFilter = {};
  if (filter) {
    try {
      additionalFilter = JSON.parse(filter);
    } catch (error) {
      logger.warn(`Invalid filter JSON: ${filter}`);
    }
  }
  
  // Build the search query
  const baseQuery = {
    $text: { $search: q }
  };
  
  // Combine with additional filters
  const query = { ...baseQuery, ...additionalFilter };
  
  // Execute query with text score sorting
  const products = await Product.find(query)
    .select({
      name: 1,
      description: 1,
      price: 1,
      discountPrice: 1,
      images: 1,
      category: 1,
      brand: 1,
      slug: 1,
      sku: 1,
      stock: 1,
      rating: 1,
      numReviews: 1,
      score: { $meta: 'textScore' }
    })
    .populate('category', 'name slug')
    .populate('brand', 'name slug')
    .sort({ score: { $meta: 'textScore' } })
    .skip(skip)
    .limit(limitNum)
    .lean();
  
  const total = await Product.countDocuments(query);
  
  // Collect additional information for faceted search
  const facets = await getSearchFacets(query);
  
  const result = {
    status: 'success',
    results: products.length,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    data: products,
    facets
  };
  
  // Cache the result for 5 minutes
  await setSearchCache(cacheKey, result, 300);
  
  res.status(200).json(result);
});

/**
 * @desc    Get search suggestions based on user input
 * @route   GET /api/products/suggest
 * @access  Public
 */
export const getSearchSuggestions = asyncHandler(async (req, res, next) => {
  const { q, limit = 10 } = req.query;
  
  if (!q || q.length < 2) {
    return res.status(200).json({
      status: 'success',
      results: 0,
      data: []
    });
  }
  
  // Try to get from cache first
  const cacheKey = `suggest:${q}:${limit}`;
  const cachedResult = await getSearchCache(cacheKey);
  
  if (cachedResult) {
    return res.status(200).json(cachedResult);
  }
  
  // Build the search query with specific field projections
  const query = {
    $text: { $search: q }
  };
  
  // Get product suggestions
  const productSuggestions = await Product.find(query)
    .select({
      'name': 1,
      'slug': 1,
      'category': 1,
      'brand': 1,
      'images': { $slice: 1 },
      score: { $meta: 'textScore' }
    })
    .populate('category', 'name')
    .populate('brand', 'name')
    .sort({ score: { $meta: 'textScore' } })
    .limit(parseInt(limit, 10))
    .lean();
  
  // Get brand suggestions
  const brandSuggestions = await Brand.find({ $text: { $search: q } })
    .select('name slug')
    .sort({ score: { $meta: 'textScore' } })
    .limit(3)
    .lean();
  
  // Get category suggestions
  const categorySuggestions = await Category.find({ $text: { $search: q } })
    .select('name slug')
    .sort({ score: { $meta: 'textScore' } })
    .limit(3)
    .lean();
  
  // Format the results for the frontend
  const suggestions = productSuggestions.map(product => ({
    type: 'product',
    id: product._id,
    name: product.name,
    slug: product.slug,
    category: product.category?.name || '',
    brand: product.brand?.name || '',
    image: product.images?.length > 0 ? product.images[0].url : null
  }));
  
  // Add categories and brands to suggestions
  brandSuggestions.forEach(brand => {
    suggestions.push({
      type: 'brand',
      id: brand._id,
      name: brand.name,
      slug: brand.slug
    });
  });
  
  categorySuggestions.forEach(category => {
    suggestions.push({
      type: 'category',
      id: category._id,
      name: category.name,
      slug: category.slug
    });
  });
  
  // Sort all suggestions by relevance (assuming products are more relevant than categories/brands)
  suggestions.sort((a, b) => {
    if (a.type === 'product' && b.type !== 'product') return -1;
    if (a.type !== 'product' && b.type === 'product') return 1;
    // Sort by name if same type
    return a.name.localeCompare(b.name);
  });
  
  const result = {
    status: 'success',
    results: suggestions.length,
    data: suggestions
  };
  
  // Cache for 5 minutes
  await setSearchCache(cacheKey, result, 300);
  
  res.status(200).json(result);
});

/**
 * @desc    Search products by vehicle compatibility
 * @route   GET /api/products/vehicle-search
 * @access  Public
 */
export const searchByVehicle = asyncHandler(async (req, res, next) => {
  const { make, model, year, page = 1, limit = 10 } = req.query;
  
  if (!make) {
    return next(new AppError('Vehicle make is required', 400));
  }
  
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;
  
  // Build query based on provided parameters
  const query = {
    'compatibleVehicles': {
      $elemMatch: { make: new RegExp(make, 'i') }
    }
  };
  
  if (model) {
    query.compatibleVehicles.$elemMatch.model = new RegExp(model, 'i');
  }
  
  if (year) {
    query.compatibleVehicles.$elemMatch.year = parseInt(year, 10);
  }
  
  // Execute query
  const products = await Product.find(query)
    .select('name description price images category brand slug stock rating')
    .populate('category', 'name slug')
    .populate('brand', 'name slug')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .lean();
  
  const total = await Product.countDocuments(query);
  
  res.status(200).json({
    status: 'success',
    results: products.length,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    data: products
  });
});

/**
 * Helper function to get faceted search information
 * @private
 */
const getSearchFacets = async (baseQuery) => {
  // Execute aggregation pipeline to get facet data
  const facetResults = await Product.aggregate([
    { $match: baseQuery },
    { 
      $facet: {
        // Get category distribution
        categories: [
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ],
        // Get brand distribution
        brands: [
          { $group: { _id: '$brand', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ],
        // Get price ranges
        priceRanges: [
          { 
            $bucket: {
              groupBy: '$price',
              boundaries: [0, 100000, 500000, 1000000, 5000000, 10000000],
              default: 'other',
              output: { count: { $sum: 1 } }
            }
          }
        ],
        // Get rating distribution
        ratings: [
          { $group: { _id: '$rating', count: { $sum: 1 } } },
          { $sort: { _id: -1 } }
        ]
      }
    }
  ]);
  
  const facets = facetResults[0];
  
  // Populate categories with names
  const categoryIds = facets.categories.map(cat => cat._id);
  const categories = await Category.find({ _id: { $in: categoryIds } })
    .select('_id name slug')
    .lean();
  
  const categoryMap = new Map(categories.map(cat => [cat._id.toString(), cat]));
  
  facets.categories = facets.categories.map(cat => ({
    _id: cat._id,
    count: cat.count,
    name: categoryMap.get(cat._id.toString())?.name || 'Unknown',
    slug: categoryMap.get(cat._id.toString())?.slug || ''
  }));
  
  // Populate brands with names
  const brandIds = facets.brands.map(brand => brand._id);
  const brands = await Brand.find({ _id: { $in: brandIds } })
    .select('_id name slug')
    .lean();
  
  const brandMap = new Map(brands.map(brand => [brand._id.toString(), brand]));
  
  facets.brands = facets.brands.map(brand => ({
    _id: brand._id,
    count: brand.count,
    name: brandMap.get(brand._id.toString())?.name || 'Unknown',
    slug: brandMap.get(brand._id.toString())?.slug || ''
  }));
  
  // Format price ranges (convert to Toman from IRR)
  facets.priceRanges = facets.priceRanges.map(range => {
    if (range._id === 'other') {
      return {
        min: 10000000,
        max: null,
        label: '۱۰ میلیون تومان و بیشتر',
        count: range.count
      };
    }
    
    const boundaries = [0, 100000, 500000, 1000000, 5000000, 10000000];
    const index = boundaries.indexOf(range._id);
    
    // Convert to Toman (divide by 10)
    const min = range._id / 10;
    const max = index < boundaries.length - 1 ? boundaries[index + 1] / 10 : null;
    
    let label;
    if (min === 0) {
      label = `کمتر از ${(max / 1000).toLocaleString('fa-IR')} هزار تومان`;
    } else if (max === null) {
      label = `بیشتر از ${(min / 1000000).toLocaleString('fa-IR')} میلیون تومان`;
    } else if (min >= 1000000) {
      label = `${(min / 1000000).toLocaleString('fa-IR')} تا ${(max / 1000000).toLocaleString('fa-IR')} میلیون تومان`;
    } else if (min >= 1000) {
      label = `${(min / 1000).toLocaleString('fa-IR')} تا ${(max / 1000).toLocaleString('fa-IR')} هزار تومان`;
    } else {
      label = `${min.toLocaleString('fa-IR')} تا ${max.toLocaleString('fa-IR')} تومان`;
    }
    
    return {
      min: range._id,
      max: index < boundaries.length - 1 ? boundaries[index + 1] : null,
      label,
      count: range.count
    };
  });
  
  return facets;
};

/**
 * @desc    Get unique vehicle makes for the search dropdown
 * @route   GET /api/products/vehicle-makes
 * @access  Public
 */
export const getVehicleMakes = asyncHandler(async (req, res, next) => {
  // Try to get from cache first
  const cacheKey = 'vehicle:makes';
  const cachedResult = await getSearchCache(cacheKey);
  
  if (cachedResult) {
    return res.status(200).json(cachedResult);
  }
  
  // Get all unique vehicle makes
  const makes = await Product.aggregate([
    { $unwind: '$compatibleVehicles' },
    { $group: { _id: '$compatibleVehicles.make' } },
    { $sort: { _id: 1 } }
  ]);
  
  const result = {
    status: 'success',
    results: makes.length,
    data: makes.map(item => item._id)
  };
  
  // Cache for 1 day
  await setSearchCache(cacheKey, result, 60 * 60 * 24);
  
  res.status(200).json(result);
});

/**
 * @desc    Get vehicle models for a specific make
 * @route   GET /api/products/vehicle-models
 * @access  Public
 */
export const getVehicleModels = asyncHandler(async (req, res, next) => {
  const { make } = req.query;
  
  if (!make) {
    return next(new AppError('Vehicle make is required', 400));
  }
  
  // Try to get from cache first
  const cacheKey = `vehicle:models:${make}`;
  const cachedResult = await getSearchCache(cacheKey);
  
  if (cachedResult) {
    return res.status(200).json(cachedResult);
  }
  
  // Get all unique vehicle models for the specified make
  const models = await Product.aggregate([
    { $unwind: '$compatibleVehicles' },
    { $match: { 'compatibleVehicles.make': make } },
    { $group: { _id: '$compatibleVehicles.model' } },
    { $sort: { _id: 1 } }
  ]);
  
  const result = {
    status: 'success',
    results: models.length,
    data: models.map(item => item._id)
  };
  
  // Cache for 1 day
  await setSearchCache(cacheKey, result, 60 * 60 * 24);
  
  res.status(200).json(result);
});

/**
 * @desc    Get vehicle years for a specific make and model
 * @route   GET /api/products/vehicle-years
 * @access  Public
 */
export const getVehicleYears = asyncHandler(async (req, res, next) => {
  const { make, model } = req.query;
  
  if (!make || !model) {
    return next(new AppError('Vehicle make and model are required', 400));
  }
  
  // Try to get from cache first
  const cacheKey = `vehicle:years:${make}:${model}`;
  const cachedResult = await getSearchCache(cacheKey);
  
  if (cachedResult) {
    return res.status(200).json(cachedResult);
  }
  
  // Get all unique vehicle years for the specified make and model
  const years = await Product.aggregate([
    { $unwind: '$compatibleVehicles' },
    { 
      $match: { 
        'compatibleVehicles.make': make,
        'compatibleVehicles.model': model
      } 
    },
    { $group: { _id: '$compatibleVehicles.year' } },
    { $sort: { _id: -1 } }
  ]);
  
  const result = {
    status: 'success',
    results: years.length,
    data: years.map(item => item._id)
  };
  
  // Cache for 1 day
  await setSearchCache(cacheKey, result, 60 * 60 * 24);
  
  res.status(200).json(result);
});

// Export other methods from the optimized controller for full compatibility
export { 
  getProducts,
  getFeaturedProducts,
  getProductsByCategory,
  getProductsByBrand,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from './product.controller.optimized.js'; 