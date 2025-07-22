import AnalyticsEvent from '../models/analytics/analytics-event.model.js';
import UsageStats from '../models/analytics/usage-stats.model.js';
import Category from '../models/category.model.js';
import Brand from '../models/brand.model.js';
import { getCache, setCache } from '../utils/cache.js';

class AnalyticsService {
  
  // Track a single event
  async trackEvent(eventData) {
    try {
      // Enrich event data
      const enrichedData = await this.enrichEventData(eventData);
      
      // Create analytics event
      const event = new AnalyticsEvent(enrichedData);
      await event.save();
      
      // Queue for real-time processing
      await this.queueForProcessing(event);
      
      return event;
    } catch (error) {
      console.error('Error tracking event:', error);
      throw error;
    }
  }
  
  // Track multiple events in batch
  async trackBatchEvents(events) {
    try {
      const enrichedEvents = await Promise.all(
        events.map(event => this.enrichEventData(event))
      );
      
      const createdEvents = await AnalyticsEvent.insertMany(enrichedEvents);
      
      // Queue for batch processing
      await this.queueBatchForProcessing(createdEvents);
      
      return createdEvents;
    } catch (error) {
      console.error('Error tracking batch events:', error);
      throw error;
    }
  }
  
  // Enrich event data with additional context
  async enrichEventData(eventData) {
    const enriched = { ...eventData };
    
    // Helper function to check if a string is a valid ObjectId
    const isValidObjectId = (id) => {
      return /^[0-9a-fA-F]{24}$/.test(id);
    };
    
    // Add metadata based on resource type
    if (eventData.resourceType === 'category' && eventData.resourceId) {
      // Only try to find by ID if it's a valid ObjectId
      if (isValidObjectId(eventData.resourceId)) {
        try {
          const category = await Category.findById(eventData.resourceId).lean();
          if (category) {
            enriched.metadata = {
              ...enriched.metadata,
              categoryName: category.name,
            };
          }
        } catch (error) {
          console.warn('Error fetching category for analytics:', error.message);
        }
      } else {
        // For page-level tracking with string IDs like 'categories_page'
        enriched.metadata = {
          ...enriched.metadata,
          pageIdentifier: eventData.resourceId,
        };
      }
    }
    
    if (eventData.resourceType === 'brand' && eventData.resourceId) {
      // Only try to find by ID if it's a valid ObjectId
      if (isValidObjectId(eventData.resourceId)) {
        try {
          const brand = await Brand.findById(eventData.resourceId).lean();
          if (brand) {
            enriched.metadata = {
              ...enriched.metadata,
              brandName: brand.name,
            };
          }
        } catch (error) {
          console.warn('Error fetching brand for analytics:', error.message);
        }
      } else {
        // For page-level tracking with string IDs like 'brands_page'
        enriched.metadata = {
          ...enriched.metadata,
          pageIdentifier: eventData.resourceId,
        };
      }
    }
    
    // Add timestamp if not provided
    if (!enriched.timestamp) {
      enriched.timestamp = new Date();
    }
    
    // Generate session ID if not provided
    if (!enriched.sessionId && enriched.userId) {
      enriched.sessionId = this.generateSessionId(enriched.userId, enriched.timestamp);
    }
    
    return enriched;
  }
  
