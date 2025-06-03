/**
 * Database Indexes Configuration
 *
 * This module defines and creates all necessary database indexes for optimized query performance.
 * It includes text indexes for search functionality and compound indexes for common query patterns.
 */

import mongoose from 'mongoose';
import { logger } from './logger.js';

// Load all models to ensure they're registered with Mongoose
import '../models/user.model.js';
import '../models/product.model.js';
import '../models/order.model.js';
import '../models/cart.model.js';
import '../models/category.model.js';
import '../models/brand.model.js';

/**
 * Define all indexes for each collection
 */
const INDEXES = {
  // Product indexes
  products: [
    // Text indexes for full-text search
    {
      fields: {
        name: 'text',
        description: 'text',
        'specifications.value': 'text',
        'compatibleVehicles.make': 'text',
        'compatibleVehicles.model': 'text',
        sku: 'text',
      },
      options: {
        weights: {
          name: 10,
          sku: 8,
          description: 5,
          'specifications.value': 3,
          'compatibleVehicles.make': 2,
          'compatibleVehicles.model': 2,
        },
        name: 'product_text_search',
      },
    },
    // Compound indexes for filtering and sorting
    { fields: { category: 1, price: 1 }, options: { name: 'category_price' } },
    { fields: { brand: 1, price: 1 }, options: { name: 'brand_price' } },
    { fields: { featured: 1, createdAt: -1 }, options: { name: 'featured_date' } },
    { fields: { price: 1 }, options: { name: 'price' } },
    { fields: { slug: 1 }, options: { unique: true, name: 'product_slug' } },
    { fields: { sku: 1 }, options: { unique: true, name: 'product_sku' } },

    // Indexes for vehicle compatibility search
    { fields: { 'compatibleVehicles.make': 1 }, options: { name: 'compatible_make' } },
    { fields: { 'compatibleVehicles.model': 1 }, options: { name: 'compatible_model' } },
    { fields: { 'compatibleVehicles.year': 1 }, options: { name: 'compatible_year' } },

    // Compound index for full vehicle compatibility search
    {
      fields: {
        'compatibleVehicles.make': 1,
        'compatibleVehicles.model': 1,
        'compatibleVehicles.year': 1,
      },
      options: { name: 'full_vehicle_compat' },
    },
  ],

  // User indexes
  users: [
    { fields: { email: 1 }, options: { unique: true, name: 'email' } },
    { fields: { phoneNumber: 1 }, options: { sparse: true, name: 'phoneNumber' } },
    { fields: { role: 1 }, options: { name: 'role' } },
    { fields: { createdAt: -1 }, options: { name: 'createdAt' } },
  ],

  // Order indexes
  orders: [
    { fields: { user: 1, createdAt: -1 }, options: { name: 'user_date' } },
    { fields: { status: 1, createdAt: -1 }, options: { name: 'status_date' } },
    { fields: { isPaid: 1, createdAt: -1 }, options: { name: 'paid_date' } },
    { fields: { 'items.product': 1 }, options: { name: 'order_products' } },
  ],

  // Cart indexes
  carts: [
    { fields: { user: 1 }, options: { unique: true, name: 'user' } },
    { fields: { 'items.product': 1 }, options: { name: 'cart_products' } },
    { fields: { createdAt: 1 }, options: { expireAfterSeconds: 60 * 60 * 24 * 30, name: 'cart_ttl' } }, // 30 days TTL
  ],

  // Category indexes
  categories: [
    { fields: { slug: 1 }, options: { unique: true, name: 'category_slug' } },
    { fields: { name: 1 }, options: { name: 'category_name' } },
    // Text index for category search
    {
      fields: { name: 'text', description: 'text' },
      options: { weights: { name: 10, description: 5 }, name: 'category_text_search' },
    },
  ],

  // Brand indexes
  brands: [
    { fields: { slug: 1 }, options: { unique: true, name: 'brand_slug' } },
    { fields: { name: 1 }, options: { name: 'brand_name' } },
    // Text index for brand search
    {
      fields: { name: 'text', description: 'text' },
      options: { weights: { name: 10, description: 5 }, name: 'brand_text_search' },
    },
  ],
};

/**
 * Map collection names to their corresponding model names
 */
const COLLECTION_TO_MODEL_MAP = {
  products: 'Product',
  users: 'User',
  orders: 'Order',
  carts: 'Cart',
  categories: 'Category',
  brands: 'Brand',
};

/**
 * Check for and handle conflicting indexes
 * @param {Object} collection - Mongoose collection
 * @param {Array} requiredIndexes - List of indexes to create
 * @returns {Promise<void>}
 */
