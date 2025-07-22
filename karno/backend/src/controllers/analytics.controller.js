import analyticsService from '../services/analytics.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/api-response.js';
import { AppError } from '../middleware/error-handler.middleware.js';

// @desc    Track a single analytics event
// @route   POST /api/analytics/track
// @access  Public (but can be rate-limited)
export const trackEvent = asyncHandler(async (req, res) => {
  const { eventType, resourceType, resourceId, context, metadata } = req.body;
  
  // Basic validation
  if (!eventType || !resourceType || !resourceId) {
    throw new AppError('eventType, resourceType, and resourceId are required', 400);
  }
  
  // Enrich with request data
  const eventData = {
    eventType,
    resourceType,
    resourceId,
    userId: req.user?.id,
    sessionId: req.sessionID || req.headers['x-session-id'],
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    referrer: req.get('Referer'),
    context: {
      ...context,
      page: req.get('Referer') || context?.page,
      timestamp: new Date()
    },
    metadata: {
      ...metadata,
      source: context?.source || 'direct'
    }
  };
  
  const event = await analyticsService.trackEvent(eventData);
  
  res.status(201).json(
    new ApiResponse(201, event, 'Event tracked successfully')
  );
});

// @desc    Track multiple analytics events in batch
// @route   POST /api/analytics/track-batch
// @access  Public (but can be rate-limited)
export const trackBatchEvents = asyncHandler(async (req, res) => {
  const { events } = req.body;
  
  if (!Array.isArray(events) || events.length === 0) {
    throw new AppError('events array is required and must not be empty', 400);
  }
  
  if (events.length > 100) {
    throw new AppError('Maximum 100 events per batch', 400);
  }
  
  // Enrich all events with request data
  const enrichedEvents = events.map(event => ({
    ...event,
    userId: req.user?.id,
    sessionId: req.sessionID || req.headers['x-session-id'],
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
    referrer: req.get('Referer'),
    context: {
      ...event.context,
      timestamp: new Date()
    }
  }));
  
  const trackedEvents = await analyticsService.trackBatchEvents(enrichedEvents);
  
  res.status(201).json(
    new ApiResponse(201, { 
      count: trackedEvents.length,
      events: trackedEvents 
    }, 'Batch events tracked successfully')
  );
});

// @desc    Get analytics insights for a resource
// @route   GET /api/analytics/insights/:resourceType/:resourceId
// @access  Private/Admin
export const getAnalyticsInsights = asyncHandler(async (req, res) => {
  const { resourceType, resourceId } = req.params;
  const { 
    days = 30, 
    includeComparison = true, 
    includeTrends = true, 
    includeBreakdowns = true 
  } = req.query;
  
  // Validate resource type
  if (!['category', 'brand', 'product'].includes(resourceType)) {
    throw new AppError('Invalid resource type', 400);
  }
  
  const options = {
    days: parseInt(days),
    includeComparison: includeComparison === 'true',
    includeTrends: includeTrends === 'true',
    includeBreakdowns: includeBreakdowns === 'true'
  };
  
  const insights = await analyticsService.getAnalyticsInsights(
    resourceType, 
    resourceId, 
    options
  );
  
  res.json(
    new ApiResponse(200, insights, 'Analytics insights retrieved successfully')
  );
});

// @desc    Get top performing categories or brands
// @route   GET /api/analytics/top/:resourceType
// @access  Private/Admin
export const getTopPerforming = asyncHandler(async (req, res) => {
  const { resourceType } = req.params;
  const { period = 'daily', days = 30, limit = 10 } = req.query;
  
  if (!['category', 'brand', 'product'].includes(resourceType)) {
    throw new AppError('Invalid resource type', 400);
  }
  
  const options = {
    period,
    days: parseInt(days),
    limit: parseInt(limit)
  };
  
  const results = await analyticsService.getTopPerforming(resourceType, options);
  
  res.json(
    new ApiResponse(200, results, `Top performing ${resourceType}s retrieved successfully`)
  );
});

// @desc    Get trending categories or brands
// @route   GET /api/analytics/trending/:resourceType
// @access  Private/Admin
export const getTrendingItems = asyncHandler(async (req, res) => {
  const { resourceType } = req.params;
  const { period = 'daily', days = 7, limit = 10 } = req.query;
  
  if (!['category', 'brand', 'product'].includes(resourceType)) {
    throw new AppError('Invalid resource type', 400);
  }
  
  const options = {
    period,
    days: parseInt(days),
    limit: parseInt(limit)
  };
  
  const results = await analyticsService.getTrendingItems(resourceType, options);
  
  res.json(
    new ApiResponse(200, results, `Trending ${resourceType}s retrieved successfully`)
  );
});

