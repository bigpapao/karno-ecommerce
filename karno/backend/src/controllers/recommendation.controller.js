import eventService from '../services/recommendation/event.service.js';
import collaborativeFilterService from '../services/recommendation/collaborative-filter.service.js';
import contentBasedFilterService from '../services/recommendation/content-based-filter.service.js';
import hybridRecommendationService from '../services/recommendation/hybrid.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';

/**
 * Helper for parsing common recommendation query parameters
 */
const parseRecommendationParams = (query) => {
  const {
    limit = 10,
    excludeViewed,
    excludeInCart,
    excludePurchased,
    categories,
  } = query;

  return {
    limit: parseInt(limit),
    excludeViewed: excludeViewed === 'true',
    excludeInCart: excludeInCart === 'true',
    excludePurchased: excludePurchased === 'true',
    categories: categories ? categories.split(',') : [],
  };
};

/**
 * Verify user authentication for recommendation requests
 */
const verifyUserAuth = (req) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, 'Authentication required for personalized recommendations');
  }
  return userId;
};

/**
 * Track a user event manually
 */
export const trackEvent = asyncHandler(async (req, res) => {
  const {
    eventType, productId, searchQuery, categoryId, metadata,
  } = req.body;

  if (!eventType) {
    throw new ApiError(400, 'Event type is required');
  }

  // Verify user is authenticated
  if (!req.user || !req.user._id) {
    throw new ApiError(401, 'Authentication required to track events');
  }

  const eventData = {
    userId: req.user._id,
    eventType,
    productId,
    searchQuery,
    categoryId,
    sessionId: req.cookies?.sessionId || req.sessionID,
    referrer: req.get('Referrer'),
    metadata: metadata || {},
  };

  const event = await eventService.trackEvent(eventData);

  return res.status(201).json(
    new ApiResponse(201, event, 'Event tracked successfully'),
  );
});

/**
 * Get user event history
 */
export const getUserEvents = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    eventType, startDate, endDate, limit, page,
  } = req.query;

  const options = {
    eventType,
    startDate,
    endDate,
    limit: parseInt(limit) || 100,
    skip: (parseInt(page) - 1) * (parseInt(limit) || 100) || 0,
  };

  const events = await eventService.getUserEvents(userId, options);

  return res.status(200).json(
    new ApiResponse(200, events, 'User events retrieved successfully'),
  );
});

/**
 * Get event analytics and counts
 */
export const getEventAnalytics = asyncHandler(async (req, res) => {
  const {
    userId, productId, eventType, startDate, endDate,
  } = req.query;

  // Make sure user has admin permission
  if (!req.user?.role || req.user.role !== 'admin') {
    throw new ApiError(403, 'Admin permission required to access analytics');
  }

  const filter = {
    userId,
    productId,
    eventType,
    startDate,
    endDate,
  };

  const counts = await eventService.getEventCounts(filter);

  return res.status(200).json(
    new ApiResponse(200, counts, 'Event analytics retrieved successfully'),
  );
});

/**
 * Helper for checking cache hit from service responses
 */
const detectCacheHit = (req, response) => {
  // Check if the response came from cache
  // Services usually have a cache flag in the data or a timestamp within the last few seconds
  if (response
      && (response._fromCache
      || (response.createdAt && new Date() - new Date(response.createdAt) < 100))
  ) {
    req.cacheHit = true;
  }
  return response;
};

/**
 * Get personalized product recommendations for the current user
 * using collaborative filtering
 */
export const getPersonalRecommendations = asyncHandler(async (req, res) => {
  const userId = verifyUserAuth(req);
  const options = parseRecommendationParams(req.query);

  const recommendations = await collaborativeFilterService.generateRecommendations(userId, options);
  detectCacheHit(req, recommendations);

  return res.status(200).json(
    new ApiResponse(200, recommendations, 'Personalized recommendations generated successfully'),
  );
});

/**
 * Get content-based recommendations based on user's viewed products and preferences
 */
