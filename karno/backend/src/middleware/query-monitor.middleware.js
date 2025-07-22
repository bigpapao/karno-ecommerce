/**
 * Query Performance Monitoring Middleware
 * 
 * This middleware tracks MongoDB query performance in real-time,
 * identifies slow queries, and provides optimization recommendations.
 */

import { logger } from '../utils/logger.js';
import redis from '../utils/redis.js';

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  SLOW_QUERY_MS: 500,
  VERY_SLOW_QUERY_MS: 2000,
  HIGH_MEMORY_USAGE_MB: 100,
  MAX_DOCS_EXAMINED_RATIO: 5,
};

// Query performance tracking
class QueryPerformanceTracker {
  constructor() {
    this.metrics = new Map();
    this.slowQueries = [];
    this.isMonitoring = process.env.NODE_ENV !== 'production' || process.env.ENABLE_QUERY_MONITORING === 'true';
  }

  startTracking(queryInfo) {
    if (!this.isMonitoring) return null;

    const trackingId = Date.now() + Math.random().toString(36).substr(2, 9);
    const startTime = Date.now();
    const memUsage = process.memoryUsage();

    this.metrics.set(trackingId, {
      ...queryInfo,
      startTime,
      memoryBefore: memUsage.heapUsed,
    });

    return trackingId;
  }

  endTracking(trackingId, queryResult = null) {
    if (!this.isMonitoring || !trackingId) return;

    const metric = this.metrics.get(trackingId);
    if (!metric) return;

    const endTime = Date.now();
    const memUsage = process.memoryUsage();
    const executionTime = endTime - metric.startTime;
    const memoryUsed = (memUsage.heapUsed - metric.memoryBefore) / 1024 / 1024; // MB

    const finalMetric = {
      ...metric,
      endTime,
      executionTime,
      memoryUsed,
      queryResult: queryResult ? this.summarizeResult(queryResult) : null,
    };

    // Log slow queries
    if (executionTime > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS) {
      this.logSlowQuery(finalMetric);
    }

    // Store metrics for analysis
    this.storeMetrics(finalMetric);
    this.metrics.delete(trackingId);
  }

  summarizeResult(result) {
    if (Array.isArray(result)) {
      return { type: 'array', length: result.length };
    }
    if (result && typeof result === 'object') {
      if (result._id) {
        return { type: 'document', hasId: true };
      }
      return { type: 'object', keys: Object.keys(result).length };
    }
    return { type: typeof result };
  }

  logSlowQuery(metric) {
    const severity = metric.executionTime > PERFORMANCE_THRESHOLDS.VERY_SLOW_QUERY_MS ? 'error' : 'warn';
    
    logger[severity]('Slow query detected', {
      collection: metric.collection,
      operation: metric.operation,
      executionTime: metric.executionTime,
      memoryUsed: metric.memoryUsed,
      query: metric.query,
      filter: metric.filter,
      projection: metric.projection,
      sort: metric.sort,
      limit: metric.limit,
      queryResult: metric.queryResult,
    });

    // Store slow query for analysis
    this.slowQueries.push({
      ...metric,
      timestamp: new Date(),
    });

    // Keep only recent slow queries (last 100)
    if (this.slowQueries.length > 100) {
      this.slowQueries = this.slowQueries.slice(-100);
    }

    // Send to Redis for real-time monitoring (optional)
    this.sendToRedis('slow_query', metric);
  }

  async storeMetrics(metric) {
    try {
      // Store aggregated metrics
      const key = `${metric.collection}:${metric.operation}`;
      const existing = await redis.hgetall(`query_metrics:${key}`) || {};
      
      const count = parseInt(existing.count || '0') + 1;
      const totalTime = parseFloat(existing.totalTime || '0') + metric.executionTime;
      const avgTime = totalTime / count;
      const maxTime = Math.max(parseFloat(existing.maxTime || '0'), metric.executionTime);

      await redis.hmset(`query_metrics:${key}`, {
        count: count.toString(),
        totalTime: totalTime.toString(),
        avgTime: avgTime.toString(),
        maxTime: maxTime.toString(),
        lastExecution: metric.endTime.toString(),
      });

      // Set expiration for metrics (7 days)
      await redis.expire(`query_metrics:${key}`, 7 * 24 * 60 * 60);
    } catch (error) {
      // Don't fail the request if metrics storage fails
      logger.warn('Failed to store query metrics', { error: error.message });
    }
  }

  async sendToRedis(type, data) {
    try {
      await redis.lpush(`monitor:${type}`, JSON.stringify({
        ...data,
        timestamp: new Date(),
      }));
      
      // Keep only recent entries
      await redis.ltrim(`monitor:${type}`, 0, 99);
    } catch (error) {
      // Don't fail the request if Redis fails
      logger.warn('Failed to send monitoring data to Redis', { error: error.message });
    }
  }

