/**
 * Database Optimization Configuration
 * 
 * This module provides optimized MongoDB configuration for the Karno application,
 * including connection pooling, query optimization, and performance monitoring.
 */

import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';
import redis from '../utils/redis.js';

// Optimized connection configuration
export const DATABASE_CONFIG = {
  // Connection Pool Settings
  connection: {
    maxPoolSize: 10,         // Maximum number of connections in the pool
    minPoolSize: 2,          // Minimum number of connections in the pool
    serverSelectionTimeoutMS: 5000,  // How long to try selecting a server
    socketTimeoutMS: 45000,  // How long a send or receive on a socket can take
    heartbeatFrequencyMS: 10000,     // How often to check server status
    maxIdleTimeMS: 300000,   // Close connections after 5 minutes of inactivity
    retryWrites: true,       // Enable retryable writes
    retryReads: true,        // Enable retryable reads
    directConnection: false, // Don't bypass server discovery
  },

  // Query Optimization Settings
  query: {
    bufferCommands: false,   // Disable mongoose buffering
    maxTimeMS: 10000,        // Set maximum execution time for queries
    lean: true,              // Use lean queries by default for better performance
    populate: {
      maxDepth: 3,           // Limit populate depth to prevent deep nesting
      select: '-__v -updatedAt', // Exclude version and updatedAt fields by default
    },
  },

  // Index Management
  indexes: {
    autoIndex: process.env.NODE_ENV !== 'production', // Only auto-create indexes in dev
    background: true,        // Build indexes in background
    sparse: true,           // Create sparse indexes where appropriate
  },

  // Performance Monitoring
  monitoring: {
    enabled: process.env.ENABLE_DB_MONITORING !== 'false',
    slowQueryThreshold: 500, // Log queries slower than 500ms
    metricsRetention: 7,     // Keep metrics for 7 days
  },

  // Caching Strategy
  cache: {
    defaultTTL: 300,         // 5 minutes default cache TTL
    categories: 3600,        // 1 hour for categories
    brands: 3600,           // 1 hour for brands
    products: 600,          // 10 minutes for products
    recommendations: 1800,   // 30 minutes for recommendations
    userSessions: 1800,     // 30 minutes for user sessions
  },
};

/**
 * Apply optimization settings to Mongoose
 */
export function applyDatabaseOptimizations() {
  logger.info('Applying database optimizations...');

  // Global query optimizations
  mongoose.set('bufferCommands', DATABASE_CONFIG.query.bufferCommands);
  mongoose.set('autoIndex', DATABASE_CONFIG.indexes.autoIndex);
  mongoose.set('strictQuery', true);

  // Query middleware for automatic optimizations
  mongoose.plugin(function(schema) {
    // Apply lean queries by default for find operations
    schema.pre(['find', 'findOne'], function() {
      if (!this.getOptions().lean && !this.getOptions().populate) {
        this.lean();
      }
    });

    // Automatic field selection optimization
    schema.pre(['find', 'findOne'], function() {
      if (!this.getOptions().select) {
        this.select('-__v'); // Exclude version field by default
      }
    });

    // Add query timeout
    schema.pre(['find', 'findOne', 'countDocuments', 'aggregate'], function() {
      if (!this.getOptions().maxTimeMS) {
        this.maxTimeMS(DATABASE_CONFIG.query.maxTimeMS);
      }
    });
  });

  logger.info('Database optimizations applied successfully');
}

/**
 * Enhanced connection function with optimization
 */
export async function connectWithOptimization(uri, options = {}) {
  const optimizedOptions = {
    ...DATABASE_CONFIG.connection,
    ...options,
  };

  try {
    await mongoose.connect(uri, optimizedOptions);
    
    // Apply global optimizations
    applyDatabaseOptimizations();
    
    // Setup connection event listeners
    setupConnectionEventListeners();
    
    logger.info('Connected to MongoDB with optimizations', {
      poolSize: optimizedOptions.maxPoolSize,
      monitoring: DATABASE_CONFIG.monitoring.enabled,
    });

    return mongoose.connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error: error.message });
    throw error;
  }
}

/**
 * Setup connection event listeners for monitoring
 */
function setupConnectionEventListeners() {
  const connection = mongoose.connection;

  connection.on('connected', () => {
    logger.info('MongoDB connected');
  });

  connection.on('error', (error) => {
    logger.error('MongoDB connection error', { error: error.message });
  });

  connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  // Monitor connection pool
  connection.on('fullsetup', () => {
    logger.info('MongoDB connection pool established');
  });

  // Log slow operations if monitoring is enabled
  if (DATABASE_CONFIG.monitoring.enabled) {
    try {
      // Use mongoose connection events instead of db events
      mongoose.connection.on('commandStarted', (event) => {
        redis.set(`cmd:${event.requestId}`, Date.now(), 'EX', 60).catch(() => {});
      });

      mongoose.connection.on('commandSucceeded', async (event) => {
        try {
          const startTime = await redis.get(`cmd:${event.requestId}`);
          if (startTime) {
            const duration = Date.now() - parseInt(startTime);
            if (duration > DATABASE_CONFIG.monitoring.slowQueryThreshold) {
              logger.warn('Slow MongoDB operation', {
                command: event.commandName,
                duration,
                requestId: event.requestId,
              });
            }
            await redis.del(`cmd:${event.requestId}`);
          }
        } catch (error) {
          // Silently ignore Redis errors for monitoring
        }
      });
    } catch (error) {
      logger.warn('Failed to setup MongoDB command monitoring', { error: error.message });
    }
  }
}

