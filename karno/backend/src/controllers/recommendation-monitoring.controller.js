import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import recommendationMonitoring from '../utils/recommendation-monitoring.js';

/**
 * Get recommendation system metrics
 * Admin-only endpoint to view performance metrics
 */
export const getMetrics = asyncHandler(async (req, res) => {
  // Ensure user has admin permission
  if (!req.user?.role || req.user.role !== 'admin') {
    throw new ApiError(403, 'Admin permission required to access metrics');
  }

  const metrics = recommendationMonitoring.getMetrics();

  return res.status(200).json(
    new ApiResponse(200, metrics, 'Recommendation system metrics retrieved successfully'),
  );
});

/**
 * Get model freshness information
 * Shows last update time for recommendation models
 */
export const getModelFreshness = asyncHandler(async (req, res) => {
  // Ensure user has admin permission
  if (!req.user?.role || req.user.role !== 'admin') {
    throw new ApiError(403, 'Admin permission required to access model freshness data');
  }

  const metrics = recommendationMonitoring.getMetrics();
  const freshnessData = {
    modelFreshness: metrics.modelFreshness,
    modelAge: metrics.modelAge,
  };

  return res.status(200).json(
    new ApiResponse(200, freshnessData, 'Model freshness data retrieved successfully'),
  );
});

/**
 * Get API performance metrics
 * Shows call volumes, latency, and error rates
 */
export const getApiPerformance = asyncHandler(async (req, res) => {
  // Ensure user has admin permission
  if (!req.user?.role || req.user.role !== 'admin') {
    throw new ApiError(403, 'Admin permission required to access API performance data');
  }

  const metrics = recommendationMonitoring.getMetrics();

  const performanceData = {
    apiCalls: metrics.apiCalls,
    latency: metrics.latency,
    cacheHitRate: metrics.cacheHitRate,
    cacheHits: metrics.cacheHits,
    cacheMisses: metrics.cacheMisses,
  };

  return res.status(200).json(
    new ApiResponse(200, performanceData, 'API performance data retrieved successfully'),
  );
});

/**
 * Trigger data drift check
 * Forces an immediate check for recommendation model data drift
 */
export const triggerDataDriftCheck = asyncHandler(async (req, res) => {
  // Ensure user has admin permission
  if (!req.user?.role || req.user.role !== 'admin') {
    throw new ApiError(403, 'Admin permission required to trigger data drift check');
  }

  await recommendationMonitoring.checkForDataDrift();
  const driftStatus = recommendationMonitoring.metrics.dataDrift;

  return res.status(200).json(
    new ApiResponse(200, driftStatus, 'Data drift check triggered successfully'),
  );
});

/**
 * Update model freshness
 * Record a model update event
 */
export const updateModelFreshness = asyncHandler(async (req, res) => {
  // Ensure user has admin permission
  if (!req.user?.role || req.user.role !== 'admin') {
    throw new ApiError(403, 'Admin permission required to update model freshness');
  }

  const { modelType } = req.body;

  if (!modelType || !['collaborative', 'contentBased', 'hybrid'].includes(modelType)) {
    throw new ApiError(400, 'Valid model type required (collaborative, contentBased, or hybrid)');
  }

  recommendationMonitoring.updateModelFreshness(modelType);

  return res.status(200).json(
    new ApiResponse(200, { modelType, updatedAt: new Date() }, 'Model freshness updated successfully'),
  );
});

export default {
  getMetrics,
  getModelFreshness,
  getApiPerformance,
  triggerDataDriftCheck,
  updateModelFreshness,
};