// @desc    Get analytics overview for admin dashboard
// @route   GET /api/analytics/overview
// @access  Private/Admin
export const getAnalyticsOverview = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const numDays = parseInt(days);
  
  // Get overview data for different resource types
  const [topCategories, topBrands, trendingCategories, trendingBrands] = await Promise.all([
    analyticsService.getTopPerforming('category', { days: numDays, limit: 5 }),
    analyticsService.getTopPerforming('brand', { days: numDays, limit: 5 }),
    analyticsService.getTrendingItems('category', { days: 7, limit: 5 }),
    analyticsService.getTrendingItems('brand', { days: 7, limit: 5 })
  ]);
  
  const overview = {
    topPerforming: {
      categories: topCategories,
      brands: topBrands
    },
    trending: {
      categories: trendingCategories,
      brands: trendingBrands
    },
    summary: {
      totalTopCategories: topCategories.length,
      totalTopBrands: topBrands.length,
      totalTrendingCategories: trendingCategories.length,
      totalTrendingBrands: trendingBrands.length
    }
  };
  
  res.json(
    new ApiResponse(200, overview, 'Analytics overview retrieved successfully')
  );
});

// @desc    Get analytics summary for categories
// @route   GET /api/analytics/categories/summary
// @access  Private/Admin
export const getCategoriesAnalyticsSummary = asyncHandler(async (req, res) => {
  const { days = 30, period = 'daily' } = req.query;
  
  const [topPerforming, trending] = await Promise.all([
    analyticsService.getTopPerforming('category', { 
      period, 
      days: parseInt(days), 
      limit: 20 
    }),
    analyticsService.getTrendingItems('category', { 
      period: 'daily', 
      days: 7, 
      limit: 10 
    })
  ]);
  
  // Calculate total metrics
  const totalMetrics = topPerforming.reduce((acc, item) => {
    acc.totalViews += item.totalViews || 0;
    acc.totalClicks += item.totalClicks || 0;
    acc.totalUsers += item.totalUsers || 0;
    return acc;
  }, { totalViews: 0, totalClicks: 0, totalUsers: 0 });
  
  const summary = {
    topPerforming,
    trending,
    metrics: {
      totalCategories: topPerforming.length,
      ...totalMetrics,
      avgEngagementRate: topPerforming.length > 0 ? 
        (totalMetrics.totalClicks / totalMetrics.totalViews * 100) : 0
    },
    period: {
      days: parseInt(days),
      type: period
    }
  };
  
  res.json(
    new ApiResponse(200, summary, 'Categories analytics summary retrieved successfully')
  );
});

// @desc    Get analytics summary for brands
// @route   GET /api/analytics/brands/summary
// @access  Private/Admin
export const getBrandsAnalyticsSummary = asyncHandler(async (req, res) => {
  const { days = 30, period = 'daily' } = req.query;
  
  const [topPerforming, trending] = await Promise.all([
    analyticsService.getTopPerforming('brand', { 
      period, 
      days: parseInt(days), 
      limit: 20 
    }),
    analyticsService.getTrendingItems('brand', { 
      period: 'daily', 
      days: 7, 
      limit: 10 
    })
  ]);
  
  // Calculate total metrics
  const totalMetrics = topPerforming.reduce((acc, item) => {
    acc.totalViews += item.totalViews || 0;
    acc.totalClicks += item.totalClicks || 0;
    acc.totalUsers += item.totalUsers || 0;
    return acc;
  }, { totalViews: 0, totalClicks: 0, totalUsers: 0 });
  
  const summary = {
    topPerforming,
    trending,
    metrics: {
      totalBrands: topPerforming.length,
      ...totalMetrics,
      avgEngagementRate: topPerforming.length > 0 ? 
        (totalMetrics.totalClicks / totalMetrics.totalViews * 100) : 0
    },
    period: {
      days: parseInt(days),
      type: period
    }
  };
  
  res.json(
    new ApiResponse(200, summary, 'Brands analytics summary retrieved successfully')
  );
});

