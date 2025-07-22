import express from 'express';
import {
  trackEvent,
  trackBatchEvents,
  getAnalyticsInsights,
  getTopPerforming,
  getTrendingItems,
  getAnalyticsOverview,
  getCategoriesAnalyticsSummary,
  getBrandsAnalyticsSummary,
  processAnalyticsEvents,
  getAnalyticsChartData,
  getRealtimeAnalytics,
  exportAnalyticsData
} from '../controllers/analytics.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { createRateLimiter } from '../middleware/rate-limit.middleware.js';
import { cacheMiddleware } from '../middleware/cache.middleware.js';

const router = express.Router();

// Public tracking endpoints (with rate limiting)
router.post('/track', 
  createRateLimiter({ windowMs: 15 * 60 * 1000, max: 1000 }), // 1000 events per 15 minutes
  trackEvent
);

router.post('/track-batch', 
  createRateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }), // 100 batch requests per 15 minutes
  trackBatchEvents
);

// Admin analytics endpoints
router.use(authenticate, authorize('admin'));

// Overview and summary endpoints
router.get('/overview', 
  cacheMiddleware(300), // 5 minutes cache
  getAnalyticsOverview
);

router.get('/categories/summary', 
  cacheMiddleware(600), // 10 minutes cache
  getCategoriesAnalyticsSummary
);

router.get('/brands/summary', 
  cacheMiddleware(600), // 10 minutes cache
  getBrandsAnalyticsSummary
);

// Real-time analytics
router.get('/realtime', 
  cacheMiddleware(30), // 30 seconds cache
  getRealtimeAnalytics
);

// Resource-specific analytics
router.get('/insights/:resourceType/:resourceId', 
  cacheMiddleware(900), // 15 minutes cache
  getAnalyticsInsights
);

router.get('/top/:resourceType', 
  cacheMiddleware(1800), // 30 minutes cache
  getTopPerforming
);

router.get('/trending/:resourceType', 
  cacheMiddleware(600), // 10 minutes cache
  getTrendingItems
);

// Chart data endpoints
router.get('/charts/:resourceType/:resourceId', 
  cacheMiddleware(900), // 15 minutes cache
  getAnalyticsChartData
);

// Export endpoints
router.get('/export/:resourceType', 
  exportAnalyticsData
);

// Admin utility endpoints
router.post('/process-events', 
  processAnalyticsEvents
);

export default router; 