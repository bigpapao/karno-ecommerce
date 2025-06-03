/**
 * Performance Monitoring Routes
 *
 * Admin routes for monitoring database and API performance.
 */

import express from 'express';
import mongoose from 'mongoose';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import {
  getQueryPerformanceSummary,
  clearQueryPerformanceData,
  getSlowQueries,
  initQueryMonitoring,
  disableQueryMonitoring,
  queryMonitorMiddleware,
} from '../../middleware/query-monitor.middleware.js';
import { logger } from '../../utils/logger.js';
import { AppError } from '../../middleware/error-handler.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = express.Router();

// Apply middleware
router.use(authenticate);
router.use(authorize('admin'));
router.use(queryMonitorMiddleware);

/**
 * @route   GET /api/admin/performance/query-stats
 * @desc    Get performance summary for all collections
 * @access  Private/Admin
 */
router.get('/query-stats', asyncHandler(async (req, res, next) => {
  const summary = getQueryPerformanceSummary();

  res.status(200).json({
    status: 'success',
    data: summary,
  });
}));

/**
 * @route   GET /api/admin/performance/slow-queries/:collection
 * @desc    Get slow queries for a specific collection
 * @access  Private/Admin
 */
router.get('/slow-queries/:collection', asyncHandler(async (req, res, next) => {
  const { collection } = req.params;
  const { limit = 10 } = req.query;

  // Validate if collection exists
  if (!mongoose.models[collection]) {
    return next(new AppError(`Collection '${collection}' not found`, 404));
  }

  const slowQueries = getSlowQueries(collection, parseInt(limit, 10));

  res.status(200).json({
    status: 'success',
    results: slowQueries.length,
    data: slowQueries,
  });
}));

/**
 * @route   POST /api/admin/performance/monitor/start
 * @desc    Start query monitoring
 * @access  Private/Admin
 */
router.post('/monitor/start', asyncHandler(async (req, res, next) => {
  const result = initQueryMonitoring(mongoose);

  logger.info('Query monitoring started by admin');

  res.status(200).json({
    status: 'success',
    message: 'Query monitoring started',
    data: result,
  });
}));

/**
 * @route   POST /api/admin/performance/monitor/stop
 * @desc    Stop query monitoring
 * @access  Private/Admin
 */
router.post('/monitor/stop', asyncHandler(async (req, res, next) => {
  const result = disableQueryMonitoring(mongoose);

  logger.info('Query monitoring stopped by admin');

  res.status(200).json({
    status: 'success',
    message: 'Query monitoring stopped',
    data: result,
  });
}));

/**
 * @route   DELETE /api/admin/performance/query-data/:collection?
 * @desc    Clear query performance data for all or specific collection
 * @access  Private/Admin
 */
router.delete('/query-data/:collection?', asyncHandler(async (req, res, next) => {
  const { collection } = req.params;

  // If collection provided, validate it exists
  if (collection && !mongoose.models[collection]) {
    return next(new AppError(`Collection '${collection}' not found`, 404));
  }

  const result = clearQueryPerformanceData(collection);

  logger.info(`Query performance data cleared${collection ? ` for ${collection}` : ''} by admin`);

  res.status(200).json({
    status: 'success',
    message: `Query performance data cleared${collection ? ` for ${collection}` : ''}`,
    data: result,
  });
}));

/**
 * @route   GET /api/admin/performance/db-stats
 * @desc    Get database statistics
 * @access  Private/Admin
 */
router.get('/db-stats', asyncHandler(async (req, res, next) => {
  const stats = await mongoose.connection.db.stats();

  res.status(200).json({
    status: 'success',
    data: {
      dbName: stats.db,
      collections: stats.collections,
      views: stats.views,
      objects: stats.objects,
      dataSize: {
        bytes: stats.dataSize,
        megabytes: (stats.dataSize / (1024 * 1024)).toFixed(2),
      },
      storageSize: {
        bytes: stats.storageSize,
        megabytes: (stats.storageSize / (1024 * 1024)).toFixed(2),
      },
      indexes: stats.indexes,
      indexSize: {
        bytes: stats.indexSize,
        megabytes: (stats.indexSize / (1024 * 1024)).toFixed(2),
      },
      avgObjSize: stats.avgObjSize,
    },
  });
}));

/**
 * @route   GET /api/admin/performance/collection-stats/:collection
 * @desc    Get statistics for a specific collection
 * @access  Private/Admin
 */
router.get('/collection-stats/:collection', asyncHandler(async (req, res, next) => {
  const { collection } = req.params;

  // Validate if collection exists
  if (!mongoose.models[collection]) {
    return next(new AppError(`Collection '${collection}' not found`, 404));
  }

  const stats = await mongoose.connection.db.collection(collection).stats();
  const indexes = await mongoose.models[collection].collection.indexes();

  res.status(200).json({
    status: 'success',
    data: {
      name: stats.ns.split('.').pop(),
      count: stats.count,
      size: {
        bytes: stats.size,
        megabytes: (stats.size / (1024 * 1024)).toFixed(2),
      },
      avgObjSize: {
        bytes: stats.avgObjSize,
        kilobytes: (stats.avgObjSize / 1024).toFixed(2),
      },
      storageSize: {
        bytes: stats.storageSize,
        megabytes: (stats.storageSize / (1024 * 1024)).toFixed(2),
      },
      indexes: indexes.map((index) => ({
        name: index.name,
        keys: index.key,
        unique: !!index.unique,
      })),
      totalIndexSize: {
        bytes: stats.totalIndexSize,
        megabytes: (stats.totalIndexSize / (1024 * 1024)).toFixed(2),
      },
    },
  });
}));

export default router;
