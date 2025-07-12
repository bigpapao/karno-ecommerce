import mongoose from 'mongoose';

const usageStatsSchema = new mongoose.Schema(
  {
    // Resource identification
    resourceType: {
      type: String,
      required: true,
      enum: ['category', 'brand', 'product'],
      index: true
    },
    
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    
    // Time period
    date: {
      type: Date,
      required: true,
      index: true
    },
    
    period: {
      type: String,
      required: true,
      enum: ['daily', 'weekly', 'monthly'],
      index: true
    },
    
    // Aggregated metrics
    metrics: {
      // View metrics
      totalViews: { type: Number, default: 0 },
      uniqueViews: { type: Number, default: 0 },
      
      // Click metrics
      totalClicks: { type: Number, default: 0 },
      uniqueClicks: { type: Number, default: 0 },
      
      // User engagement
      totalUsers: { type: Number, default: 0 },
      returningUsers: { type: Number, default: 0 },
      
      // Session metrics
      totalSessions: { type: Number, default: 0 },
      avgSessionDuration: { type: Number, default: 0 },
      
      // Conversion metrics
      clickThroughRate: { type: Number, default: 0 },
      engagementRate: { type: Number, default: 0 },
      
      // Search and filter metrics
      searchImpressions: { type: Number, default: 0 },
      filterUsage: { type: Number, default: 0 },
      
      // Product-related metrics (for categories and brands)
      productViews: { type: Number, default: 0 },
      productClicks: { type: Number, default: 0 },
      
      // Performance score (calculated)
      popularityScore: { type: Number, default: 0 },
      trendScore: { type: Number, default: 0 }
    },
    
    // Detailed breakdowns
    breakdowns: {
      // By event type
      eventCounts: [{
        eventType: String,
        count: Number
      }],
      
      // By hour (for daily stats)
      hourlyDistribution: [{
        hour: Number,
        count: Number
      }],
      
      // By source
      sourceDistribution: [{
        source: String,
        count: Number
      }],
      
      // Top referrers
      topReferrers: [{
        referrer: String,
        count: Number
      }]
    },
    
    // Metadata
    metadata: {
      name: String,
      slug: String,
      category: String, // For products
      brand: String,    // For products
      featured: Boolean,
      lastUpdated: { type: Date, default: Date.now }
    }
  },
  {
    timestamps: true,
    collection: 'usage_stats'
  }
);

// Compound indexes for efficient queries
usageStatsSchema.index({ resourceType: 1, resourceId: 1, period: 1, date: -1 });
usageStatsSchema.index({ resourceType: 1, period: 1, date: -1 });
usageStatsSchema.index({ 'metrics.popularityScore': -1, resourceType: 1 });
usageStatsSchema.index({ 'metrics.trendScore': -1, resourceType: 1 });
usageStatsSchema.index({ date: -1, period: 1 });

// TTL index to automatically delete old stats (1 year)
usageStatsSchema.index({ date: 1 }, { expireAfterSeconds: 31536000 });

// Static methods for analytics queries
usageStatsSchema.statics.getTopPerforming = function(resourceType, period = 'daily', days = 30, limit = 10) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        resourceType,
        period,
        date: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$resourceId',
        totalViews: { $sum: '$metrics.totalViews' },
        totalClicks: { $sum: '$metrics.totalClicks' },
        totalUsers: { $sum: '$metrics.totalUsers' },
        avgPopularityScore: { $avg: '$metrics.popularityScore' },
        name: { $first: '$metadata.name' }
      }
    },
    {
      $project: {
        resourceId: '$_id',
        totalViews: 1,
        totalClicks: 1,
        totalUsers: 1,
        avgPopularityScore: 1,
        name: 1,
        combinedScore: {
          $add: [
            '$totalViews',
            { $multiply: ['$totalClicks', 2] },
            { $multiply: ['$totalUsers', 3] },
            { $multiply: ['$avgPopularityScore', 10] }
          ]
        }
      }
    },
    { $sort: { combinedScore: -1 } },
    { $limit: limit }
  ]);
};

usageStatsSchema.statics.getTrendingItems = function(resourceType, period = 'daily', days = 7, limit = 10) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        resourceType,
        period,
        date: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$resourceId',
        avgTrendScore: { $avg: '$metrics.trendScore' },
        recentViews: { $sum: '$metrics.totalViews' },
        name: { $first: '$metadata.name' }
      }
    },
    { $sort: { avgTrendScore: -1 } },
    { $limit: limit }
  ]);
};

usageStatsSchema.statics.getUsageOverTime = function(resourceId, period = 'daily', days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    resourceId,
    period,
    date: { $gte: startDate }
  })
  .sort({ date: 1 })
  .select('date metrics.totalViews metrics.totalClicks metrics.totalUsers')
  .lean();
};

usageStatsSchema.statics.getComparativeStats = function(resourceType, period = 'monthly', months = 6) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  
  return this.aggregate([
    {
      $match: {
        resourceType,
        period,
        date: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        totalViews: { $sum: '$metrics.totalViews' },
        totalClicks: { $sum: '$metrics.totalClicks' },
        totalUsers: { $sum: '$metrics.totalUsers' },
        avgEngagementRate: { $avg: '$metrics.engagementRate' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
};

// Instance methods
usageStatsSchema.methods.calculatePopularityScore = function() {
  const metrics = this.metrics;
  
  // Weighted popularity score
  const viewScore = metrics.totalViews * 1;
  const clickScore = metrics.totalClicks * 2;
  const userScore = metrics.totalUsers * 3;
  const engagementScore = metrics.engagementRate * 100;
  
  this.metrics.popularityScore = (viewScore + clickScore + userScore + engagementScore) / 4;
  return this.metrics.popularityScore;
};

usageStatsSchema.methods.calculateTrendScore = function(previousPeriodStats) {
  if (!previousPeriodStats) {
    this.metrics.trendScore = 0;
    return 0;
  }
  
  const current = this.metrics;
  const previous = previousPeriodStats.metrics;
  
  // Calculate percentage change in key metrics
  const viewsChange = previous.totalViews > 0 ? 
    ((current.totalViews - previous.totalViews) / previous.totalViews) * 100 : 0;
  
  const clicksChange = previous.totalClicks > 0 ? 
    ((current.totalClicks - previous.totalClicks) / previous.totalClicks) * 100 : 0;
  
  const usersChange = previous.totalUsers > 0 ? 
    ((current.totalUsers - previous.totalUsers) / previous.totalUsers) * 100 : 0;
  
  // Weighted trend score
  this.metrics.trendScore = (viewsChange + clicksChange * 1.5 + usersChange * 2) / 4.5;
  return this.metrics.trendScore;
};

const UsageStats = mongoose.model('UsageStats', usageStatsSchema);

export default UsageStats; 