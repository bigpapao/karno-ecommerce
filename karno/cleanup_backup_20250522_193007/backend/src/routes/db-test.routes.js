import express from 'express';
import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';
import Product from '../models/product.model.js';
import User from '../models/user.model.js';
import Category from '../models/category.model.js';
import Brand from '../models/brand.model.js';

const router = express.Router();

/**
 * @route   GET /api/db-test/status
 * @desc    Test database connection status without authentication for Postman testing
 * @access  Public
 */
router.get('/status', async (req, res) => {
  try {
    const status = mongoose.connection.readyState;

    // Map readyState to human-readable status
    const statusMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    // Get connection stats if available
    let poolStats = { note: 'Connection pool stats not available' };
    try {
      poolStats = mongoose.connection.client.topology
        ? {
          poolSize: mongoose.connection.client.topology.s.options.maxPoolSize || 'Unknown',
          minPoolSize: mongoose.connection.client.topology.s.options.minPoolSize || 'Unknown',
          connectTimeoutMS: mongoose.connection.client.topology.s.options.connectTimeoutMS || 'Unknown',
          socketTimeoutMS: mongoose.connection.client.topology.s.options.socketTimeoutMS || 'Unknown',
        }
        : { note: 'Connection pool stats not available' };
    } catch (err) {
      logger.warn({
        message: 'Could not retrieve pool stats',
        error: err.message,
      });
    }

    return res.status(200).json({
      success: true,
      connection: {
        status: statusMap[status] || `unknown (${status})`,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        port: mongoose.connection.port,
      },
      poolStats,
      message: `Database is ${statusMap[status] || 'in unknown state'}`,
      mongodbUri: process.env.NODE_ENV === 'production' ? 'Hidden in production' : process.env.MONGO_URI || 'Not set',
    });
  } catch (error) {
    logger.error({
      message: 'Error checking database status',
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: 'Error checking database status',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/db-test/sample-data
 * @desc    Create sample data for Postman testing without authentication
 * @access  Public
 */
router.post('/sample-data', async (req, res) => {
  try {
    const timestamp = Date.now();
    const results = {
      brand: null,
      category: null,
      product: null,
    };

    // Create a test brand
    const brand = new Brand({
      name: `Test Brand ${timestamp}`,
      slug: `test-brand-${timestamp}`,
      description: 'Test brand for database testing',
    });
    await brand.save();
    results.brand = brand;

    // Create a test category
    const category = new Category({
      name: `Test Category ${timestamp}`,
      slug: `test-category-${timestamp}`,
      description: 'Test category for database testing',
    });
    await category.save();
    results.category = category;

    // Create a test product
    const product = new Product({
      name: `Test Product ${timestamp}`,
      slug: `test-product-${timestamp}`,
      description: 'This is a test product created for database testing',
      price: 1000000, // 1,000,000 IRR
      category: category._id,
      brand: brand._id,
      stock: 10,
      sku: `SKU-TEST-${timestamp}`,
    });
    await product.save();
    results.product = product;

    return res.status(201).json({
      success: true,
      message: 'Sample data created successfully',
      results,
    });
  } catch (error) {
    logger.error({
      message: 'Error creating sample data',
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: 'Error creating sample data',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/db-test/count
 * @desc    Get count of records in each collection for Postman testing
 * @access  Public
 */
router.get('/count', async (req, res) => {
  try {
    const counts = {
      products: await Product.countDocuments(),
      users: await User.countDocuments(),
      categories: await Category.countDocuments(),
      brands: await Brand.countDocuments(),
    };

    return res.status(200).json({
      success: true,
      message: 'Collection counts retrieved successfully',
      counts,
    });
  } catch (error) {
    logger.error({
      message: 'Error getting collection counts',
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: 'Error getting collection counts',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/db-test/products
 * @desc    Get a list of products for Postman testing
 * @access  Public
 */
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find()
      .populate('category', 'name')
      .populate('brand', 'name')
      .sort('-createdAt')
      .limit(10)
      .lean();

    return res.status(200).json({
      success: true,
      count: products.length,
      message: 'Products retrieved successfully',
      products,
    });
  } catch (error) {
    logger.error({
      message: 'Error getting products',
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: 'Error getting products',
      error: error.message,
    });
  }
});

export default router;
