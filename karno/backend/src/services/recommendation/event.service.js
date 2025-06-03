import Event from '../../models/recommendation/event.model.js';
import { ApiError } from '../../utils/api-error.js';

class EventService {
  /**
   * Track a user event (page view, add to cart, purchase, etc.)
   * @param {Object} eventData - Data for the event
   * @returns {Promise<Object>} The created event
   */
  async trackEvent(eventData) {
    try {
      // Validate required fields
      if (!eventData.userId) {
        throw new ApiError(400, 'User ID is required');
      }

      if (!eventData.eventType) {
        throw new ApiError(400, 'Event type is required');
      }

      // For product-related events, productId is required
      if (['view', 'add_to_cart', 'purchase'].includes(eventData.eventType) && !eventData.productId) {
        throw new ApiError(400, 'Product ID is required for this event type');
      }

      // For search events, searchQuery is required
      if (eventData.eventType === 'search' && !eventData.searchQuery) {
        throw new ApiError(400, 'Search query is required for search events');
      }

      // Create and save the event
      const event = new Event({
        userId: eventData.userId,
        eventType: eventData.eventType,
        productId: eventData.productId,
        searchQuery: eventData.searchQuery,
        categoryId: eventData.categoryId,
        referrer: eventData.referrer,
        sessionId: eventData.sessionId,
        metadata: eventData.metadata || {},
      });

      await event.save();
      return event;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Failed to track event: ${error.message}`);
    }
  }

  /**
   * Get user events by user ID
   * @param {string} userId - The user ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of user events
   */
  async getUserEvents(userId, options = {}) {
    try {
      const {
        eventType,
        startDate,
        endDate,
        limit = 100,
        skip = 0,
        sort = { timestamp: -1 },
      } = options;

      const query = { userId };

      if (eventType) {
        query.eventType = eventType;
      }

      if (startDate || endDate) {
        query.timestamp = {};

        if (startDate) {
          query.timestamp.$gte = new Date(startDate);
        }

        if (endDate) {
          query.timestamp.$lte = new Date(endDate);
        }
      }

      const events = await Event.find(query)
        .sort(sort)
        .limit(limit)
        .skip(skip);

      return events;
    } catch (error) {
      throw new ApiError(500, `Failed to get user events: ${error.message}`);
    }
  }

  /**
   * Get product events
   * @param {string} productId - The product ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of product events
   */
  async getProductEvents(productId, options = {}) {
    try {
      const {
        eventType,
        startDate,
        endDate,
        limit = 100,
        skip = 0,
      } = options;

      const query = { productId };

      if (eventType) {
        query.eventType = eventType;
      }

      if (startDate || endDate) {
        query.timestamp = {};

        if (startDate) {
          query.timestamp.$gte = new Date(startDate);
        }

        if (endDate) {
          query.timestamp.$lte = new Date(endDate);
        }
      }

      const events = await Event.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip);

      return events;
    } catch (error) {
      throw new ApiError(500, `Failed to get product events: ${error.message}`);
    }
  }

  /**
   * Get event counts for analytics
   * @param {Object} filter - Filter criteria
   * @returns {Promise<Object>} Event counts
   */
  async getEventCounts(filter = {}) {
    try {
      const {
        userId, productId, eventType, startDate, endDate,
      } = filter;

      const query = {};

      if (userId) query.userId = userId;
      if (productId) query.productId = productId;
      if (eventType) query.eventType = eventType;

      if (startDate || endDate) {
        query.timestamp = {};

        if (startDate) {
          query.timestamp.$gte = new Date(startDate);
        }

        if (endDate) {
          query.timestamp.$lte = new Date(endDate);
        }
      }

      // Group by event type and count
      const result = await Event.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$eventType',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            eventType: '$_id',
            count: 1,
          },
        },
      ]);

      // Convert array to object for easier consumption
      const counts = result.reduce((acc, curr) => {
        acc[curr.eventType] = curr.count;
        return acc;
      }, {});

      return counts;
    } catch (error) {
      throw new ApiError(500, `Failed to get event counts: ${error.message}`);
    }
  }
}

export default new EventService();
