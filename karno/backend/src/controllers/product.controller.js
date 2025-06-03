import Product from '../models/product.model.js';
import Category from '../models/category.model.js';
import Brand from '../models/brand.model.js';
import { AppError } from '../middleware/error-handler.middleware.js';
import { logger } from '../utils/logger.js';
import redis from '../utils/redis.js';
import mongoose from 'mongoose';
import { handleProductCreated, handleProductUpdated, handleProductDeleted } from '../utils/vehicleModelCounter.js';

// Cache TTL values (in seconds)
const CACHE_TTL = {
  PRODUCTS_LIST: 600, // 10 minutes
  PRODUCT_DETAIL: 3600, // 1 hour
  FEATURED_PRODUCTS: 1800, // 30 minutes
  SEARCH_RESULTS: 300, // 5 minutes
  CATEGORY_PRODUCTS: 900, // 15 minutes
  BRAND_PRODUCTS: 900, // 15 minutes
};

/**
 * Get all products with filtering, sorting, and pagination
 */
export const getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      brand,
      minPrice,
      maxPrice,
      featured,
      sort = 'createdAt',
      order = 'desc',
      search,
    } = req.query;

    // Parse pagination parameters
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};

    // Category filter - only add if it's a valid ObjectId
    if (category && category.trim() && mongoose.Types.ObjectId.isValid(category)) {
      query.category = category;
    }

    // Brand filter - only add if it's a valid ObjectId
    if (brand && brand.trim() && mongoose.Types.ObjectId.isValid(brand)) {
      query.brand = brand;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Featured filter
    if (featured !== undefined) {
      query.featured = featured === 'true';
    }

    // Search filter
    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { sku: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    // Try to get from cache first
    const cacheKey = `products:${JSON.stringify({
      query, sort: sortObj, skip, limit: limitNum,
    })}`;
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      logger.debug(`Cache hit for ${cacheKey}`);
      return res.json(JSON.parse(cachedData));
    }

    // Execute query with better error handling
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .populate('category', 'name slug', null, { strictPopulate: false })
        .populate('brand', 'name slug logo', null, { strictPopulate: false })
        .lean(),
      Product.countDocuments(query),
    ]);

    const result = {
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    };

    // Cache the result
    await redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL.PRODUCTS_LIST);

    res.json(result);
  } catch (error) {
    logger.error({
      message: 'Error fetching products',
      error: error.message,
      stack: error.stack,
      query: req.query,
    });
    
    // Return a simple error response
    res.status(500).json({
      status: 'error',
      message: 'Error fetching products',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get a single product by ID
 */
export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Try to get from cache
    const cacheKey = `product:${id}`;
    const cachedProduct = await redis.get(cacheKey);

    if (cachedProduct) {
      logger.debug(`Cache hit for ${cacheKey}`);
      return res.json(JSON.parse(cachedProduct));
    }

    const product = await Product.findById(id)
      .populate('category', 'name slug')
      .populate('brand', 'name slug logo')
      .lean();

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    // Track product view (non-blocking)
    Product.findByIdAndUpdate(id, { $inc: { views: 1 } }).exec();

    // Save to cache
    await redis.set(cacheKey, JSON.stringify(product), 'EX', CACHE_TTL.PRODUCT_DETAIL);

    res.json(product);
  } catch (error) {
    logger.error({
      message: 'Error fetching product by ID',
      error: error.message,
      stack: error.stack,
      params: req.params,
    });
    next(new AppError('Error fetching product', 500));
  }
};

/**
 * Get all products for a specific category
 */
export const getProductsByCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    
    // Validate categoryId
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return next(new AppError('Invalid category ID', 400));
    }
    
    const {
      page = 1,
      limit = 12,
      sort = 'createdAt',
      order = 'desc',
      minPrice,
      maxPrice,
    } = req.query;

    // Parse pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = { category: categoryId };

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Build sort
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    // Try cache first
    const cacheKey = `category:${categoryId}:products:${JSON.stringify({
      query, sort: sortObj, skip, limit: limitNum,
    })}`;
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      logger.debug(`Cache hit for ${cacheKey}`);
      return res.json(JSON.parse(cachedData));
    }

    // Execute query
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .populate('category', 'name slug')
        .populate('brand', 'name slug logo')
        .lean(),
      Product.countDocuments(query),
    ]);

    const result = {
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    };

    // Cache result
    await redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL.CATEGORY_PRODUCTS);

    res.json(result);
  } catch (error) {
    logger.error({
      message: 'Error fetching products by category',
      error: error.message,
      stack: error.stack,
      params: req.params,
      query: req.query,
    });
    next(new AppError('Error fetching products by category', 500));
  }
};

/**
 * Get all products for a specific brand
 */
