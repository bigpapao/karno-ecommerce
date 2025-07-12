/**
 * Performance Monitoring Routes
 *
 * Admin routes for monitoring database and API performance.
 */

import express from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { performanceMetricsEndpoint, queryTracker } from '../../middleware/query-monitor.middleware.js';
import { dbCache, performanceMonitor } from '../../config/database-optimization.js';
import { logger } from '../../utils/logger.js';
import redis from '../../utils/redis.js';
import mongoose from 'mongoose';

const router = express.Router();

// Apply authentication and admin middleware
router.use(authenticate);
router.use(authorize('admin'));

/**
 * Get comprehensive database performance metrics
 */
router.get('/metrics', performanceMetricsEndpoint);

/**
 * Get database connection status and health
 */
router.get('/health', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    // Test database responsiveness
    const start = Date.now();
    await mongoose.connection.db.admin().ping();
    const pingTime = Date.now() - start;

    // Get connection pool stats
    const stats = mongoose.connection.db.stats ? await mongoose.connection.db.stats() : null;

    // Get performance summary
    const performanceSummary = performanceMonitor.getSummary();

    res.json({
      status: 'success',
      data: {
        database: {
          state: dbStates[dbState] || 'unknown',
          ping: `${pingTime}ms`,
          name: mongoose.connection.name,
          host: mongoose.connection.host,
          port: mongoose.connection.port,
        },
        stats,
        performance: performanceSummary,
        uptime: process.uptime(),
      },
    });
  } catch (error) {
    logger.error('Database health check failed', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Database health check failed',
      error: error.message,
    });
  }
});

/**
 * Get cache performance metrics
 */
router.get('/cache', async (req, res) => {
  try {
    // Get Redis info
    const redisInfo = await redis.info();
    const redisMemory = await redis.info('memory');

    // Get cache hit/miss ratios
    const cacheKeys = await redis.keys('db_cache:*');
    const monitorKeys = await redis.keys('monitor:*');

    res.json({
      status: 'success',
      data: {
        redis: {
          status: 'connected',
          version: redisInfo.split('\n').find(line => line.startsWith('redis_version'))?.split(':')[1] || 'unknown',
          memory: redisMemory.split('\n').find(line => line.startsWith('used_memory_human'))?.split(':')[1] || 'unknown',
        },
        cache: {
          totalKeys: cacheKeys.length,
          monitoringKeys: monitorKeys.length,
        },
      },
    });
  } catch (error) {
    logger.error('Cache metrics failed', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to get cache metrics',
      error: error.message,
    });
  }
});

/**
 * Get collection statistics
 */
router.get('/collections', async (req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionStats = [];

    for (const collection of collections) {
      try {
        const stats = await mongoose.connection.db.collection(collection.name).stats();
        const indexes = await mongoose.connection.db.collection(collection.name).indexes();
        
        collectionStats.push({
          name: collection.name,
          documents: stats.count || 0,
          size: stats.size || 0,
          avgObjSize: stats.avgObjSize || 0,
          indexes: indexes.length,
          indexSize: stats.totalIndexSize || 0,
        });
      } catch (error) {
        // Skip collections that don't support stats
        collectionStats.push({
          name: collection.name,
          error: 'Stats not available',
        });
      }
    }

    res.json({
      status: 'success',
      data: {
        collections: collectionStats,
        total: collections.length,
      },
    });
  } catch (error) {
    logger.error('Collection stats failed', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to get collection statistics',
      error: error.message,
    });
  }
});

/**
 * Get slow queries from the last 24 hours
 */
