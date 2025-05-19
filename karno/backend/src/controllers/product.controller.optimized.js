/**
 * Optimized Product Controller
 * 
 * This file contains an optimized version of the product controller using the query helpers
 * to improve performance and reduce code duplication.
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

/**
 * Helper function to delete image files
 * @private
 */
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
      { path: 'brand', select: 'name slug' }
    ]
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
      { path: 'brand', select: 'name slug' }
    ]
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
      { path: 'brand', select: 'name slug' }
    ]
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
      { path: 'brand', select: 'name slug' }
    ]
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
 * @desc    Search products with text search
 * @route   GET /api/products/search
 * @access  Public
 */
export const searchProducts = asyncHandler(async (req, res, next) => {
  const { q, limit = 10, page = 1 } = req.query;
  
  if (!q) {
    return next(new AppError('Search query is required', 400));
  }
  
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;
  
  // Create text search filter
  const filter = { $text: { $search: q } };
  
  // Execute query with text score sorting
  const products = await Product.find(filter)
    .select('name description price images category brand slug sku stock')
    .populate('category', 'name slug')
    .populate('brand', 'name slug')
    .sort({ score: { $meta: 'textScore' } })
    .skip(skip)
    .limit(limitNum)
    .lean();
  
  const total = await Product.countDocuments(filter);
  
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
 * @desc    Get product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProductById = asyncHandler(async (req, res, next) => {
  // Use lean query when we only need to read
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
 * @desc    Create new product
 * @route   POST /api/products
 * @access  Private/Admin
 */
export const createProduct = asyncHandler(async (req, res, next) => {
  const {
    name,
    description,
    price,
    category,
    brand,
    stock,
    images,
    specifications,
    compatibleVehicles,
  } = req.body;

  // Generate slug from name
  const slug = slugify(name, { lower: true });

  // Check if slug already exists
  const existingProduct = await Product.findOne({ slug });
  if (existingProduct) {
    return next(new AppError('Product with this name already exists', 400));
  }

  // Create product
  const product = await Product.create({
    name,
    slug,
    description,
    price,
    category,
    brand,
    stock,
    images: images || [],
    specifications: specifications || [],
    compatibleVehicles: compatibleVehicles || [],
    sku: req.body.sku || `SKU-${Date.now()}`,
  });

  res.status(201).json({
    status: 'success',
    data: product,
  });
});

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
export const updateProduct = asyncHandler(async (req, res, next) => {
  // Find product by ID
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Generate new slug if name is updated
  if (req.body.name) {
    req.body.slug = slugify(req.body.name, { lower: true });
    
    // Check if new slug already exists for a different product
    const existingProduct = await Product.findOne({
      slug: req.body.slug,
      _id: { $ne: req.params.id },
    });
    
    if (existingProduct) {
      return next(new AppError('Product with this name already exists', 400));
    }
  }

  // Delete old images if new ones are provided
  if (req.body.images && req.body.images.length > 0 && product.images.length > 0) {
    // Extract URLs of old images to delete
    const oldImageUrls = product.images.map(img => img.url);
    await deleteImageFiles(oldImageUrls);
  }

  // Update product
  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true },
  );

  res.status(200).json({
    status: 'success',
    data: updatedProduct,
  });
});

/**
 * @desc    Delete product
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
    const imageUrls = product.images.map(img => img.url);
    await deleteImageFiles(imageUrls);
  }

  // Delete the product
  await Product.findByIdAndDelete(req.params.id);

  res.status(200).json({
    status: 'success',
    message: 'Product deleted successfully',
  });
});

export default {
  getProducts,
  getFeaturedProducts,
  getProductsByCategory,
  getProductsByBrand,
  searchProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
}; 