export const getProductsByBrand = async (req, res, next) => {
  try {
    const { brandId } = req.params;
    
    // Validate brandId
    if (!mongoose.Types.ObjectId.isValid(brandId)) {
      return next(new AppError('Invalid brand ID', 400));
    }
    
    const {
      page = 1,
      limit = 12,
      sort = 'createdAt',
      order = 'desc',
      minPrice,
      maxPrice,
    } = req.query;

    // Parse pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = { brand: brandId };

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Build sort
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    // Try cache first
    const cacheKey = `brand:${brandId}:products:${JSON.stringify({
      query, sort: sortObj, skip, limit: limitNum,
    })}`;
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      logger.debug(`Cache hit for ${cacheKey}`);
      return res.json(JSON.parse(cachedData));
    }

    // Execute query
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .populate('category', 'name slug')
        .populate('brand', 'name slug logo')
        .lean(),
      Product.countDocuments(query),
    ]);

    const result = {
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    };

    // Cache result
    await redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL.BRAND_PRODUCTS);

    res.json(result);
  } catch (error) {
    logger.error({
      message: 'Error fetching products by brand',
      error: error.message,
      stack: error.stack,
      params: req.params,
      query: req.query,
    });
    next(new AppError('Error fetching products by brand', 500));
  }
};

/**
 * Search products
 */
export const searchProducts = async (req, res, next) => {
  try {
    const {
      q, page = 1, limit = 12, category, brand, minPrice, maxPrice,
    } = req.query;

    if (!q || q.trim().length === 0) {
      return next(new AppError('Search query is required', 400));
    }

    // Parse pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Try cache first
    const cacheKey = `search:${JSON.stringify({
      q, page: pageNum, limit: limitNum, category, brand, minPrice, maxPrice,
    })}`;
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      logger.debug(`Cache hit for search: ${q}`);
      return res.json(JSON.parse(cachedData));
    }

    // Build search query
    const searchQuery = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { 'specs.value': { $regex: q, $options: 'i' } },
      ],
    };

    // Execute search
    const products = await Product.find(searchQuery)
      .sort({ featured: -1, score: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('category', 'name slug')
      .populate('brand', 'name slug logo')
      .lean();

    // Get total for pagination
    const total = await Product.countDocuments(searchQuery);

    const result = {
      query: q,
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    };

    // Save to cache
    await redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL.SEARCH_RESULTS);

    res.json(result);
  } catch (error) {
    logger.error({
      message: 'Error searching products',
      error: error.message,
      stack: error.stack,
      query: req.query,
    });
    next(new AppError('Error searching products', 500));
  }
};

/**
 * Get featured products
 */
export const getFeaturedProducts = async (req, res, next) => {
  try {
    const { limit = 8 } = req.query;

    // Try to get from cache
    const cacheKey = `featured:products:${limit}`;
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      logger.debug(`Cache hit for ${cacheKey}`);
      return res.json(JSON.parse(cachedData));
    }

    const products = await Product.find({ featured: true })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .populate('category', 'name slug')
      .populate('brand', 'name slug logo')
      .lean();

    // Save to cache
    await redis.set(cacheKey, JSON.stringify(products), 'EX', CACHE_TTL.FEATURED_PRODUCTS);

    res.json(products);
  } catch (error) {
    logger.error({
      message: 'Error fetching featured products',
      error: error.message,
      stack: error.stack,
    });
    next(new AppError('Error fetching featured products', 500));
  }
};

/**
 * Clear product cache after admin update
 */
export const clearProductCache = async (productId) => {
  try {
    // Clear specific product cache
    await redis.del(`product:${productId}`);

    // Clear lists that might contain this product
    const keys = await redis.keys('products:*');
    const categoryKeys = await redis.keys('category:*:products:*');
    const brandKeys = await redis.keys('brand:*:products:*');
    const featuredKeys = await redis.keys('featured:products:*');
    const searchKeys = await redis.keys('search:*');

    const allKeys = [
      ...keys,
      ...categoryKeys,
      ...brandKeys,
      ...featuredKeys,
      ...searchKeys,
    ];

    if (allKeys.length > 0) {
      await redis.del(allKeys);
    }

    logger.debug(`Cleared cache for product ${productId}`);
  } catch (error) {
    logger.error({
      message: 'Error clearing product cache',
      error: error.message,
      productId,
    });
  }
};

/**
 * Create a new product
 */