/**
 * Advanced caching utilities
 */
export class DatabaseCache {
  constructor() {
    this.prefix = 'db_cache:';
  }

  /**
   * Generate cache key for a query
   */
  generateKey(collection, query, options = {}) {
    const keyData = {
      collection,
      query: typeof query === 'object' ? JSON.stringify(query) : query,
      options: Object.keys(options).sort().reduce((obj, key) => {
        obj[key] = options[key];
        return obj;
      }, {}),
    };
    
    return `${this.prefix}${Buffer.from(JSON.stringify(keyData)).toString('base64')}`;
  }

  /**
   * Cache query result
   */
  async set(key, data, ttl = DATABASE_CONFIG.cache.defaultTTL) {
    try {
      await redis.set(key, JSON.stringify(data), 'EX', ttl);
      return true;
    } catch (error) {
      logger.warn('Cache set failed', { key, error: error.message });
      return false;
    }
  }

  /**
   * Get cached query result
   */
  async get(key) {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.warn('Cache get failed', { key, error: error.message });
      return null;
    }
  }

  /**
   * Invalidate cache for a collection
   */
  async invalidateCollection(collection) {
    try {
      const pattern = `${this.prefix}*${collection}*`;
      const keys = await redis.keys(pattern);
      
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.debug('Cache invalidated', { collection, keysDeleted: keys.length });
      }
      
      return keys.length;
    } catch (error) {
      logger.warn('Cache invalidation failed', { collection, error: error.message });
      return 0;
    }
  }

  /**
   * Clear all cache
   */
  async clear() {
    try {
      const pattern = `${this.prefix}*`;
      const keys = await redis.keys(pattern);
      
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      
      return keys.length;
    } catch (error) {
      logger.warn('Cache clear failed', { error: error.message });
      return 0;
    }
  }
}

/**
 * Query optimization utilities
 */
export class QueryOptimizer {
  /**
   * Optimize aggregation pipeline
   */
  static optimizePipeline(pipeline) {
    const optimized = [...pipeline];

    // Move $match stages to the beginning
    const matchStages = optimized.filter(stage => stage.$match);
    const otherStages = optimized.filter(stage => !stage.$match);
    
    // Add $limit early if not present and dealing with large datasets
    const hasLimit = otherStages.some(stage => stage.$limit);
    if (!hasLimit) {
      otherStages.push({ $limit: 1000 }); // Default safety limit
    }

    return [...matchStages, ...otherStages];
  }

  /**
   * Optimize find query
   */
  static optimizeFind(query, options = {}) {
    const optimized = { ...options };

    // Add default lean option
    if (!optimized.lean && !optimized.populate) {
      optimized.lean = true;
    }

    // Add field selection if not present
    if (!optimized.select) {
      optimized.select = '-__v -updatedAt';
    }

    // Add reasonable limit if not present
    if (!optimized.limit && !optimized.findOne) {
      optimized.limit = 100; // Default safety limit
    }

    return optimized;
  }

  /**
   * Suggest indexes for a query
   */
  static suggestIndexes(collection, query, sort = null) {
    const suggestions = [];
    
    // Suggest compound index for query fields
    const queryFields = Object.keys(query);
    if (queryFields.length > 1) {
      const compoundIndex = queryFields.reduce((index, field) => {
        index[field] = 1;
        return index;
      }, {});
      
      suggestions.push({
        type: 'compound',
        index: compoundIndex,
        reason: 'Multiple query fields benefit from compound index',
      });
    }

    // Suggest sort index
    if (sort) {
      const sortFields = Object.keys(sort);
      const sortIndex = { ...query };
      sortFields.forEach(field => {
        sortIndex[field] = sort[field];
      });
      
      suggestions.push({
        type: 'sort',
        index: sortIndex,
        reason: 'Query with sort needs compound index including sort fields',
      });
    }

    return suggestions;
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }

  /**
   * Start tracking an operation
   */
  startTracking(operation, metadata = {}) {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.metrics.set(id, {
      operation,
      metadata,
      startTime: Date.now(),
      memoryStart: process.memoryUsage().heapUsed,
    });
    return id;
  }

  /**
   * End tracking and log results
   */
  endTracking(id) {
    const metric = this.metrics.get(id);
    if (!metric) return null;

    const endTime = Date.now();
    const memoryEnd = process.memoryUsage().heapUsed;
    
    const result = {
      ...metric,
      endTime,
      duration: endTime - metric.startTime,
      memoryUsed: (memoryEnd - metric.memoryStart) / 1024 / 1024, // MB
    };

    // Log slow operations
    if (result.duration > DATABASE_CONFIG.monitoring.slowQueryThreshold) {
      logger.warn('Slow database operation', result);
    }

    this.metrics.delete(id);
    return result;
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const activeOperations = this.metrics.size;
    const memoryUsage = process.memoryUsage();
    
    return {
      activeOperations,
      memoryUsage: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
      },
      connectionState: mongoose.connection.readyState,
    };
  }
}

// Create global instances
export const dbCache = new DatabaseCache();
export const queryOptimizer = new QueryOptimizer();
export const performanceMonitor = new PerformanceMonitor();

export default {
  DATABASE_CONFIG,
  applyDatabaseOptimizations,
  connectWithOptimization,
  DatabaseCache,
  QueryOptimizer,
  PerformanceMonitor,
  dbCache,
  queryOptimizer,
  performanceMonitor,
}; 