// @desc    Process analytics events into stats (admin utility)
// @route   POST /api/analytics/process-events
// @access  Private/Admin
export const processAnalyticsEvents = asyncHandler(async (req, res) => {
  const { date } = req.body;
  
  let processDate = new Date();
  if (date) {
    processDate = new Date(date);
    if (isNaN(processDate.getTime())) {
      throw new AppError('Invalid date format', 400);
    }
  }
  
  await analyticsService.processEventsToStats(processDate);
  
  res.json(
    new ApiResponse(200, { 
      processedDate: processDate.toISOString().split('T')[0] 
    }, 'Analytics events processed successfully')
  );
});

// @desc    Get analytics data for charts and visualizations
// @route   GET /api/analytics/charts/:resourceType/:resourceId
// @access  Private/Admin
export const getAnalyticsChartData = asyncHandler(async (req, res) => {
  const { resourceType, resourceId } = req.params;
  const { chartType = 'timeline', days = 30 } = req.query;
  
  if (!['category', 'brand', 'product'].includes(resourceType)) {
    throw new AppError('Invalid resource type', 400);
  }
  
  let chartData;
  
  switch (chartType) {
    case 'timeline':
      // Time series data for views, clicks, users over time
      chartData = await analyticsService.getAnalyticsInsights(resourceType, resourceId, {
        days: parseInt(days),
        includeComparison: false,
        includeTrends: false,
        includeBreakdowns: false
      });
      break;
      
    case 'breakdown':
      // Event type and source breakdowns
      chartData = await analyticsService.getAnalyticsInsights(resourceType, resourceId, {
        days: parseInt(days),
        includeComparison: false,
        includeTrends: false,
        includeBreakdowns: true
      });
      break;
      
    case 'comparison':
      // Current vs previous period comparison
      chartData = await analyticsService.getAnalyticsInsights(resourceType, resourceId, {
        days: parseInt(days),
        includeComparison: true,
        includeTrends: true,
        includeBreakdowns: false
      });
      break;
      
    default:
      throw new AppError('Invalid chart type', 400);
  }
  
  res.json(
    new ApiResponse(200, chartData, `${chartType} chart data retrieved successfully`)
  );
});

// @desc    Get real-time analytics metrics
// @route   GET /api/analytics/realtime
// @access  Private/Admin
export const getRealtimeAnalytics = asyncHandler(async (req, res) => {
  const { resourceType } = req.query;
  
  // Get data for the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  // This would typically come from a real-time analytics system
  // For now, we'll get recent events
  const recentEvents = await analyticsService.getAnalyticsInsights(
    resourceType || 'category', 
    null, 
    { days: 1, includeBreakdowns: true }
  );
  
  const realtimeData = {
    currentActiveUsers: Math.floor(Math.random() * 50) + 10, // Mock data
    eventsLastHour: recentEvents.stats?.reduce((sum, stat) => sum + stat.count, 0) || 0,
    topActiveResources: recentEvents.stats?.slice(0, 5) || [],
    timestamp: new Date().toISOString()
  };
  
  res.json(
    new ApiResponse(200, realtimeData, 'Real-time analytics retrieved successfully')
  );
});

// @desc    Export analytics data
// @route   GET /api/analytics/export/:resourceType
// @access  Private/Admin
export const exportAnalyticsData = asyncHandler(async (req, res) => {
  const { resourceType } = req.params;
  const { format = 'json', days = 30, resourceId } = req.query;
  
  if (!['category', 'brand', 'product'].includes(resourceType)) {
    throw new AppError('Invalid resource type', 400);
  }
  
  let analyticsData;
  
  if (resourceId) {
    // Export data for specific resource
    analyticsData = await analyticsService.getAnalyticsInsights(
      resourceType, 
      resourceId, 
      { days: parseInt(days), includeComparison: true, includeTrends: true, includeBreakdowns: true }
    );
  } else {
    // Export summary data for all resources of this type
    analyticsData = await analyticsService.getTopPerforming(resourceType, {
      days: parseInt(days),
      limit: 1000 // Export all
    });
  }
  
  if (format === 'csv') {
    // Convert to CSV format
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${resourceType}_analytics_${Date.now()}.csv"`);
    
    // Simple CSV conversion - in production, use a proper CSV library
    const csvData = analyticsData.map(item => 
      Object.values(item).join(',')
    ).join('\n');
    
    res.send(csvData);
  } else {
    // JSON format
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${resourceType}_analytics_${Date.now()}.json"`);
    
    res.json(analyticsData);
  }
}); 