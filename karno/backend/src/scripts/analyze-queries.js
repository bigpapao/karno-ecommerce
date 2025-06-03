#!/usr/bin/env node

/**
 * Query Performance Analysis Script
 *
 * This script analyzes MongoDB queries and indexes to identify performance issues.
 * It can be used to identify slow queries and suggest optimizations.
 *
 * Usage:
 *   node analyze-queries.js [collection] [--all]
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, closeConnection } from '../config/database.js';
import { analyzeQuery, explainQuery } from '../utils/query-analyzer.js';
import { logger } from '../utils/logger.js';

// Import all models
import User from '../models/user.model.js';
import Product from '../models/product.model.js';
import Order from '../models/order.model.js';
import Cart from '../models/cart.model.js';
import Category from '../models/category.model.js';
import Brand from '../models/brand.model.js';

// Sample queries to analyze
const sampleQueries = {
  // User queries
  User: [
    {
      name: 'Find users by role',
      query: User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(10),
    },
    {
      name: 'Find users with specific address city',
      query: User.find({ 'addresses.city': 'Tehran' }),
    },
    {
      name: 'Find users and populate addresses',
      query: User.find().select('firstName lastName phone addresses'),
    },
  ],

  // Product queries
  Product: [
    {
      name: 'Find products by category',
      query: Product.find({ category: mongoose.Types.ObjectId('ffffffffffffffffffffffff') }), // Fake ID for testing
    },
    {
      name: 'Find featured products',
      query: Product.find({ featured: true }).sort({ createdAt: -1 }),
    },
    {
      name: 'Find products in price range',
      query: Product.find({ price: { $gte: 100, $lte: 500 } }),
    },
    {
      name: 'Find products with stock and sort by price',
      query: Product.find({ stock: { $gt: 0 } }).sort({ price: 1 }),
    },
  ],

  // Order queries
  Order: [
    {
      name: 'Find orders by status',
      query: Order.find({ status: 'pending' }).sort({ createdAt: -1 }),
    },
    {
      name: 'Find orders by user',
      query: Order.find({ user: mongoose.Types.ObjectId('ffffffffffffffffffffffff') }), // Fake ID for testing
    },
    {
      name: 'Find orders with specific payment method',
      query: Order.find({ paymentMethod: 'zarinpal' }),
    },
  ],

  // Cart queries
  Cart: [
    {
      name: 'Find cart by user',
      query: Cart.find({ user: mongoose.Types.ObjectId('ffffffffffffffffffffffff') }), // Fake ID for testing
    },
  ],
};

/**
 * Analyze a specific collection's queries
 * @param {string} collectionName - Name of the collection to analyze
 */
const analyzeCollectionQueries = async (collectionName) => {
  if (!sampleQueries[collectionName]) {
    console.error(`No sample queries defined for collection: ${collectionName}`);
    return;
  }

  console.log(`\n=== Analyzing ${collectionName} queries ===`);

  for (const { name, query } of sampleQueries[collectionName]) {
    console.log(`\n## Query: ${name}`);

    try {
      // Analyze the query
      const analysis = await analyzeQuery(query);

      // Print results
      console.log(`  Execution time: ${analysis.executionTime}ms`);
      console.log(`  Documents examined: ${analysis.documentsExamined}`);
      console.log(`  Documents returned: ${analysis.documentsReturned}`);

      console.log('\n  Issues:');
      for (const issue of analysis.issues) {
        console.log(`  - ${issue}`);
      }

      console.log('\n  Recommendations:');
      for (const recommendation of analysis.recommendations) {
        console.log(`  - ${recommendation}`);
      }
    } catch (error) {
      console.error(`Error analyzing query "${name}":`, error.message);
    }
  }
};

/**
 * Analyze index usage and effectiveness
 * @param {Object} model - Mongoose model to analyze
 */
const analyzeIndexes = async (model) => {
  try {
    console.log(`\n=== Analyzing ${model.collection.name} indexes ===`);

    // Get all indexes
    const indexes = await model.collection.indexes();

    console.log('\nCurrent Indexes:');
    indexes.forEach((index, i) => {
      const keys = Object.keys(index.key).map((k) => `${k}:${index.key[k]}`).join(', ');
      console.log(`  ${i + 1}. ${index.name}: { ${keys} }${index.unique ? ' (unique)' : ''}`);
    });

    // Get index statistics
    const stats = await model.collection.stats();

    console.log('\nCollection Statistics:');
    console.log(`  Document count: ${stats.count}`);
    console.log(`  Total index size: ${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Average document size: ${(stats.avgObjSize / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error(`Error analyzing indexes for ${model.collection.name}:`, error.message);
  }
};

/**
 * Main execution function
 */
const main = async () => {
  // Parse command-line arguments
  const args = process.argv.slice(2);
  const targetCollection = args[0];
  const analyzeAll = args.includes('--all');

  try {
    // Connect to MongoDB
    await connectDB();
    logger.info('Connected to MongoDB, starting query analysis');

    // Map of collections to models
    const collections = {
      User,
      Product,
      Order,
      Cart,
      Category,
      Brand,
    };

    if (targetCollection && collections[targetCollection]) {
      // Analyze specific collection
      await analyzeCollectionQueries(targetCollection);
      await analyzeIndexes(collections[targetCollection]);
    } else if (analyzeAll) {
      // Analyze all collections
      for (const collectionName of Object.keys(collections)) {
        await analyzeCollectionQueries(collectionName);
        await analyzeIndexes(collections[collectionName]);
      }
    } else {
      // Print usage
      console.log('Usage: node analyze-queries.js [collection] [--all]');
      console.log('Available collections:');
      Object.keys(collections).forEach((name) => console.log(`  - ${name}`));
    }

    // Close database connection
    await closeConnection();
    process.exit(0);
  } catch (error) {
    logger.error({
      message: 'Error running query analysis script',
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

// Run the function
main();
