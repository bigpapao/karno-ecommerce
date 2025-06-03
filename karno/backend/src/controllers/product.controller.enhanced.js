/**
 * Enhanced Product Controller (ACTIVE CONTROLLER)
 *
 * IMPORTANT: This is the current active product controller used in the application.
 * The original product.controller.js and product.controller.optimized.js files have been removed.
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
import { AppError } from '../middleware/error-handler.middleware.js';
import Product from '../models/product.model.js';
import Category from '../models/category.model.js';
import Brand from '../models/brand.model.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../utils/asyncHandler.js';
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
  const {
    q, page = 1, limit = 10, filter,
  } = req.query;

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
    $text: { $search: q },
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
      score: { $meta: 'textScore' },
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
    facets,
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
      data: [],
    });
  }

  // Try to get from cache first
  const cacheKey = `suggest:${q}:${limit}`;
  const cachedResult = await getSearchCache(cacheKey);

  if (cachedResult) {
    return res.status(200).json(cachedResult);
  }

  let productSuggestions = [];
  let brandSuggestions = [];
  let categorySuggestions = [];

  try {
    // Try text search first
    const textQuery = { $text: { $search: q } };

    // Get product suggestions using text search
    productSuggestions = await Product.find(textQuery)
      .select({
        name: 1,
        slug: 1,
        category: 1,
        brand: 1,
        images: { $slice: 1 },
        score: { $meta: 'textScore' },
      })
      .populate('category', 'name')
      .populate('brand', 'name')
      .sort({ score: { $meta: 'textScore' } })
      .limit(parseInt(limit, 10))
      .lean();

    // Get brand suggestions using text search
    brandSuggestions = await Brand.find({ $text: { $search: q } })
      .select('name slug')
      .sort({ score: { $meta: 'textScore' } })
      .limit(3)
      .lean();

    // Get category suggestions using text search
    categorySuggestions = await Category.find({ $text: { $search: q } })
      .select('name slug')
      .sort({ score: { $meta: 'textScore' } })
      .limit(3)
      .lean();

  } catch (error) {
    // Fallback to regex search if text search fails
    logger.warn(`Text search failed, falling back to regex search: ${error.message}`);
    
    const regexQuery = new RegExp(q, 'i');

    // Get product suggestions using regex search
    productSuggestions = await Product.find({
      $or: [
        { name: regexQuery },
        { description: regexQuery },
        { sku: regexQuery }
      ]
    })
      .select({
        name: 1,
        slug: 1,
        category: 1,
        brand: 1,
        images: { $slice: 1 },
      })
      .populate('category', 'name')
      .populate('brand', 'name')
      .sort({ name: 1 })
      .limit(parseInt(limit, 10))
      .lean();

    // Get brand suggestions using regex search
    brandSuggestions = await Brand.find({
      $or: [
        { name: regexQuery },
        { description: regexQuery }
      ]
    })
      .select('name slug')
      .sort({ name: 1 })
      .limit(3)
      .lean();

    // Get category suggestions using regex search
    categorySuggestions = await Category.find({
      $or: [
        { name: regexQuery },
        { description: regexQuery }
      ]
    })
      .select('name slug')
      .sort({ name: 1 })
      .limit(3)
      .lean();
  }

  // Format the results for the frontend
  const suggestions = productSuggestions.map((product) => ({
    type: 'product',
    id: product._id,
    name: product.name,
    slug: product.slug,
    category: product.category?.name || '',
    brand: product.brand?.name || '',
    image: product.images?.length > 0 ? product.images[0].url : null,
  }));

  // Add categories and brands to suggestions
  brandSuggestions.forEach((brand) => {
    suggestions.push({
      type: 'brand',
      id: brand._id,
      name: brand.name,
      slug: brand.slug,
    });
  });

  categorySuggestions.forEach((category) => {
    suggestions.push({
      type: 'category',
      id: category._id,
      name: category.name,
      slug: category.slug,
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
    data: suggestions,
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
  const {
    make, model, year, page = 1, limit = 10,
  } = req.query;

  if (!make) {
    return next(new AppError('Vehicle make is required', 400));
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  // Build query based on provided parameters
  const query = {
    compatibleVehicles: {
      $elemMatch: { make: new RegExp(make, 'i') },
    },
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
    data: products,
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
          { $limit: 10 },
        ],
        // Get brand distribution
        brands: [
          { $group: { _id: '$brand', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ],
        // Get price ranges
        priceRanges: [
          {
            $bucket: {
              groupBy: '$price',
              boundaries: [0, 100000, 500000, 1000000, 5000000, 10000000],
              default: 'other',
              output: { count: { $sum: 1 } },
            },
          },
        ],
        // Get rating distribution
        ratings: [
          { $group: { _id: '$rating', count: { $sum: 1 } } },
          { $sort: { _id: -1 } },
        ],
      },
    },
  ]);

  const facets = facetResults[0];

  // Populate categories with names
  const categoryIds = facets.categories.map((cat) => cat._id);
  const categories = await Category.find({ _id: { $in: categoryIds } })
    .select('_id name slug')
    .lean();

  const categoryMap = new Map(categories.map((cat) => [cat._id.toString(), cat]));

  facets.categories = facets.categories.map((cat) => ({
    _id: cat._id,
    count: cat.count,
    name: categoryMap.get(cat._id.toString())?.name || 'Unknown',
    slug: categoryMap.get(cat._id.toString())?.slug || '',
  }));

  // Populate brands with names
  const brandIds = facets.brands.map((brand) => brand._id);
  const brands = await Brand.find({ _id: { $in: brandIds } })
    .select('_id name slug')
    .lean();

  const brandMap = new Map(brands.map((brand) => [brand._id.toString(), brand]));

  facets.brands = facets.brands.map((brand) => ({
    _id: brand._id,
    count: brand.count,
    name: brandMap.get(brand._id.toString())?.name || 'Unknown',
    slug: brandMap.get(brand._id.toString())?.slug || '',
  }));

  // Format price ranges (convert to Toman from IRR)
  facets.priceRanges = facets.priceRanges.map((range) => {
    if (range._id === 'other') {
      return {
        min: 10000000,
        max: null,
        label: '۱۰ میلیون تومان و بیشتر',
        count: range.count,
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
      count: range.count,
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
    { $sort: { _id: 1 } },
  ]);

  const result = {
    status: 'success',
    results: makes.length,
    data: makes.map((item) => item._id),
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
    { $sort: { _id: 1 } },
  ]);

  const result = {
    status: 'success',
    results: models.length,
    data: models.map((item) => item._id),
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
        'compatibleVehicles.model': model,
      },
    },
    { $group: { _id: '$compatibleVehicles.year' } },
    { $sort: { _id: -1 } },
  ]);

  const result = {
    status: 'success',
    results: years.length,
    data: years.map((item) => item._id),
  };

  // Cache for 1 day
  await setSearchCache(cacheKey, result, 60 * 60 * 24);

  res.status(200).json(result);
});

/**
 * @desc    Get all products with optimized filtering, sorting and pagination
 * @route   GET /api/products
 * @access  Public
 */