export const createProduct = async (req, res, next) => {
  try {
    const productData = { ...req.body };
    
    // Generate slug from name
    if (productData.name && !productData.slug) {
      productData.slug = productData.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim('-'); // Remove leading/trailing hyphens
      
      // Add timestamp to ensure uniqueness
      productData.slug += `-${Date.now()}`;
    }

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(file => ({
        url: `/uploads/products/${file.filename}`,
        alt: productData.name || 'Product image',
        filename: file.filename,
      }));
    } else if (productData.images && Array.isArray(productData.images)) {
      // Handle images passed as strings in request body (convert to object format)
      productData.images = productData.images.map(image => {
        if (typeof image === 'string') {
          return {
            url: image,
            alt: productData.name || 'Product image'
          };
        }
        return image; // Already in object format
      });
    }

    // Parse JSON fields if they exist
    if (productData.specifications && typeof productData.specifications === 'string') {
      try {
        productData.specifications = JSON.parse(productData.specifications);
      } catch (e) {
        productData.specifications = [];
      }
    }

    if (productData.compatibleVehicles && typeof productData.compatibleVehicles === 'string') {
      try {
        productData.compatibleVehicles = JSON.parse(productData.compatibleVehicles);
      } catch (e) {
        productData.compatibleVehicles = [];
      }
    }

    // Convert string booleans to actual booleans
    if (productData.featured === 'true') productData.featured = true;
    if (productData.featured === 'false') productData.featured = false;

    const product = new Product(productData);
    await product.save();
    
    // Populate the product with category and brand details
    await product.populate('category', 'name slug');
    await product.populate('brand', 'name slug logo');
    
    // Clear cache
    await clearProductCache(product._id);
    
    // Update vehicle model product counts
    await handleProductCreated(product);
    
    logger.info(`Product created successfully: ${product._id}`);
    
    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully',
    });
  } catch (error) {
    logger.error({
      message: 'Error creating product',
      error: error.message,
      stack: error.stack,
      body: req.body,
    });
    
    // Handle MongoDB duplicate key error (E11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      return next(new AppError(`${field === 'sku' ? 'Product SKU' : field} '${value}' already exists. Please use a different value.`, 400));
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return next(new AppError(`Validation Error: ${errors.join(', ')}`, 400));
    }
    next(new AppError('Error creating product', 500));
  }
};

/**
 * Update an existing product
 */
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Get the old product for comparison
    const oldProduct = await Product.findById(id).lean();
    if (!oldProduct) {
      return next(new AppError('Product not found', 404));
    }
    
    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => ({
        url: `/uploads/products/${file.filename}`,
        alt: updateData.name || 'Product image',
        filename: file.filename,
      }));
      // If there are existing images, append new ones, otherwise replace
      const existingProduct = await Product.findById(id);
      if (existingProduct && existingProduct.images && existingProduct.images.length > 0) {
        updateData.images = [...existingProduct.images, ...newImages];
      } else {
        updateData.images = newImages;
      }
    } else if (updateData.images && Array.isArray(updateData.images)) {
      // Handle images passed as strings in request body (convert to object format)
      updateData.images = updateData.images.map(image => {
        if (typeof image === 'string') {
          return {
            url: image,
            alt: updateData.name || 'Product image'
          };
        }
        return image; // Already in object format
      });
    }

    // Parse JSON fields if they exist
    if (updateData.specifications && typeof updateData.specifications === 'string') {
      try {
        updateData.specifications = JSON.parse(updateData.specifications);
      } catch (e) {
        // Keep existing specifications if parsing fails
        delete updateData.specifications;
      }
    }

    if (updateData.compatibleVehicles && typeof updateData.compatibleVehicles === 'string') {
      try {
        updateData.compatibleVehicles = JSON.parse(updateData.compatibleVehicles);
      } catch (e) {
        // Keep existing compatibleVehicles if parsing fails
        delete updateData.compatibleVehicles;
      }
    }

    // Convert string booleans to actual booleans
    if (updateData.featured === 'true') updateData.featured = true;
    if (updateData.featured === 'false') updateData.featured = false;

    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).populate('category', 'name slug')
     .populate('brand', 'name slug logo');
     
    if (!product) {
      return next(new AppError('Product not found', 404));
    }
    
    // Clear cache
    await clearProductCache(id);
    
    // Update vehicle model product counts
    await handleProductUpdated(oldProduct, product);
    
    logger.info(`Product updated successfully: ${id}`);
    
    res.json({ 
      success: true, 
      data: product,
      message: 'Product updated successfully' 
    });
  } catch (error) {
    logger.error({
      message: 'Error updating product',
      error: error.message,
      stack: error.stack,
      params: req.params,
      body: req.body,
    });
    
    // Handle MongoDB duplicate key error (E11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      return next(new AppError(`${field === 'sku' ? 'Product SKU' : field} '${value}' already exists. Please use a different value.`, 400));
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return next(new AppError(`Validation Error: ${errors.join(', ')}`, 400));
    }
    
    if (error.name === 'CastError') {
      return next(new AppError('Invalid product ID', 400));
    }
    
    next(new AppError('Error updating product', 500));
  }
};

/**
 * Delete a product
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }
    
    // Store product data before deletion for updating counts
    const productData = product.toObject();
    
    // Delete the product
    await Product.findByIdAndDelete(id);
    
    // Update vehicle model product counts
    await handleProductDeleted(productData);
    
    // Clear cache
    await clearProductCache(id);
    
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    logger.error({
      message: 'Error deleting product',
      error: error.message,
      stack: error.stack,
      params: req.params,
    });
    next(new AppError('Error deleting product', 500));
  }
};

export default {
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
};
