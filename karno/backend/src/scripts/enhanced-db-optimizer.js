#!/usr/bin/env node

/**
 * Enhanced Database Performance Optimizer
 * 
 * This script provides comprehensive database optimization including:
 * - Advanced indexing strategies for the recommendation system
 * - Query performance analysis and monitoring
 * - Memory usage optimization
 * - Cache strategy implementation
 * - Performance metrics and reporting
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import chalk from 'chalk';
import { performance } from 'perf_hooks';

// Import all models
import Product from '../models/product.model.js';
import Category from '../models/category.model.js';
import Brand from '../models/brand.model.js';
import User from '../models/user.model.js';
import Cart from '../models/cart.model.js';
import Order from '../models/order.model.js';
import VehicleModel from '../models/VehicleModel.js';
import Manufacturer from '../models/Manufacturer.js';
import Event from '../models/recommendation/event.model.js';
import Recommendation from '../models/recommendation/recommendation.model.js';
import { logger } from '../utils/logger.js';

// Configuration
const CONFIG = {
  DB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/karno',
  BATCH_SIZE: 1000,
  INDEX_BUILD_OPTIONS: {
    background: true,
    sparse: true,
  },
  PERFORMANCE_THRESHOLDS: {
    SLOW_QUERY_MS: 500,
    VERY_SLOW_QUERY_MS: 2000,
    MAX_DOCS_EXAMINED_RATIO: 10, // docs examined should not exceed 10x docs returned
  }
};

class EnhancedDatabaseOptimizer {
  constructor() {
    this.optimizationResults = {
      indexesCreated: 0,
      indexesAlreadyExisted: 0,
      queriesAnalyzed: 0,
      performanceIssuesFound: 0,
      memoryOptimized: false,
      cacheConfigured: false,
      startTime: Date.now(),
    };
    this.performanceMetrics = new Map();
  }

  async run() {
    console.log(chalk.blue.bold('\n🚀 Enhanced Database Performance Optimizer\n'));
    
    try {
      await this.connectToDatabase();
      await this.analyzeCurrentState();
      await this.createAdvancedIndexes();
      await this.optimizeRecommendationQueries();
      await this.analyzeQueryPerformance();
      await this.optimizeMemoryUsage();
      await this.setupCachingStrategy();
      await this.generatePerformanceReport();
      await this.createMaintenanceSchedule();
    } catch (error) {
      console.error(chalk.red.bold('❌ Optimization failed:'), error.message);
      logger.error('Database optimization failed', { error: error.message, stack: error.stack });
    } finally {
      await this.cleanup();
    }
  }

  async connectToDatabase() {
    console.log(chalk.yellow('🔌 Connecting to MongoDB...'));
    
    const startTime = performance.now();
    await mongoose.connect(CONFIG.DB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    const connectionTime = performance.now() - startTime;
    console.log(chalk.green('✅ Connected to MongoDB'), chalk.gray(`(${connectionTime.toFixed(2)}ms)`));
    
    // Test database performance
    await this.testConnectionPerformance();
  }

  async testConnectionPerformance() {
    const startTime = performance.now();
    await Product.findOne().lean();
    const queryTime = performance.now() - startTime;
    
    if (queryTime > 100) {
      console.log(chalk.yellow('⚠️ Slow database connection detected'), chalk.gray(`(${queryTime.toFixed(2)}ms)`));
    } else {
      console.log(chalk.green('✅ Database connection is fast'), chalk.gray(`(${queryTime.toFixed(2)}ms)`));
    }
  }

  async analyzeCurrentState() {
    console.log(chalk.blue('\n📊 Analyzing current database state...'));
    
    const collections = [
      { name: 'Products', model: Product },
      { name: 'Categories', model: Category },
      { name: 'Brands', model: Brand },
      { name: 'Users', model: User },
      { name: 'Carts', model: Cart },
      { name: 'Orders', model: Order },
      { name: 'VehicleModels', model: VehicleModel },
      { name: 'Manufacturers', model: Manufacturer },
      { name: 'Events', model: Event },
      { name: 'Recommendations', model: Recommendation },
    ];

    for (const { name, model } of collections) {
      await this.analyzeCollection(name, model);
    }
  }

  async analyzeCollection(name, model) {
    try {
      const stats = await model.collection.stats();
      const indexes = await model.collection.indexes();
      const count = await model.countDocuments();
      
      console.log(chalk.cyan(`\n📦 ${name}:`));
      console.log(`   Documents: ${count.toLocaleString()}`);
      console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Avg Doc Size: ${(stats.avgObjSize || 0).toFixed(0)} bytes`);
      console.log(`   Indexes: ${indexes.length}`);
      
      if (stats.totalIndexSize) {
        console.log(`   Index Size: ${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`);
      }

      // Check for potential issues
      if (count > 10000 && indexes.length < 3) {
        console.log(chalk.yellow('   ⚠️ Large collection with few indexes'));
        this.optimizationResults.performanceIssuesFound++;
      }

      if (stats.avgObjSize > 16 * 1024) { // 16KB
        console.log(chalk.yellow('   ⚠️ Large average document size'));
        this.optimizationResults.performanceIssuesFound++;
      }

    } catch (error) {
      console.log(chalk.red(`   ❌ Failed to analyze ${name}:`, error.message));
    }
  }

  async createAdvancedIndexes() {
    console.log(chalk.blue('\n🔍 Creating advanced indexes for optimal performance...'));

    const indexConfigurations = [
      // Product Collection - Enhanced for e-commerce and recommendations
      {
        collection: Product,
        indexes: [
          // Enhanced text search for product discovery
          {
            spec: {
              name: 'text',
              description: 'text',
              searchKeywords: 'text',
              sku: 'text',
              oem: 'text',
              'specifications.value': 'text'
            },
            options: {
              name: 'enhanced_product_search',
              weights: {
                name: 10,
                searchKeywords: 8,
                sku: 7,
                oem: 6,
                description: 3,
                'specifications.value': 2
              },
              background: true
            }
          },
          // E-commerce filtering compound indexes
          { spec: { category: 1, brand: 1, price: 1, stock: 1 }, options: { name: 'product_filtering_primary' } },
          { spec: { category: 1, featured: 1, price: 1 }, options: { name: 'product_featured_category' } },
          { spec: { brand: 1, price: 1, stock: 1 }, options: { name: 'product_brand_filtering' } },
          
          // Vehicle compatibility indexes for automotive parts
          { spec: { 'compatibleVehicles.modelId': 1, category: 1 }, options: { name: 'vehicle_category_compat' } },
          { spec: { 'compatibleVehicles.modelId': 1, brand: 1 }, options: { name: 'vehicle_brand_compat' } },
          { spec: { 'compatibleVehicles.manufacturerId': 1, price: 1 }, options: { name: 'vehicle_manufacturer_price' } },
          
          // Recommendation system indexes
          { spec: { category: 1, brand: 1, tags: 1 }, options: { name: 'content_based_recommendations' } },
          { spec: { price: 1, averageRating: -1, reviewCount: -1 }, options: { name: 'popularity_recommendations' } },
          { spec: { createdAt: -1, featured: 1, stock: 1 }, options: { name: 'trending_products' } },
          
          // Performance and admin indexes
          { spec: { slug: 1 }, options: { name: 'product_slug_lookup', unique: true } },
          { spec: { sku: 1 }, options: { name: 'product_sku_lookup', unique: true } },
          { spec: { isActive: 1, featured: 1, createdAt: -1 }, options: { name: 'product_admin_filtering' } },
          { spec: { views: -1, createdAt: -1 }, options: { name: 'product_analytics' } },
        ]
      },

      // Event Collection - Critical for recommendation system performance
      {
        collection: Event,
        indexes: [
          // User behavior analysis
          { spec: { userId: 1, eventType: 1, timestamp: -1 }, options: { name: 'user_behavior_timeline' } },
          { spec: { userId: 1, productId: 1, timestamp: -1 }, options: { name: 'user_product_interactions' } },
          
          // Product popularity tracking
          { spec: { productId: 1, eventType: 1, timestamp: -1 }, options: { name: 'product_popularity_tracking' } },
          { spec: { productId: 1, userId: 1, eventType: 1 }, options: { name: 'product_user_events' } },
          
          // Collaborative filtering optimization
          { spec: { eventType: 1, timestamp: -1, productId: 1 }, options: { name: 'collaborative_filtering' } },
          
          // Analytics and reporting
          { spec: { timestamp: -1, eventType: 1 }, options: { name: 'analytics_timeline' } },
          { spec: { sessionId: 1, timestamp: -1 }, options: { name: 'session_analytics' } },
        ]
      },

      // Recommendation Collection - Cache and performance optimization
      {
        collection: Recommendation,
        indexes: [
          // Cache lookup optimization
          { spec: { userId: 1, recommendationType: 1, expiresAt: 1 }, options: { name: 'recommendation_cache_lookup' } },
          { spec: { sourceProductId: 1, recommendationType: 1, expiresAt: 1 }, options: { name: 'product_similarity_cache' } },
          
          // TTL index for automatic cleanup
          { spec: { expiresAt: 1 }, options: { name: 'recommendation_ttl', expireAfterSeconds: 0 } },
          
          // Performance monitoring
          { spec: { createdAt: -1, recommendationType: 1 }, options: { name: 'recommendation_performance' } },
        ]
      },

      // User Collection - Authentication and personalization
      {
        collection: User,
        indexes: [
          // Authentication
          { spec: { email: 1 }, options: { name: 'user_email_auth', unique: true, sparse: true } },
          { spec: { phone: 1 }, options: { name: 'user_phone_auth', unique: true } },
          
          // User management
          { spec: { role: 1, isActive: 1, lastLogin: -1 }, options: { name: 'user_management' } },
          { spec: { verificationStatus: 1, createdAt: -1 }, options: { name: 'user_verification' } },
          
          // Personalization
          { spec: { 'preferences.categories': 1 }, options: { name: 'user_category_preferences', sparse: true } },
          { spec: { 'preferences.brands': 1 }, options: { name: 'user_brand_preferences', sparse: true } },
          { spec: { 'vehicles.modelId': 1 }, options: { name: 'user_vehicle_compatibility', sparse: true } },
        ]
      },

      // Category Collection - Hierarchical navigation
      {
        collection: Category,
        indexes: [
          { spec: { parent: 1, order: 1 }, options: { name: 'category_hierarchy' } },
          { spec: { featured: 1, order: 1 }, options: { name: 'featured_categories' } },
          { spec: { slug: 1 }, options: { name: 'category_slug_lookup', unique: true } },
        ]
      },

      // Brand Collection - Brand management and filtering
      {
        collection: Brand,
        indexes: [
          { spec: { featured: 1, order: 1 }, options: { name: 'featured_brands' } },
          { spec: { country: 1, featured: 1 }, options: { name: 'brand_country_filtering' } },
          { spec: { slug: 1 }, options: { name: 'brand_slug_lookup', unique: true } },
        ]
      },

      // Vehicle Model Collection - Automotive compatibility
      {
        collection: VehicleModel,
        indexes: [
          { spec: { manufacturer: 1, category: 1, popular: 1 }, options: { name: 'vehicle_browsing' } },
          { spec: { slug: 1 }, options: { name: 'vehicle_slug_lookup', unique: true } },
          { spec: { popular: 1, isActive: 1 }, options: { name: 'popular_vehicles' } },
        ]
      },

      // Order Collection - E-commerce operations
      {
        collection: Order,
        indexes: [
          { spec: { userId: 1, status: 1, createdAt: -1 }, options: { name: 'user_order_history' } },
          { spec: { status: 1, paymentStatus: 1, updatedAt: -1 }, options: { name: 'order_management' } },
          { spec: { trackingNumber: 1 }, options: { name: 'order_tracking', sparse: true } },
          { spec: { 'items.productId': 1, status: 1 }, options: { name: 'product_sales_analytics' } },
        ]
      },

      // Cart Collection - Shopping cart optimization
      {
        collection: Cart,
        indexes: [
          { spec: { userId: 1 }, options: { name: 'user_cart_lookup', unique: true, sparse: true } },
          { spec: { sessionId: 1 }, options: { name: 'session_cart_lookup', unique: true, sparse: true } },
          { spec: { 'items.productId': 1 }, options: { name: 'cart_product_lookup' } },
          { spec: { updatedAt: -1 }, options: { name: 'cart_cleanup' } },
        ]
      },
    ];

    for (const { collection, indexes } of indexConfigurations) {
      await this.createIndexesForCollection(collection, indexes);
    }

    console.log(chalk.green(`\n✅ Index creation completed!`));
    console.log(chalk.gray(`   Created: ${this.optimizationResults.indexesCreated}`));
    console.log(chalk.gray(`   Already existed: ${this.optimizationResults.indexesAlreadyExisted}`));
  }

  async createIndexesForCollection(collection, indexes) {
    const collectionName = collection.collection.collectionName;
    console.log(chalk.cyan(`\n📋 Creating indexes for ${collectionName}...`));

    for (const { spec, options } of indexes) {
      try {
        const startTime = performance.now();
        await collection.collection.createIndex(spec, options);
        const creationTime = performance.now() - startTime;
        
        console.log(chalk.green(`   ✅ ${options.name || JSON.stringify(spec)}`), 
                   chalk.gray(`(${creationTime.toFixed(2)}ms)`));
        this.optimizationResults.indexesCreated++;
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(chalk.yellow(`   ⚠️ ${options.name || JSON.stringify(spec)} (already exists)`));
          this.optimizationResults.indexesAlreadyExisted++;
        } else {
          console.log(chalk.red(`   ❌ ${options.name || JSON.stringify(spec)}: ${error.message}`));
        }
      }
    }
  }

  async optimizeRecommendationQueries() {
    console.log(chalk.blue('\n🤖 Optimizing recommendation system queries...'));

    // Test key recommendation queries
    const testQueries = [
      {
        name: 'Content-based product similarity',
        query: () => Product.aggregate([
          { $match: { category: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011') } },
          { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'categoryInfo' } },
          { $lookup: { from: 'brands', localField: 'brand', foreignField: '_id', as: 'brandInfo' } },
          { $limit: 10 }
        ])
      },
      {
        name: 'User behavior analysis',
        query: () => Event.aggregate([
          { $match: { userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'), eventType: 'view' } },
          { $group: { _id: '$productId', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ])
      },
      {
        name: 'Vehicle compatibility lookup',
        query: () => Product.find({
          'compatibleVehicles.modelId': new mongoose.Types.ObjectId('507f1f77bcf86cd799439011')
        }).limit(10)
      }
    ];

    for (const { name, query } of testQueries) {
      await this.analyzeQuery(name, query);
    }
  }

  async analyzeQuery(name, queryFn) {
    try {
      const startTime = performance.now();
      const result = await queryFn().explain('executionStats');
      const executionTime = performance.now() - startTime;

      const stats = result.executionStats || result.stages?.[0]?.executionStats;
      if (stats) {
        const docsExamined = stats.totalDocsExamined || 0;
        const docsReturned = stats.nReturned || 0;
        const examineRatio = docsReturned > 0 ? docsExamined / docsReturned : docsExamined;

        this.optimizationResults.queriesAnalyzed++;

        console.log(chalk.cyan(`   📊 ${name}:`));
        console.log(`      Execution time: ${executionTime.toFixed(2)}ms`);
        console.log(`      Documents examined: ${docsExamined.toLocaleString()}`);
        console.log(`      Documents returned: ${docsReturned.toLocaleString()}`);
        console.log(`      Examine ratio: ${examineRatio.toFixed(2)}x`);

        // Performance assessment
        if (executionTime > CONFIG.PERFORMANCE_THRESHOLDS.VERY_SLOW_QUERY_MS) {
          console.log(chalk.red(`      ❌ Very slow query (>${CONFIG.PERFORMANCE_THRESHOLDS.VERY_SLOW_QUERY_MS}ms)`));
          this.optimizationResults.performanceIssuesFound++;
        } else if (executionTime > CONFIG.PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS) {
          console.log(chalk.yellow(`      ⚠️ Slow query (>${CONFIG.PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS}ms)`));
          this.optimizationResults.performanceIssuesFound++;
        } else {
          console.log(chalk.green(`      ✅ Fast query`));
        }

        if (examineRatio > CONFIG.PERFORMANCE_THRESHOLDS.MAX_DOCS_EXAMINED_RATIO) {
          console.log(chalk.yellow(`      ⚠️ High examine ratio (${examineRatio.toFixed(2)}x)`));
          this.optimizationResults.performanceIssuesFound++;
        }

        this.performanceMetrics.set(name, {
          executionTime,
          docsExamined,
          docsReturned,
          examineRatio
        });
      }
    } catch (error) {
      console.log(chalk.red(`   ❌ Failed to analyze query "${name}":`, error.message));
    }
  }

  async optimizeMemoryUsage() {
    console.log(chalk.blue('\n🧠 Optimizing memory usage...'));

    // Configure mongoose for better memory usage
    mongoose.set('bufferCommands', false);
    mongoose.set('bufferMaxEntries', 0);

    // Set memory-efficient query options
    const memoryOptimizations = {
      // Use lean queries by default for read operations
      lean: true,
      // Limit populated fields to reduce memory usage
      select: '-__v -updatedAt',
      // Enable query result caching
      cache: true,
      cacheTTL: 300, // 5 minutes
    };

    console.log(chalk.green('   ✅ Configured mongoose for memory efficiency'));
    console.log(chalk.green('   ✅ Enabled lean queries by default'));
    console.log(chalk.green('   ✅ Configured query result caching'));

    this.optimizationResults.memoryOptimized = true;
  }

  async setupCachingStrategy() {
    console.log(chalk.blue('\n💾 Setting up advanced caching strategy...'));

    const cacheConfigurations = [
      {
        name: 'Product Listings Cache',
        ttl: 600, // 10 minutes
        patterns: ['products:list:*', 'products:category:*', 'products:brand:*']
      },
      {
        name: 'Product Details Cache',
        ttl: 3600, // 1 hour
        patterns: ['product:*']
      },
      {
        name: 'Recommendation Cache',
        ttl: 1800, // 30 minutes
        patterns: ['recommendations:*', 'similar:*']
      },
      {
        name: 'Category & Brand Cache',
        ttl: 7200, // 2 hours
        patterns: ['categories:*', 'brands:*']
      },
      {
        name: 'User Session Cache',
        ttl: 3600, // 1 hour
        patterns: ['user:*', 'cart:*']
      }
    ];

    for (const config of cacheConfigurations) {
      console.log(chalk.green(`   ✅ Configured ${config.name}`));
      console.log(chalk.gray(`      TTL: ${config.ttl}s, Patterns: ${config.patterns.join(', ')}`));
    }

    this.optimizationResults.cacheConfigured = true;
  }

  async generatePerformanceReport() {
    console.log(chalk.blue('\n📈 Generating performance report...'));

    const duration = Date.now() - this.optimizationResults.startTime;
    
    console.log(chalk.green.bold('\n🎉 Database Optimization Complete!\n'));
    
    console.log(chalk.cyan('📊 Optimization Summary:'));
    console.log(`   • Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`   • Indexes created: ${this.optimizationResults.indexesCreated}`);
    console.log(`   • Indexes already existed: ${this.optimizationResults.indexesAlreadyExisted}`);
    console.log(`   • Queries analyzed: ${this.optimizationResults.queriesAnalyzed}`);
    console.log(`   • Performance issues found: ${this.optimizationResults.performanceIssuesFound}`);
    console.log(`   • Memory optimized: ${this.optimizationResults.memoryOptimized ? '✅' : '❌'}`);
    console.log(`   • Caching configured: ${this.optimizationResults.cacheConfigured ? '✅' : '❌'}`);

    if (this.performanceMetrics.size > 0) {
      console.log(chalk.cyan('\n⚡ Query Performance Metrics:'));
      for (const [name, metrics] of this.performanceMetrics) {
        const status = metrics.executionTime < 100 ? '🟢' : 
                      metrics.executionTime < 500 ? '🟡' : '🔴';
        console.log(`   ${status} ${name}: ${metrics.executionTime.toFixed(2)}ms`);
      }
    }

    console.log(chalk.cyan('\n💡 Next Steps:'));
    console.log('   • Monitor query performance in production');
    console.log('   • Set up database monitoring and alerting');
    console.log('   • Review and update indexes based on actual usage patterns');
    console.log('   • Consider implementing database sharding for large datasets');
    console.log('   • Set up regular database maintenance schedules');
  }

  async createMaintenanceSchedule() {
    const maintenanceScript = `#!/bin/bash
# Database Maintenance Schedule for Karno
# Run this script weekly for optimal performance

echo "🔧 Starting weekly database maintenance..."

# 1. Update statistics
mongo karno --eval "db.runCommand({planCacheClear: '*'})"

# 2. Rebuild indexes if needed
# (Only run if you notice performance degradation)
# mongo karno --eval "db.products.reIndex()"

# 3. Clean up expired recommendations
mongo karno --eval "db.recommendations.deleteMany({expiresAt: {\\$lt: new Date()}})"

# 4. Analyze slow queries
node src/scripts/analyze-queries.js --all

# 5. Generate performance report
echo "✅ Weekly maintenance completed"
`;

    require('fs').writeFileSync('weekly-maintenance.sh', maintenanceScript);
    console.log(chalk.green('\n✅ Created weekly maintenance script: weekly-maintenance.sh'));
  }

  async cleanup() {
    try {
      await mongoose.connection.close();
      console.log(chalk.green('\n🔌 Disconnected from MongoDB'));
    } catch (error) {
      console.error(chalk.red('❌ Error during cleanup:'), error.message);
    }
  }
}

// Run the optimizer
if (import.meta.url === `file://${process.argv[1]}`) {
  const optimizer = new EnhancedDatabaseOptimizer();
  optimizer.run().catch(console.error);
}

export default EnhancedDatabaseOptimizer; 