export const getProducts = asyncHandler(async (req, res, next) => {
  // Setup API features with appropriate population and filters
  const features = createAPIFeatures(Product, req.query, {
    allowedFilters: ALLOWED_PRODUCT_FILTERS,
    defaultSort: { createdAt: -1 },
    populateFields: [
      { path: 'category', select: 'name slug' },
      { path: 'brand', select: 'name slug' },
    ],
  });

  // Execute query with all features applied
  const result = await features.execute();

  res.status(200).json({
    status: 'success',
    results: result.data.length,
    total: result.total,
    totalPages: result.totalPages,
    currentPage: result.currentPage,
    data: result.data,
  });
});

/**
 * @desc    Get featured products
 * @route   GET /api/products/featured
 * @access  Public
 */
export const getFeaturedProducts = asyncHandler(async (req, res, next) => {
  const { limit = 8 } = req.query;
  const limitNum = parseInt(limit, 10);

  // Use lean query for better performance when we only need to read data
  const products = await leanQuery(Product, { featured: true }, {
    limit: limitNum,
    sort: { createdAt: -1 },
    populate: [
      { path: 'category', select: 'name slug' },
      { path: 'brand', select: 'name slug' },
    ],
  });

  res.status(200).json({
    status: 'success',
    results: products.length,
    data: products,
  });
});

/**
 * @desc    Get products by category with optimized query
 * @route   GET /api/products/category/:categoryId
 * @access  Public
 */