const handleConflictingIndexes = async (collection, requiredIndexes) => {
  try {
    // Get existing indexes
    const existingIndexes = await collection.indexes();

    // Extract all fields from the required indexes to check for conflicts
    const fieldsToCheck = [];
    requiredIndexes.forEach((idx) => {
      Object.keys(idx.key).forEach((key) => {
        // Skip _id field as it's always indexed
        if (key !== '_id' && !fieldsToCheck.includes(key)) {
          fieldsToCheck.push(key);
        }
      });
    });

    // Check for conflicting indexes
    for (const field of fieldsToCheck) {
      // Find required index with this field to get its name
      const requiredIndex = requiredIndexes.find((idx) => idx.key && idx.key[field] !== undefined);
      if (!requiredIndex) continue;

      // Find existing indexes that contain this field but have a different name
      const conflictingIndexes = existingIndexes.filter((idx) => idx.key
        && idx.key[field] !== undefined
        && idx.name !== requiredIndex.name
        // For text indexes, only compare if both are text indexes
        && (idx.key[field] !== 'text' || requiredIndex.key[field] === 'text'));

      // Drop conflicting indexes
      for (const idx of conflictingIndexes) {
        try {
          logger.info(`Dropping conflicting index ${idx.name} for field ${field}`);
          await collection.dropIndex(idx.name);
        } catch (dropError) {
          // Only log if it's not a "index not found" error
          if (!dropError.message.includes('index not found')) {
            logger.warn(`Error dropping index ${idx.name}: ${dropError.message}`);
          }
        }
      }
    }

    // Special check for compound indexes
    const compoundRequiredIndexes = requiredIndexes.filter((idx) => Object.keys(idx.key).length > 1);
    for (const requiredIdx of compoundRequiredIndexes) {
      const requiredFields = Object.keys(requiredIdx.key).sort().join(',');

      for (const existingIdx of existingIndexes) {
        if (existingIdx.name === requiredIdx.name) continue;

        const existingFields = Object.keys(existingIdx.key).sort().join(',');

        // If the fields match but names don't, it's a conflict
        if (existingFields === requiredFields) {
          try {
            logger.info(`Dropping conflicting compound index ${existingIdx.name}`);
            await collection.dropIndex(existingIdx.name);
          } catch (dropError) {
            // Only log if it's not a "index not found" error
            if (!dropError.message.includes('index not found')) {
              logger.warn(`Error dropping compound index ${existingIdx.name}: ${dropError.message}`);
            }
          }
        }
      }
    }
  } catch (error) {
    logger.warn(`Error handling conflicting indexes: ${error.message}`);
    // Continue with index creation even if conflict check fails
  }
};

/**
 * Drop all non-default indexes from a collection
 * @param {Object} collection - Mongoose collection
 * @returns {Promise<void>}
 */
const dropAllIndexes = async (collection) => {
  try {
    const indexes = await collection.indexes();

    // Skip the _id_ index which is the default index and cannot be dropped
    for (const index of indexes) {
      if (index.name !== '_id_') {
        try {
          logger.info(`Dropping index ${index.name} from ${collection.collectionName}`);
          await collection.dropIndex(index.name);
        } catch (dropError) {
          // Only log if it's not a "index not found" error
          if (!dropError.message.includes('index not found')) {
            logger.warn(`Error dropping index ${index.name}: ${dropError.message}`);
          }
        }
      }
    }
  } catch (error) {
    logger.warn(`Error dropping indexes: ${error.message}`);
  }
};

/**
 * Recreate all indexes from scratch by dropping existing ones first
 * Used for fixing persistent index conflicts
 * @returns {Promise<Object>} - Result of the index creation operation
 */
export const recreateAllIndexes = async () => {
  try {
    logger.info('Recreating all database indexes from scratch');

    // Get all models registered in Mongoose
    const modelNames = mongoose.modelNames();

    // Drop all indexes first
    for (const modelName of modelNames) {
      try {
        const model = mongoose.model(modelName);
        await dropAllIndexes(model.collection);
      } catch (error) {
        logger.error(`Error dropping indexes for ${modelName}: ${error.message}`);
      }
    }

    // Now create all indexes
    return await createAllIndexes();
  } catch (error) {
    logger.error({
      message: 'Error recreating database indexes',
      error: error.message,
      stack: error.stack,
    });

    return { success: false, error: error.message };
  }
};

/**
 * Create all required indexes in the MongoDB database
 * This function should be called during application startup
 *
 * @returns {Promise<Object>} - Result of the index creation operation
 */
