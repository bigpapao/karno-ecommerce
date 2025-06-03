import express from 'express';
import mongoose from 'mongoose';
import { logger } from '../../utils/logger.js';
import Product from '../../models/product.model.js';
import User from '../../models/user.model.js';
import Order from '../../models/order.model.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route   GET /api/admin/db-test/status
 * @desc    Test database connection status
 * @access  Admin
 */
router.get('/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const status = mongoose.connection.readyState;

    // Map readyState to human-readable status
    const statusMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    // Get connection stats
    const poolStats = mongoose.connection.client.topology
      ? {
        poolSize: mongoose.connection.client.topology.s.options.maxPoolSize || 'Unknown',
        minPoolSize: mongoose.connection.client.topology.s.options.minPoolSize || 'Unknown',
        connectTimeoutMS: mongoose.connection.client.topology.s.options.connectTimeoutMS || 'Unknown',
        socketTimeoutMS: mongoose.connection.client.topology.s.options.socketTimeoutMS || 'Unknown',
      }
      : { note: 'Connection pool stats not available' };

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
 * @route   POST /api/admin/db-test/product
 * @desc    Create a test product
 * @access  Admin
 */
router.post('/product', authenticate, authorize('admin'), async (req, res) => {
  try {
    // Create a test product with required fields
    const testProduct = new Product({
      name: `Test Product ${Date.now()}`,
      slug: `test-product-${Date.now()}`,
      description: 'This is a test product created for database testing',
      price: 1000000, // 1,000,000 IRR
      category: mongoose.Types.ObjectId(),
      brand: mongoose.Types.ObjectId(),
      stock: 10,
      sku: `SKU-TEST-${Date.now()}`,
    });

    await testProduct.save();

    return res.status(201).json({
      success: true,
      message: 'Test product created successfully',
      product: testProduct,
    });
  } catch (error) {
    logger.error({
      message: 'Error creating test product',
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: 'Error creating test product',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/admin/db-test/user
 * @desc    Create a test user
 * @access  Admin
 */
router.post('/user', authenticate, authorize('admin'), async (req, res) => {
  try {
    // Generate random timestamp for unique email
    const timestamp = Date.now();

    // Create a test user with required fields
    const testUser = new User({
      name: `Test User ${timestamp}`,
      email: `test.user.${timestamp}@example.com`,
      password: 'password123',
      phone: `09${Math.floor(100000000 + Math.random() * 900000000)}`, // Random Iranian format mobile
      role: 'user',
    });

    await testUser.save();

    return res.status(201).json({
      success: true,
      message: 'Test user created successfully',
      user: {
        _id: testUser._id,
        name: testUser.name,
        email: testUser.email,
        phone: testUser.phone,
        role: testUser.role,
      },
    });
  } catch (error) {
    logger.error({
      message: 'Error creating test user',
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: 'Error creating test user',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/admin/db-test/order
 * @desc    Create a test order
 * @access  Admin
 */
router.post('/order', authenticate, authorize('admin'), async (req, res) => {
  try {
    // First, find or create a user and product
    let user = await User.findOne({ role: 'user' });
    if (!user) {
      user = await User.create({
        name: 'Test User',
        email: `test.user.${Date.now()}@example.com`,
        password: 'password123',
        phone: `09${Math.floor(100000000 + Math.random() * 900000000)}`,
        role: 'user',
      });
    }

    let product = await Product.findOne();
    if (!product) {
      product = await Product.create({
        name: `Test Product ${Date.now()}`,
        slug: `test-product-${Date.now()}`,
        description: 'This is a test product created for database testing',
        price: 1000000, // 1,000,000 IRR
        category: mongoose.Types.ObjectId(),
        brand: mongoose.Types.ObjectId(),
        stock: 10,
        sku: `SKU-TEST-${Date.now()}`,
      });
    }

    // Create test order
    const testOrder = new Order({
      user: user._id,
      orderItems: [
        {
          product: product._id,
          name: product.name,
          quantity: 1,
          price: product.price,
          image: product.images && product.images.length > 0 ? product.images[0] : { url: '', alt: '' },
        },
      ],
      shippingAddress: {
        fullName: 'Test Customer',
        phoneNumber: '09123456789',
        address: 'Example Street 123',
        city: 'Tehran',
        state: 'Tehran',
        zipCode: '12345-67890',
        country: 'Iran',
      },
      shippingOption: 'standard',
      paymentMethod: 'zarinpal',
      itemsPrice: product.price,
      taxPrice: product.price * 0.09, // 9% VAT
      shippingPrice: 50000, // 50,000 IRR
      totalPrice: product.price + (product.price * 0.09) + 50000,
      status: 'pending',
    });

    await testOrder.save();

    return res.status(201).json({
      success: true,
      message: 'Test order created successfully',
      order: testOrder,
    });
  } catch (error) {
    logger.error({
      message: 'Error creating test order',
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: 'Error creating test order',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/admin/db-test/public-status
 * @desc    Test database connection status (no auth required)
 * @access  Public
 */
router.get('/public-status', async (req, res) => {
  try {
    const status = mongoose.connection.readyState;

    // Map readyState to human-readable status
    const statusMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    return res.status(200).json({
      success: true,
      connection: {
        status: statusMap[status] || `unknown (${status})`,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
      },
      message: `Database is ${statusMap[status] || 'in unknown state'}`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking database status',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/admin/db-test/connection-pool
 * @desc    Test connection pool status
 * @access  Admin
 */
router.get('/connection-pool', authenticate, authorize('admin'), async (req, res) => {
  try {
    // Get MongoDB server status (requires admin access)
    let serverStatus;
    try {
      // This requires admin database access; will fail if user doesn't have permissions
      serverStatus = await mongoose.connection.db.admin().serverStatus();
    } catch (err) {
      serverStatus = { note: 'Could not retrieve server status. Admin privileges may be required.' };
    }

    // Get connection pool info from mongoose
    const poolInfo = {
      maxPoolSize: mongoose.connection.client.topology?.s?.options?.maxPoolSize || 'Unknown',
      minPoolSize: mongoose.connection.client.topology?.s?.options?.minPoolSize || 'Unknown',
      connectTimeoutMS: mongoose.connection.client.topology?.s?.options?.connectTimeoutMS || 'Unknown',
      socketTimeoutMS: mongoose.connection.client.topology?.s?.options?.socketTimeoutMS || 'Unknown',
    };

    return res.status(200).json({
      success: true,
      poolInfo,
      serverStatus: serverStatus?.connections || serverStatus,
      message: 'Connection pool information retrieved',
    });
  } catch (error) {
    logger.error({
      message: 'Error checking connection pool',
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: 'Error checking connection pool',
      error: error.message,
    });
  }
});

export default router;
