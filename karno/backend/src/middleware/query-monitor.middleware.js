/**
 * Query Monitoring Middleware
 *
 * This middleware enables monitoring of MongoDB queries and their performance
 * by instrumenting Mongoose models to track execution times.
 */

import { createInstrumentedModel, queryTimings } from '../utils/query-analyzer.js';
import { logger } from '../utils/logger.js';

// Store original models
const originalModels = {};

/**
 * Get query performance summary
 */
export const getQueryPerformanceSummary = () => queryTimings.getSummary();

/**
 * Clear query performance data
 * @param {string} [collectionName] - Optional collection name to clear specific collection data
 */
export const clearQueryPerformanceData = (collectionName) => {
  queryTimings.clearTimings(collectionName);
  return { message: 'Query performance data cleared' };
};

/**
 * Get slow queries for a specific collection
 * @param {string} collectionName - Collection name
 * @param {number} [limit=10] - Maximum number of queries to return
 */
export const getSlowQueries = (collectionName, limit = 10) => queryTimings.getSlowestQueries(collectionName, limit);

/**
 * Initialize query monitoring for Mongoose models
 * @param {Object} mongoose - Mongoose instance
 */
export const initQueryMonitoring = (mongoose) => {
  logger.info('Initializing query performance monitoring');

  // Store original models and create instrumented versions
  const { models } = mongoose;

  for (const [modelName, model] of Object.entries(models)) {
    originalModels[modelName] = model;

    // Replace with instrumented model
    mongoose.models[modelName] = createInstrumentedModel(model);

    logger.debug(`Instrumented model: ${modelName}`);
  }

  return {
    message: 'Query monitoring initialized',
    monitoredModels: Object.keys(originalModels),
  };
};

/**
 * Disable query monitoring and restore original models
 * @param {Object} mongoose - Mongoose instance
 */
export const disableQueryMonitoring = (mongoose) => {
  logger.info('Disabling query performance monitoring');

  // Restore original models
  for (const [modelName, model] of Object.entries(originalModels)) {
    mongoose.models[modelName] = model;
  }

  return { message: 'Query monitoring disabled' };
};

/**
 * Express middleware for query monitoring routes
 */
export const queryMonitorMiddleware = (req, res, next) => {
  // Add query monitoring utilities to the request
  req.queryMonitor = {
    getSummary: getQueryPerformanceSummary,
    clearData: clearQueryPerformanceData,
    getSlowQueries,
  };

  next();
};

export default {
  getQueryPerformanceSummary,
  clearQueryPerformanceData,
  getSlowQueries,
  initQueryMonitoring,
  disableQueryMonitoring,
  queryMonitorMiddleware,
};