export const createAllIndexes = async () => {
  try {
    logger.info('Creating database indexes');

    // Get all models registered in Mongoose
    const modelNames = mongoose.modelNames();
    const results = {};

    // Create product indexes
    if (modelNames.includes('Product')) {
      try {
        const Product = mongoose.model('Product');

        const productIndexes = [
          { key: { name: 1 }, name: 'name_idx', background: true },
          {
            key: { slug: 1 }, name: 'slug_idx', unique: true, background: true,
          },
          { key: { price: 1 }, name: 'price_idx', background: true },
          { key: { category: 1 }, name: 'category_idx', background: true },
          { key: { brand: 1 }, name: 'brand_idx', background: true },
          { key: { featured: 1 }, name: 'featured_idx', background: true },
          { key: { inStock: 1 }, name: 'inStock_idx', background: true },
          { key: { createdAt: -1 }, name: 'createdAt_idx', background: true },
          { key: { score: -1 }, name: 'score_idx', background: true },
          { key: { views: -1 }, name: 'views_idx', background: true },
          { key: { discount: -1 }, name: 'discount_idx', background: true },
          // Compound indexes for common query patterns
          { key: { category: 1, price: 1 }, name: 'category_price_idx', background: true },
          { key: { brand: 1, price: 1 }, name: 'brand_price_idx', background: true },
          { key: { featured: 1, inStock: 1 }, name: 'featured_inStock_idx', background: true },
          // Text index for search
          {
            key: { name: 'text', description: 'text', 'specs.value': 'text' },
            name: 'text_search_idx',
            weights: { name: 10, description: 5, 'specs.value': 2 },
            background: true,
            default_language: 'none', // To support Persian and other languages properly
          },
        ];

        // Handle conflicting indexes
        await handleConflictingIndexes(Product.collection, productIndexes);

        // Create indexes
        results.products = await Product.collection.createIndexes(productIndexes);

        logger.info(`Created ${Object.keys(results.products).length} product indexes`);
      } catch (error) {
        logger.error(`Error creating product indexes: ${error.message}`);
        results.products = { error: error.message };
      }
    }

    // Create category indexes
    if (modelNames.includes('Category')) {
      try {
        const Category = mongoose.model('Category');

        const categoryIndexes = [
          { key: { name: 1 }, name: 'name_idx', background: true },
          {
            key: { slug: 1 }, name: 'slug_idx', unique: true, background: true,
          },
          { key: { parent: 1 }, name: 'parent_idx', background: true },
          { key: { featured: 1 }, name: 'featured_idx', background: true },
          { key: { order: 1 }, name: 'order_idx', background: true },
        ];

        // Handle conflicting indexes
        await handleConflictingIndexes(Category.collection, categoryIndexes);

        // Create indexes
        results.categories = await Category.collection.createIndexes(categoryIndexes);

        logger.info(`Created ${Object.keys(results.categories).length} category indexes`);
      } catch (error) {
        logger.error(`Error creating category indexes: ${error.message}`);
        results.categories = { error: error.message };
      }
    }

    // Create brand indexes
    if (modelNames.includes('Brand')) {
      try {
        const Brand = mongoose.model('Brand');

        const brandIndexes = [
          { key: { name: 1 }, name: 'name_idx', background: true },
          {
            key: { slug: 1 }, name: 'slug_idx', unique: true, background: true,
          },
          { key: { featured: 1 }, name: 'featured_idx', background: true },
          { key: { order: 1 }, name: 'order_idx', background: true },
        ];

        // Handle conflicting indexes
        await handleConflictingIndexes(Brand.collection, brandIndexes);

        // Create indexes
        results.brands = await Brand.collection.createIndexes(brandIndexes);

        logger.info(`Created ${Object.keys(results.brands).length} brand indexes`);
      } catch (error) {
        logger.error(`Error creating brand indexes: ${error.message}`);
        results.brands = { error: error.message };
      }
    }

    // Create user indexes
    if (modelNames.includes('User')) {
      try {
        const User = mongoose.model('User');

        const userIndexes = [
          {
            key: { email: 1 }, name: 'email_idx', unique: true, sparse: true, background: true,
          },
          {
            key: { phone: 1 }, name: 'phone_idx', unique: true, sparse: true, background: true,
          },
          {
            key: { firebaseId: 1 }, name: 'firebaseId_idx', unique: true, sparse: true, background: true,
          },
          { key: { role: 1 }, name: 'role_idx', background: true },
          { key: { createdAt: -1 }, name: 'createdAt_idx', background: true },
          { key: { lastLogin: -1 }, name: 'lastLogin_idx', background: true },
        ];

        // Handle conflicting indexes
        await handleConflictingIndexes(User.collection, userIndexes);

        // Create indexes
        results.users = await User.collection.createIndexes(userIndexes);

        logger.info(`Created ${Object.keys(results.users).length} user indexes`);
      } catch (error) {
        logger.error(`Error creating user indexes: ${error.message}`);
        results.users = { error: error.message };
      }
    }

    // Create order indexes
    if (modelNames.includes('Order')) {
      try {
        const Order = mongoose.model('Order');

        const orderIndexes = [
          {
            key: { orderNumber: 1 }, name: 'orderNumber_idx', unique: true, sparse: true, background: true,
          },
          {
            key: { trackingCode: 1 }, name: 'trackingCode_idx', unique: true, sparse: true, background: true,
          },
          { key: { user: 1 }, name: 'user_idx', background: true },
          { key: { status: 1 }, name: 'status_idx', background: true },
          { key: { createdAt: -1 }, name: 'createdAt_idx', background: true },
          { key: { paymentStatus: 1 }, name: 'paymentStatus_idx', background: true },
          { key: { totalAmount: 1 }, name: 'totalAmount_idx', background: true },
          // Compound indexes for common query patterns
          { key: { user: 1, status: 1 }, name: 'user_status_idx', background: true },
          { key: { user: 1, createdAt: -1 }, name: 'user_date_idx', background: true },
        ];

        // Handle conflicting indexes
        await handleConflictingIndexes(Order.collection, orderIndexes);

        // Create indexes
        results.orders = await Order.collection.createIndexes(orderIndexes);

        logger.info(`Created ${Object.keys(results.orders).length} order indexes`);
      } catch (error) {
        logger.error(`Error creating order indexes: ${error.message}`);
        results.orders = { error: error.message };
      }
    }

    // Create cart indexes
    if (modelNames.includes('Cart')) {
      try {
        const Cart = mongoose.model('Cart');

        const cartIndexes = [
          {
            key: { user: 1 }, name: 'user_idx', unique: true, background: true,
          },
          {
            key: { sessionId: 1 }, name: 'sessionId_idx', unique: true, sparse: true, background: true,
          },
          { key: { updatedAt: 1 }, name: 'updatedAt_idx', background: true }, // For cart expiry
          { key: { 'items.product': 1 }, name: 'cart_product_idx', background: true },
        ];

        // Handle conflicting indexes
        await handleConflictingIndexes(Cart.collection, cartIndexes);

        // Create indexes
        results.carts = await Cart.collection.createIndexes(cartIndexes);

        logger.info(`Created ${Object.keys(results.carts).length} cart indexes`);
      } catch (error) {
        logger.error(`Error creating cart indexes: ${error.message}`);
        results.carts = { error: error.message };
      }
    }

    // Create address indexes
    if (modelNames.includes('Address')) {
      try {
        const Address = mongoose.model('Address');

        const addressIndexes = [
          { key: { user: 1 }, name: 'user_idx', background: true },
          { key: { isDefault: 1 }, name: 'isDefault_idx', background: true },
        ];

        // Handle conflicting indexes
        await handleConflictingIndexes(Address.collection, addressIndexes);

        // Create indexes
        results.addresses = await Address.collection.createIndexes(addressIndexes);

        logger.info(`Created ${Object.keys(results.addresses).length} address indexes`);
      } catch (error) {
        logger.error(`Error creating address indexes: ${error.message}`);
        results.addresses = { error: error.message };
      }
    }

    return { success: true, results };
  } catch (error) {
    logger.error({
      message: 'Error creating database indexes',
      error: error.message,
      stack: error.stack,
    });

    return { success: false, error: error.message };
  }
};

/**
 * Get information about all indexes in the database
 * @returns {Promise<{success: boolean, data?: Object, error?: Error}>} Index information
 */
export const getIndexInfo = async () => {
  try {
    const result = {};

    // For each collection in INDEXES
    for (const collectionName of Object.keys(INDEXES)) {
      // Use the correct model name from the mapping
      const modelName = COLLECTION_TO_MODEL_MAP[collectionName];
      if (!modelName) {
        logger.warn(`No model mapping found for collection: ${collectionName}`);
        continue;
      }

      try {
        const model = mongoose.model(modelName);

        // Get index information
        const indexes = await model.collection.indexes();
        result[collectionName] = indexes;
      } catch (error) {
        logger.error(`Error getting index info for ${modelName}: ${error.message}`);
        result[collectionName] = { error: error.message };
      }
    }

    return { success: true, data: result };
  } catch (error) {
    logger.error({
      message: 'Error getting index information',
      error: error.message,
      stack: error.stack,
    });
    return { success: false, error };
  }
};
