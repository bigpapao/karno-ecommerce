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
        sku: 'text'
      },
      options: {
        weights: {
          name: 10,
          sku: 8,
          description: 5,
          'specifications.value': 3,
          'compatibleVehicles.make': 2,
          'compatibleVehicles.model': 2
        },
        name: 'product_text_search'
      }
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
        'compatibleVehicles.year': 1 
      }, 
      options: { name: 'full_vehicle_compat' } 
    }
  ],
  
  // User indexes
  users: [
    { fields: { email: 1 }, options: { unique: true, name: 'email' } },
    { fields: { phoneNumber: 1 }, options: { sparse: true, name: 'phoneNumber' } },
    { fields: { role: 1 }, options: { name: 'role' } },
    { fields: { createdAt: -1 }, options: { name: 'createdAt' } }
  ],
  
  // Order indexes
  orders: [
    { fields: { user: 1, createdAt: -1 }, options: { name: 'user_date' } },
    { fields: { status: 1, createdAt: -1 }, options: { name: 'status_date' } },
    { fields: { isPaid: 1, createdAt: -1 }, options: { name: 'paid_date' } },
    { fields: { 'items.product': 1 }, options: { name: 'order_products' } }
  ],
  
  // Cart indexes
  carts: [
    { fields: { user: 1 }, options: { unique: true, name: 'user' } },
    { fields: { 'items.product': 1 }, options: { name: 'cart_products' } },
    { fields: { createdAt: 1 }, options: { expireAfterSeconds: 60 * 60 * 24 * 30, name: 'cart_ttl' } } // 30 days TTL
  ],
  
  // Category indexes
  categories: [
    { fields: { slug: 1 }, options: { unique: true, name: 'category_slug' } },
    { fields: { name: 1 }, options: { name: 'category_name' } },
    // Text index for category search
    { 
      fields: { name: 'text', description: 'text' }, 
      options: { weights: { name: 10, description: 5 }, name: 'category_text_search' } 
    }
  ],
  
  // Brand indexes
  brands: [
    { fields: { slug: 1 }, options: { unique: true, name: 'brand_slug' } },
    { fields: { name: 1 }, options: { name: 'brand_name' } },
    // Text index for brand search
    { 
      fields: { name: 'text', description: 'text' }, 
      options: { weights: { name: 10, description: 5 }, name: 'brand_text_search' } 
    }
  ]
};

/**
 * Create all defined indexes for all collections
 * @returns {Promise<{success: boolean, error?: Error}>} Result of index creation
 */
export const createAllIndexes = async () => {
  try {
    const promises = [];
    
    // For each collection in INDEXES
    for (const [collectionName, indexes] of Object.entries(INDEXES)) {
      const model = mongoose.model(
        collectionName.charAt(0).toUpperCase() + collectionName.slice(1, -1)
      );
      
      // For each index definition in the collection
      for (const { fields, options } of indexes) {
        logger.info(`Creating index on ${collectionName}: ${JSON.stringify(fields)}`);
        promises.push(model.collection.createIndex(fields, options));
      }
    }
    
    await Promise.all(promises);
    return { success: true };
  } catch (error) {
    logger.error({
      message: 'Error creating indexes',
      error: error.message,
      stack: error.stack
    });
    return { success: false, error };
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
      const model = mongoose.model(
        collectionName.charAt(0).toUpperCase() + collectionName.slice(1, -1)
      );
      
      // Get index information
      const indexes = await model.collection.indexes();
      result[collectionName] = indexes;
    }
    
    return { success: true, data: result };
  } catch (error) {
    logger.error({
      message: 'Error getting index information',
      error: error.message,
      stack: error.stack
    });
    return { success: false, error };
  }
}; 