export const getProductsByCategory = asyncHandler(async (req, res, next) => {
  // Verify that category exists first to avoid unnecessary queries
  const category = await Category.exists({ _id: req.params.categoryId });
  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  // Create query with all filters
  const features = createAPIFeatures(Product, {
    ...req.query,
    category: req.params.categoryId,
  }, {
    allowedFilters: ALLOWED_PRODUCT_FILTERS,
    populateFields: [
      { path: 'category', select: 'name slug' },
      { path: 'brand', select: 'name slug' },
    ],
  });

  // Execute query
  const result = await features.execute();

  res.status(200).json({
    status: 'success',
    results: result.data.length,
    total: result.total,
    totalPages: result.totalPages,
    currentPage: result.currentPage,
    data: result.data,
  });
});

/**
 * @desc    Get products by brand with optimized query
 * @route   GET /api/products/brand/:brandId
 * @access  Public
 */
export const getProductsByBrand = asyncHandler(async (req, res, next) => {
  // Verify that brand exists first
  const brand = await Brand.exists({ _id: req.params.brandId });
  if (!brand) {
    return next(new AppError('Brand not found', 404));
  }

  // Create query with all filters
  const features = createAPIFeatures(Product, {
    ...req.query,
    brand: req.params.brandId,
  }, {
    allowedFilters: ALLOWED_PRODUCT_FILTERS,
    populateFields: [
      { path: 'category', select: 'name slug' },
      { path: 'brand', select: 'name slug' },
    ],
  });

  // Execute query
  const result = await features.execute();

  res.status(200).json({
    status: 'success',
    results: result.data.length,
    total: result.total,
    totalPages: result.totalPages,
    currentPage: result.currentPage,
    data: result.data,
  });
});

/**
 * @desc    Get product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProductById = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name slug')
    .populate('brand', 'name slug')
    .lean();

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: product,
  });
});

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Private/Admin
 */
export const createProduct = asyncHandler(async (req, res, next) => {
  // Generate slug from name
  if (req.body.name && !req.body.slug) {
    req.body.slug = slugify(req.body.name, { lower: true });
  }

  // Process uploaded images if any
  if (req.files && req.files.length > 0) {
    req.body.images = req.files.map((file) => ({
      url: `/uploads/products/${file.filename}`,
      alt: req.body.name,
    }));
  }

  const product = await Product.create(req.body);

  res.status(201).json({
    status: 'success',
    data: product,
  });
});

/**
 * @desc    Update a product
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
export const updateProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Generate slug from name if name was updated
  if (req.body.name && (!req.body.slug || product.name !== req.body.name)) {
    req.body.slug = slugify(req.body.name, { lower: true });
  }

  // Process uploaded images if any
  if (req.files && req.files.length > 0) {
    // If replacing all images, delete old ones
    if (req.body.replaceAllImages === 'true' && product.images?.length > 0) {
      const oldImageUrls = product.images.map((img) => img.url);
      await deleteImageFiles(oldImageUrls);
      req.body.images = req.files.map((file) => ({
        url: `/uploads/products/${file.filename}`,
        alt: req.body.name || product.name,
      }));
    } else {
      // Just add new images
      const newImages = req.files.map((file) => ({
        url: `/uploads/products/${file.filename}`,
        alt: req.body.name || product.name,
      }));

      if (!product.images) {
        req.body.images = newImages;
      } else {
        req.body.images = [...product.images, ...newImages];
      }
    }
  } else if (req.body.imagesToDelete) {
    // Handle image deletion through a list of URLs
    let imagesToDelete = [];
    try {
      imagesToDelete = JSON.parse(req.body.imagesToDelete);
    } catch (error) {
      return next(new AppError('Invalid format for imagesToDelete', 400));
    }

    if (!Array.isArray(imagesToDelete)) {
      return next(new AppError('imagesToDelete must be an array', 400));
    }

    // Delete the files
    await deleteImageFiles(imagesToDelete);

    // Remove from the product object
    req.body.images = product.images.filter(
      (img) => !imagesToDelete.includes(img.url),
    );
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true },
  ).populate('category').populate('brand');

  res.status(200).json({
    status: 'success',
    data: updatedProduct,
  });
});

/**
 * @desc    Delete a product
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
export const deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Delete associated image files
  if (product.images && product.images.length > 0) {
    const imageUrls = product.images.map((img) => img.url);
    await deleteImageFiles(imageUrls);
  }

  await Product.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: 'success',
    message: 'Product deleted successfully',
  });
});