router.get('/slow-queries', async (req, res) => {
  try {
    const slowQueries = queryTracker.getSlowQueries(50);
    const recentQueries = slowQueries.filter(
      query => query.timestamp && (Date.now() - query.timestamp.getTime()) < 24 * 60 * 60 * 1000
    );

    // Group by collection and operation
    const grouped = recentQueries.reduce((acc, query) => {
      const key = `${query.collection}:${query.operation}`;
      if (!acc[key]) {
        acc[key] = {
          collection: query.collection,
          operation: query.operation,
          count: 0,
          avgTime: 0,
          maxTime: 0,
          examples: [],
        };
      }
      
      acc[key].count++;
      acc[key].maxTime = Math.max(acc[key].maxTime, query.executionTime);
      acc[key].avgTime = (acc[key].avgTime + query.executionTime) / acc[key].count;
      
      if (acc[key].examples.length < 3) {
        acc[key].examples.push({
          executionTime: query.executionTime,
          memoryUsed: query.memoryUsed,
          timestamp: query.timestamp,
          query: query.query,
        });
      }
      
      return acc;
    }, {});

    res.json({
      status: 'success',
      data: {
        slowQueries: Object.values(grouped).sort((a, b) => b.maxTime - a.maxTime),
        total: recentQueries.length,
        period: '24 hours',
      },
    });
  } catch (error) {
    logger.error('Slow queries retrieval failed', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to get slow queries',
      error: error.message,
    });
  }
});

/**
 * Clear performance metrics and cache
 */
router.delete('/cache', async (req, res) => {
  try {
    const { type } = req.query;
    
    let cleared = 0;
    
    if (type === 'db' || !type) {
      cleared += await dbCache.clear();
    }
    
    if (type === 'monitor' || !type) {
      const monitorKeys = await redis.keys('monitor:*');
      if (monitorKeys.length > 0) {
        await redis.del(...monitorKeys);
        cleared += monitorKeys.length;
      }
    }
    
    if (type === 'metrics' || !type) {
      const metricKeys = await redis.keys('query_metrics:*');
      if (metricKeys.length > 0) {
        await redis.del(...metricKeys);
        cleared += metricKeys.length;
      }
    }

    logger.info('Performance cache cleared by admin', { 
      admin: req.user.id, 
      type: type || 'all',
      keysCleared: cleared 
    });

    res.json({
      status: 'success',
      message: `Cleared ${cleared} cache entries`,
      data: { keysCleared: cleared, type: type || 'all' },
    });
  } catch (error) {
    logger.error('Cache clear failed', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to clear cache',
      error: error.message,
    });
  }
});

/**
 * Run database optimization
 */
router.post('/optimize', async (req, res) => {
  try {
    const { type = 'indexes' } = req.body;
    const results = [];

    if (type === 'indexes' || type === 'all') {
      // Run index optimization
      const { spawn } = require('child_process');
      const optimization = spawn('node', ['src/scripts/enhanced-db-optimizer.js'], {
        cwd: process.cwd(),
      });

      optimization.stdout.on('data', (data) => {
        results.push(data.toString());
      });

      optimization.on('close', (code) => {
        logger.info('Database optimization completed', { 
          admin: req.user.id, 
          exitCode: code,
          type 
        });
      });

      res.json({
        status: 'success',
        message: 'Database optimization started',
        data: { type, status: 'running' },
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Invalid optimization type',
      });
    }
  } catch (error) {
    logger.error('Database optimization failed', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to start database optimization',
      error: error.message,
    });
  }
});

/**
 * Get optimization recommendations
 */
router.get('/recommendations', async (req, res) => {
  try {
    const metrics = await queryTracker.getAggregatedMetrics();
    const suggestions = queryTracker.generateOptimizationSuggestions(metrics);
    
    // Add general recommendations based on system state
    const systemRecommendations = [];
    
    const memUsage = process.memoryUsage();
    if (memUsage.heapUsed / memUsage.heapTotal > 0.8) {
      systemRecommendations.push({
        type: 'memory',
        priority: 'high',
        suggestion: 'High memory usage detected. Consider implementing pagination for large datasets.',
      });
    }

    const connectionState = mongoose.connection.readyState;
    if (connectionState !== 1) {
      systemRecommendations.push({
        type: 'connection',
        priority: 'critical',
        suggestion: 'Database connection is not stable. Check connection configuration.',
      });
    }

    res.json({
      status: 'success',
      data: {
        queryOptimizations: suggestions,
        systemRecommendations,
        total: suggestions.length + systemRecommendations.length,
      },
    });
  } catch (error) {
    logger.error('Recommendations retrieval failed', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to get optimization recommendations',
      error: error.message,
    });
  }
});

export default router;