  // Generate analytics insights
  async getAnalyticsInsights(resourceType, resourceId, options = {}) {
    const {
      days = 30,
      includeComparison = true,
      includeTrends = true,
      includeBreakdowns = true
    } = options;
    
    const cacheKey = `analytics:insights:${resourceType}:${resourceId}:${days}`;
    
    // Try to get from cache first
    const cached = await getCache(cacheKey);
    if (cached) return cached;
    
    const insights = {};
    
    // Basic stats
    if (resourceType === 'category') {
      insights.stats = await AnalyticsEvent.getCategoryStats(resourceId, days);
    } else if (resourceType === 'brand') {
      insights.stats = await AnalyticsEvent.getBrandStats(resourceId, days);
    }
    
    // Usage over time
    insights.timeSeriesData = await UsageStats.getUsageOverTime(resourceId, 'daily', days);
    
    // Comparison with previous period
    if (includeComparison) {
      insights.comparison = await this.getComparisonData(resourceType, resourceId, days);
    }
    
    // Trend analysis
    if (includeTrends) {
      insights.trends = await this.getTrendAnalysis(resourceType, resourceId, days);
    }
    
    // Detailed breakdowns
    if (includeBreakdowns) {
      insights.breakdowns = await this.getDetailedBreakdowns(resourceType, resourceId, days);
    }
    
    // Calculate performance score
    insights.performanceScore = this.calculatePerformanceScore(insights.stats);
    
    // Cache results for 1 hour
    await setCache(cacheKey, insights, 3600);
    
    return insights;
  }
  
  // Get top performing categories/brands
  async getTopPerforming(resourceType, options = {}) {
    const { period = 'daily', days = 30, limit = 10 } = options;
    
    const cacheKey = `analytics:top:${resourceType}:${period}:${days}:${limit}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;
    
    const results = await UsageStats.getTopPerforming(resourceType, period, days, limit);
    
    // Cache for 2 hours
    await setCache(cacheKey, results, 7200);
    
    return results;
  }
  
  // Get trending items
  async getTrendingItems(resourceType, options = {}) {
    const { period = 'daily', days = 7, limit = 10 } = options;
    
    const cacheKey = `analytics:trending:${resourceType}:${period}:${days}:${limit}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;
    
    const results = await UsageStats.getTrendingItems(resourceType, period, days, limit);
    
    // Cache for 1 hour
    await setCache(cacheKey, results, 3600);
    
    return results;
  }
  
  // Process events into aggregated stats
  async processEventsToStats(date = new Date()) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    // Get unprocessed events for the day
    const events = await AnalyticsEvent.find({
      timestamp: { $gte: startDate, $lte: endDate },
      processed: false
    });
    
    if (events.length === 0) {
      console.log('No unprocessed events found for', date.toDateString());
      return;
    }
    
    // Group events by resource
    const groupedEvents = this.groupEventsByResource(events);
    
    // Process each resource group
    for (const [resourceKey, resourceEvents] of Object.entries(groupedEvents)) {
      await this.processResourceEvents(resourceKey, resourceEvents, startDate);
    }
    
    // Mark events as processed
    const eventIds = events.map(e => e._id);
    await AnalyticsEvent.updateMany(
      { _id: { $in: eventIds } },
      { processed: true }
    );
    