  getSlowQueries(limit = 10) {
    return this.slowQueries
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, limit);
  }

  async getAggregatedMetrics() {
    try {
      const keys = await redis.keys('query_metrics:*');
      const metrics = {};

      for (const key of keys) {
        const data = await redis.hgetall(key);
        const operation = key.replace('query_metrics:', '');
        metrics[operation] = {
          count: parseInt(data.count || '0'),
          avgTime: parseFloat(data.avgTime || '0'),
          maxTime: parseFloat(data.maxTime || '0'),
          lastExecution: new Date(parseInt(data.lastExecution || '0')),
        };
      }

      return metrics;
    } catch (error) {
      logger.warn('Failed to get aggregated metrics', { error: error.message });
      return {};
    }
  }

  generateOptimizationSuggestions(metrics) {
    const suggestions = [];

    Object.entries(metrics).forEach(([operation, data]) => {
      if (data.avgTime > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS) {
        suggestions.push({
          type: 'slow_average',
          operation,
          avgTime: data.avgTime,
          suggestion: `Consider adding indexes for ${operation} operations (avg: ${data.avgTime.toFixed(2)}ms)`,
        });
      }

      if (data.maxTime > PERFORMANCE_THRESHOLDS.VERY_SLOW_QUERY_MS) {
        suggestions.push({
          type: 'very_slow_max',
          operation,
          maxTime: data.maxTime,
          suggestion: `Investigate worst-case performance for ${operation} operations (max: ${data.maxTime.toFixed(2)}ms)`,
        });
      }

      if (data.count > 1000) {
        suggestions.push({
          type: 'high_frequency',
          operation,
          count: data.count,
          suggestion: `High-frequency operation ${operation} (${data.count} calls) - consider caching`,
        });
      }
    });

    return suggestions;
  }
}

// Create global tracker instance
const queryTracker = new QueryPerformanceTracker();

/**
 * Mongoose plugin to monitor query performance
 */
export const mongooseQueryMonitor = function(schema) {
  // Pre-hooks for various operations
  const operations = [
    'find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete',
    'updateOne', 'updateMany', 'deleteOne', 'deleteMany',
    'countDocuments', 'aggregate', 'distinct'
  ];

  operations.forEach(operation => {
    schema.pre(operation, function() {
      const queryInfo = {
        collection: this.model?.collection?.collectionName || 'unknown',
        operation,
        query: this.getQuery ? this.getQuery() : this.getFilter(),
        filter: this.getFilter ? this.getFilter() : null,
        projection: this.getOptions ? this.getOptions().projection : null,
        sort: this.getOptions ? this.getOptions().sort : null,
        limit: this.getOptions ? this.getOptions().limit : null,
      };

      this._trackingId = queryTracker.startTracking(queryInfo);
    });

    schema.post(operation, function(result) {
      queryTracker.endTracking(this._trackingId, result);
    });
  });
};

/**
 * Express middleware for API endpoint monitoring
 */
export const apiQueryMonitor = (req, res, next) => {
  if (!queryTracker.isMonitoring) {
    return next();
  }

  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function(data) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Log slow API responses
    if (responseTime > PERFORMANCE_THRESHOLDS.SLOW_QUERY_MS) {
      logger.warn('Slow API response', {
        method: req.method,
        url: req.originalUrl,
        responseTime,
        query: req.query,
        params: req.params,
        userAgent: req.get('User-Agent'),
      });
    }

    // Store API metrics
    queryTracker.sendToRedis('api_response', {
      method: req.method,
      url: req.originalUrl,
      responseTime,
      statusCode: res.statusCode,
    });

    originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware to expose performance metrics endpoint
 */
export const performanceMetricsEndpoint = async (req, res) => {
  try {
    const metrics = await queryTracker.getAggregatedMetrics();
    const slowQueries = queryTracker.getSlowQueries(20);
    const suggestions = queryTracker.generateOptimizationSuggestions(metrics);

    res.json({
      status: 'success',
      data: {
        queryMetrics: metrics,
        slowQueries,
        optimizationSuggestions: suggestions,
        monitoring: queryTracker.isMonitoring,
        thresholds: PERFORMANCE_THRESHOLDS,
      },
    });
  } catch (error) {
    logger.error('Failed to get performance metrics', { error: error.message });
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve performance metrics',
    });
  }
};

/**
 * Function to apply monitoring to all models
 */
export const applyQueryMonitoring = (models) => {
  Object.values(models).forEach(model => {
    if (model.schema) {
      model.schema.plugin(mongooseQueryMonitor);
    }
  });
};

export { queryTracker };
export default {
  mongooseQueryMonitor,
  apiQueryMonitor,
  performanceMetricsEndpoint,
  applyQueryMonitoring,
  queryTracker,
};