export const getContentBasedRecommendations = asyncHandler(async (req, res) => {
  const userId = verifyUserAuth(req);
  const options = parseRecommendationParams(req.query);

  const recommendations = await contentBasedFilterService.generateRecommendations(userId, options);
  detectCacheHit(req, recommendations);

  return res.status(200).json(
    new ApiResponse(200, recommendations, 'Content-based recommendations generated successfully'),
  );
});

/**
 * Get hybrid recommendations combining collaborative and content-based approaches
 */
export const getHybridRecommendations = asyncHandler(async (req, res) => {
  const userId = verifyUserAuth(req);
  const options = parseRecommendationParams(req.query);

  // Add weights if provided
  const { collaborativeWeight, contentBasedWeight } = req.query;

  if (collaborativeWeight && contentBasedWeight) {
    const collabWeight = parseFloat(collaborativeWeight);
    const contentWeight = parseFloat(contentBasedWeight);
    const sum = collabWeight + contentWeight;

    // Normalize weights to add up to 1
    options.weights = {
      collaborative: collabWeight / sum,
      contentBased: contentWeight / sum,
    };
  }

  const recommendations = await hybridRecommendationService.generateRecommendations(userId, options);
  detectCacheHit(req, recommendations);

  return res.status(200).json(
    new ApiResponse(200, recommendations, 'Hybrid recommendations generated successfully'),
  );
});

/**
 * Get category-based recommendations
 */
export const getCategoryRecommendations = asyncHandler(async (req, res) => {
  const { categories, limit = 10 } = req.query;

  if (!categories) {
    throw new ApiError(400, 'At least one category ID is required');
  }

  const categoryIds = categories.split(',');
  const recommendations = await contentBasedFilterService.getCategoryBasedRecommendations(
    categoryIds,
    parseInt(limit),
  );

  return res.status(200).json(
    new ApiResponse(200, recommendations, 'Category recommendations retrieved successfully'),
  );
});

/**
 * Get popular products based on user interactions
 */
export const getPopularProducts = asyncHandler(async (req, res) => {
  const { limit = 10, days = 30 } = req.query;

  const popularProducts = await collaborativeFilterService.getPopularProducts(
    parseInt(limit),
    parseInt(days),
  );

  return res.status(200).json(
    new ApiResponse(200, popularProducts, 'Popular products retrieved successfully'),
  );
});

/**
 * Verify product ID parameter
 */
const verifyProductId = (productId) => {
  if (!productId) {
    throw new ApiError(400, 'Product ID is required');
  }
  return productId;
};

/**
 * Get similar products based on collaborative filtering
 */
export const getSimilarProducts = asyncHandler(async (req, res) => {
  const productId = verifyProductId(req.params.productId);
  const { limit = 5 } = req.query;

  const similarProducts = await collaborativeFilterService.getSimilarProducts(
    productId,
    parseInt(limit),
  );

  return res.status(200).json(
    new ApiResponse(200, similarProducts, 'Similar products retrieved successfully'),
  );
});

/**
 * Get similar products based on content features
 */
export const getContentSimilarProducts = asyncHandler(async (req, res) => {
  const productId = verifyProductId(req.params.productId);
  const { limit = 5 } = req.query;

  const similarProducts = await contentBasedFilterService.getSimilarProducts(
    productId,
    parseInt(limit),
  );

  return res.status(200).json(
    new ApiResponse(200, similarProducts, 'Content-based similar products retrieved successfully'),
  );
});

/**
 * Get similar products using hybrid approach
 */
export const getHybridSimilarProducts = asyncHandler(async (req, res) => {
  const productId = verifyProductId(req.params.productId);
  const { limit = 5 } = req.query;

  const similarProducts = await hybridRecommendationService.getSimilarProducts(
    productId,
    parseInt(limit),
  );

  return res.status(200).json(
    new ApiResponse(200, similarProducts, 'Hybrid similar products retrieved successfully'),
  );
});

export default {
  trackEvent,
  getUserEvents,
  getEventAnalytics,
  getPersonalRecommendations,
  getContentBasedRecommendations,
  getHybridRecommendations,
  getCategoryRecommendations,
  getPopularProducts,
  getSimilarProducts,
  getContentSimilarProducts,
  getHybridSimilarProducts,
};