    console.log(`Processed ${events.length} events for ${date.toDateString()}`);
  }
  
  // Helper methods
  
  generateSessionId(userId, timestamp) {
    const date = timestamp.toISOString().split('T')[0];
    const hour = Math.floor(timestamp.getHours() / 2) * 2; // 2-hour windows
    return `${userId}_${date}_${hour}`;
  }
  
  async queueForProcessing(event) {
    // In a production environment, this could use a message queue
    // For now, we'll process immediately for real-time stats
    setImmediate(() => {
      this.processEventRealTime(event).catch(console.error);
    });
  }
  
  async queueBatchForProcessing(events) {
    setImmediate(() => {
      this.processBatchEventsRealTime(events).catch(console.error);
    });
  }
  
  async processEventRealTime(event) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Update daily stats
      await this.updateUsageStats(event, today, 'daily');
      
      // Clear relevant caches
      await this.clearAnalyticsCache(event.resourceType, event.resourceId);
    } catch (error) {
      console.error('Error processing real-time event:', error);
    }
  }
  
  async processBatchEventsRealTime(events) {
    // Process events in chunks to avoid overwhelming the database
    const chunkSize = 100;
    for (let i = 0; i < events.length; i += chunkSize) {
      const chunk = events.slice(i, i + chunkSize);
      await Promise.all(chunk.map(event => this.processEventRealTime(event)));
    }
  }
  
  groupEventsByResource(events) {
    return events.reduce((groups, event) => {
      const key = `${event.resourceType}:${event.resourceId}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(event);
      return groups;
    }, {});
  }
  
  async processResourceEvents(resourceKey, events, date) {
    const [resourceType, resourceId] = resourceKey.split(':');
    
    // Calculate metrics for different periods
    await this.calculateAndSaveStats(resourceType, resourceId, events, date, 'daily');
    
    // Weekly stats (if it's end of week)
    if (date.getDay() === 0) { // Sunday
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - 6);
      await this.calculateWeeklyStats(resourceType, resourceId, weekStart, date);
    }
    
    // Monthly stats (if it's end of month)
    if (this.isEndOfMonth(date)) {
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      await this.calculateMonthlyStats(resourceType, resourceId, monthStart, date);
    }
  }
  
  async calculateAndSaveStats(resourceType, resourceId, events, date, period) {
    const metrics = this.calculateMetricsFromEvents(events);
    
    // Get resource metadata
    let metadata = {};
    if (resourceType === 'category') {
      const category = await Category.findById(resourceId).lean();
      if (category) {
        metadata = {
          name: category.name,
          slug: category.slug,
          featured: category.featured
        };
      }
    } else if (resourceType === 'brand') {
      const brand = await Brand.findById(resourceId).lean();
      if (brand) {
        metadata = {
          name: brand.name,
          slug: brand.slug,
          featured: brand.featured
        };
      }
    }
    
    // Create or update usage stats
    const stats = await UsageStats.findOneAndUpdate(
      {
        resourceType,
        resourceId,
        date,
        period
      },
      {
        metrics,
        metadata,
        breakdowns: this.calculateBreakdowns(events)
      },
      {
        upsert: true,
        new: true
      }
    );
    
    // Calculate scores
    stats.calculatePopularityScore();
    
    // Calculate trend score if previous period exists
    const previousDate = new Date(date);
    if (period === 'daily') {
      previousDate.setDate(previousDate.getDate() - 1);
    } else if (period === 'weekly') {
      previousDate.setDate(previousDate.getDate() - 7);
    } else if (period === 'monthly') {
      previousDate.setMonth(previousDate.getMonth() - 1);
    }
    
    const previousStats = await UsageStats.findOne({
      resourceType,
      resourceId,
      date: previousDate,
      period
    });
    
    if (previousStats) {
      stats.calculateTrendScore(previousStats);
    }
    
    await stats.save();
  }
  
  calculateMetricsFromEvents(events) {
    const metrics = {
      totalViews: 0,
      uniqueViews: 0,
      totalClicks: 0,
      uniqueClicks: 0,
      totalUsers: 0,
      returningUsers: 0,
      totalSessions: 0,
      searchImpressions: 0,
      filterUsage: 0,
      productViews: 0,
      productClicks: 0
    };
    
    const uniqueViewUsers = new Set();
    const uniqueClickUsers = new Set();
    const uniqueUsers = new Set();
    const uniqueSessions = new Set();
    
    for (const event of events) {
      uniqueSessions.add(event.sessionId);
      if (event.userId) uniqueUsers.add(event.userId.toString());
      
      switch (event.eventType) {
        case 'category_view':
        case 'brand_view':
          metrics.totalViews++;
          if (event.userId) uniqueViewUsers.add(event.userId.toString());
          break;
          
        case 'category_click':
        case 'brand_click':
          metrics.totalClicks++;
          if (event.userId) uniqueClickUsers.add(event.userId.toString());
          break;
          
        case 'category_product_view':
        case 'brand_product_view':
          metrics.productViews++;
          break;
          
        case 'search_category':
        case 'search_brand':
          metrics.searchImpressions++;
          break;
          
        case 'filter_category':
        case 'filter_brand':
          metrics.filterUsage++;
          break;
      }
    }
    
    metrics.uniqueViews = uniqueViewUsers.size;
    metrics.uniqueClicks = uniqueClickUsers.size;
    metrics.totalUsers = uniqueUsers.size;
    metrics.totalSessions = uniqueSessions.size;
    
    // Calculate rates
    metrics.clickThroughRate = metrics.totalViews > 0 ? 
      (metrics.totalClicks / metrics.totalViews) * 100 : 0;
    
    metrics.engagementRate = metrics.totalUsers > 0 ? 
      ((metrics.totalClicks + metrics.productViews) / metrics.totalUsers) * 100 : 0;
    
    return metrics;
  }
  
  calculateBreakdowns(events) {
    const eventCounts = {};
    const hourlyDistribution = Array(24).fill(0);
    const sourceDistribution = {};
    const referrerCounts = {};
    
    for (const event of events) {
      // Event type breakdown
      eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1;
      
      // Hourly distribution
      const hour = event.timestamp.getHours();
      hourlyDistribution[hour]++;
      
      // Source distribution
      const source = event.context?.source || 'unknown';
      sourceDistribution[source] = (sourceDistribution[source] || 0) + 1;
      
      // Referrer breakdown
      if (event.referrer) {
        referrerCounts[event.referrer] = (referrerCounts[event.referrer] || 0) + 1;
      }
    }
    
    return {
      eventCounts: Object.entries(eventCounts).map(([eventType, count]) => ({ eventType, count })),
      hourlyDistribution: hourlyDistribution.map((count, hour) => ({ hour, count })),
      sourceDistribution: Object.entries(sourceDistribution).map(([source, count]) => ({ source, count })),
      topReferrers: Object.entries(referrerCounts)
        .map(([referrer, count]) => ({ referrer, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    };
  }
  
  async getComparisonData(resourceType, resourceId, days) {
    const currentPeriodStart = new Date();
    currentPeriodStart.setDate(currentPeriodStart.getDate() - days);
    
    const previousPeriodStart = new Date(currentPeriodStart);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - days);
    
    const previousPeriodEnd = new Date(currentPeriodStart);
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);
    
    const currentStats = await UsageStats.find({
      resourceType,
      resourceId,
      period: 'daily',
      date: { $gte: currentPeriodStart }
    }).lean();
    
    const previousStats = await UsageStats.find({
      resourceType,
      resourceId,
      period: 'daily',
      date: { $gte: previousPeriodStart, $lte: previousPeriodEnd }
    }).lean();
    
    const currentTotals = this.aggregateStats(currentStats);
    const previousTotals = this.aggregateStats(previousStats);
    
    return {
      current: currentTotals,
      previous: previousTotals,
      changes: this.calculateChanges(currentTotals, previousTotals)
    };
  }
  
  async getTrendAnalysis(resourceType, resourceId, days) {
    const stats = await UsageStats.find({
      resourceType,
      resourceId,
      period: 'daily',
      date: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
    }).sort({ date: 1 }).lean();
    
    if (stats.length < 7) {
      return { trend: 'insufficient_data', confidence: 0 };
    }
    
    // Simple trend analysis using linear regression
    const viewTrend = this.calculateTrend(stats.map(s => s.metrics.totalViews));
    const clickTrend = this.calculateTrend(stats.map(s => s.metrics.totalClicks));
    const userTrend = this.calculateTrend(stats.map(s => s.metrics.totalUsers));
    
    const avgTrend = (viewTrend + clickTrend + userTrend) / 3;
    
    let trend;
    if (avgTrend > 0.1) trend = 'increasing';
    else if (avgTrend < -0.1) trend = 'decreasing';
    else trend = 'stable';
    
    return {
      trend,
      confidence: Math.min(Math.abs(avgTrend) * 10, 1),
      details: {
        viewTrend,
        clickTrend,
        userTrend
      }
    };
  }
  
  async getDetailedBreakdowns(resourceType, resourceId, days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return await AnalyticsEvent.aggregate([
      {
        $match: {
          resourceType,
          resourceId: new mongoose.Types.ObjectId(resourceId),
          timestamp: { $gte: startDate }
        }
      },
      {
        $facet: {
          byEventType: [
            { $group: { _id: '$eventType', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          byHour: [
            { $group: { _id: { $hour: '$timestamp' }, count: { $sum: 1 } } },
            { $sort: { '_id': 1 } }
          ],
          bySource: [
            { $group: { _id: '$context.source', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          byDevice: [
            { $group: { _id: { $substr: ['$userAgent', 0, 20] }, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ]
        }
      }
    ]);
  }
  
  calculatePerformanceScore(stats) {
    if (!stats || stats.length === 0) return 0;
    
    let totalScore = 0;
    for (const stat of stats) {
      const score = (stat.count * 1) + (stat.uniqueUsers * 2) + (stat.uniqueSessions * 1.5);
      totalScore += score;
    }
    
    return Math.round(totalScore / stats.length);
  }
  
  aggregateStats(stats) {
    return stats.reduce((acc, stat) => {
      acc.totalViews += stat.metrics.totalViews;
      acc.totalClicks += stat.metrics.totalClicks;
      acc.totalUsers += stat.metrics.totalUsers;
      acc.totalSessions += stat.metrics.totalSessions;
      return acc;
    }, { totalViews: 0, totalClicks: 0, totalUsers: 0, totalSessions: 0 });
  }
  
  calculateChanges(current, previous) {
    const changes = {};
    for (const [key, currentValue] of Object.entries(current)) {
      const previousValue = previous[key] || 0;
      if (previousValue === 0) {
        changes[key] = currentValue > 0 ? 100 : 0;
      } else {
        changes[key] = ((currentValue - previousValue) / previousValue) * 100;
      }
    }
    return changes;
  }
  
  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    return slope;
  }
  
  isEndOfMonth(date) {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay.getMonth() !== date.getMonth();
  }
  
  async clearAnalyticsCache(resourceType, resourceId) {
    const patterns = [
      `analytics:insights:${resourceType}:${resourceId}:*`,
      `analytics:top:${resourceType}:*`,
      `analytics:trending:${resourceType}:*`
    ];
    
    for (const pattern of patterns) {
      await cache.deletePattern(pattern);
    }
  }
  
  async calculateWeeklyStats(resourceType, resourceId, startDate, endDate) {
    // Implementation for weekly aggregation
    const dailyStats = await UsageStats.find({
      resourceType,
      resourceId,
      period: 'daily',
      date: { $gte: startDate, $lte: endDate }
    });
    
    if (dailyStats.length === 0) return;
    
    const weeklyMetrics = this.aggregateStats(dailyStats);
    
    await UsageStats.findOneAndUpdate(
      {
        resourceType,
        resourceId,
        date: endDate,
        period: 'weekly'
      },
      {
        metrics: weeklyMetrics,
        metadata: dailyStats[0].metadata
      },
      { upsert: true }
    );
  }
  
  async calculateMonthlyStats(resourceType, resourceId, startDate, endDate) {
    // Implementation for monthly aggregation
    const dailyStats = await UsageStats.find({
      resourceType,
      resourceId,
      period: 'daily',
      date: { $gte: startDate, $lte: endDate }
    });
    
    if (dailyStats.length === 0) return;
    
    const monthlyMetrics = this.aggregateStats(dailyStats);
    
    await UsageStats.findOneAndUpdate(
      {
        resourceType,
        resourceId,
        date: endDate,
        period: 'monthly'
      },
      {
        metrics: monthlyMetrics,
        metadata: dailyStats[0].metadata
      },
      { upsert: true }
    );
  }
}

export default new AnalyticsService(); 