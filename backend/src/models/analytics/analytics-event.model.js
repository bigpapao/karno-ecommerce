import mongoose from 'mongoose';

const analyticsEventSchema = new mongoose.Schema(
  {
    // Event identification
    eventType: {
      type: String,
      required: true,
      enum: [
        'category_view',
        'category_click', 
        'category_product_view',
        'brand_view',
        'brand_click',
        'brand_product_view',
        'product_view',
        'product_click',
        'search_category',
        'search_brand',
        'filter_category',
        'filter_brand'
      ],
      index: true
    },
    
    // Resource being tracked
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
    
    // User information
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    
    sessionId: {
      type: String,
      index: true
    },
    
    // Tracking metadata
    ipAddress: String,
    userAgent: String,
    referrer: String,
    
    // Context information
    context: {
      page: String,
      section: String,
      searchQuery: String,
      filters: mongoose.Schema.Types.Mixed,
      position: Number, // Position in list/grid
      source: String    // organic, search, filter, recommendation
    },
    
    // Additional data
    metadata: {
      categoryName: String,
      brandName: String,
      productName: String,
      price: Number,
      duration: Number, // Time spent viewing (seconds)
      scrollDepth: Number, // Percentage of page scrolled
      clickX: Number,
      clickY: Number
    },
    
    // Timing
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    
    // Processed flag for aggregation
    processed: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'analytics_events'
  }
);

// Compound indexes for common queries
analyticsEventSchema.index({ eventType: 1, resourceType: 1, timestamp: -1 });
analyticsEventSchema.index({ resourceId: 1, eventType: 1, timestamp: -1 });
analyticsEventSchema.index({ userId: 1, timestamp: -1 });
analyticsEventSchema.index({ timestamp: -1, processed: 1 });
analyticsEventSchema.index({ resourceType: 1, resourceId: 1, timestamp: -1 });

// TTL index to automatically delete old events (90 days)
analyticsEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

// Virtual for date formatting
analyticsEventSchema.virtual('formattedDate').get(function() {
  return this.timestamp.toISOString().split('T')[0];
});

// Static methods for analytics queries
analyticsEventSchema.statics.getCategoryStats = function(categoryId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        resourceId: new mongoose.Types.ObjectId(categoryId),
        resourceType: 'category',
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        uniqueSessions: { $addToSet: '$sessionId' }
      }
    },
    {
      $project: {
        eventType: '$_id',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        uniqueSessions: { $size: '$uniqueSessions' }
      }
    }
  ]);
};

analyticsEventSchema.statics.getBrandStats = function(brandId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        resourceId: new mongoose.Types.ObjectId(brandId),
        resourceType: 'brand',
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        uniqueSessions: { $addToSet: '$sessionId' }
      }
    },
    {
      $project: {
        eventType: '$_id',
        count: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        uniqueSessions: { $size: '$uniqueSessions' }
      }
    }
  ]);
};

analyticsEventSchema.statics.getTopCategories = function(days = 30, limit = 10) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        resourceType: 'category',
        eventType: { $in: ['category_view', 'category_click', 'category_product_view'] },
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$resourceId',
        totalEvents: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        categoryName: { $first: '$metadata.categoryName' }
      }
    },
    {
      $project: {
        categoryId: '$_id',
        totalEvents: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        categoryName: 1,
        score: { $add: ['$totalEvents', { $multiply: [{ $size: '$uniqueUsers' }, 2] }] }
      }
    },
    { $sort: { score: -1 } },
    { $limit: limit }
  ]);
};

analyticsEventSchema.statics.getTopBrands = function(days = 30, limit = 10) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        resourceType: 'brand',
        eventType: { $in: ['brand_view', 'brand_click', 'brand_product_view'] },
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$resourceId',
        totalEvents: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        brandName: { $first: '$metadata.brandName' }
      }
    },
    {
      $project: {
        brandId: '$_id',
        totalEvents: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        brandName: 1,
        score: { $add: ['$totalEvents', { $multiply: [{ $size: '$uniqueUsers' }, 2] }] }
      }
    },
    { $sort: { score: -1 } },
    { $limit: limit }
  ]);
};

analyticsEventSchema.statics.getDailyStats = function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          resourceType: '$resourceType',
          eventType: '$eventType'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        events: {
          $push: {
            resourceType: '$_id.resourceType',
            eventType: '$_id.eventType',
            count: '$count'
          }
        },
        totalEvents: { $sum: '$count' }
      }
    },
    { $sort: { '_id': 1 } }
  ]);
};

const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);

export default AnalyticsEvent; 