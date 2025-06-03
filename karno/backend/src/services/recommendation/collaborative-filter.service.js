import mongoose from 'mongoose';
import Event from '../../models/recommendation/event.model.js';
import Recommendation from '../../models/recommendation/recommendation.model.js';
import Product from '../../models/product.model.js';
import { ApiError } from '../../utils/api-error.js';
import { logger } from '../../utils/logger.js';
import popularProductsService from './popular-products.service.js';
import similarProductsService from './similar-products.service.js';
import userProfileService from './user-profile.service.js';
import recommendationCacheService from './recommendation-cache.service.js';

/**
 * Collaborative Filtering Service
 * Implements item-based collaborative filtering for product recommendations
 * using user event data collected in the database
 */
class CollaborativeFilterService {
  /**
   * Generate recommendations for a user based on their interactions
   * Uses item-based collaborative filtering
   *
   * @param {string} userId - User ID to generate recommendations for
   * @param {Object} options - Options for recommendation generation
   * @returns {Promise<Array>} - List of recommended product IDs with scores
   */
  async generateRecommendations(userId, options = {}) {
    try {
      const {
        limit = 10,
        minInteractions = 5,
        excludeViewed = true,
        excludeInCart = true,
        excludePurchased = true,
        maxAge = 30, // days
      } = options;

      // Check cache first
      const cachedRecommendations = await recommendationCacheService.getCachedRecommendations(userId);
      if (cachedRecommendations) {
        return cachedRecommendations;
      }

      // 1. Get user's interaction history
      const userEvents = await userProfileService.getUserEvents(userId, maxAge);

      // If user has no events, return popular products
      if (userEvents.length === 0) {
        logger.info(`No interaction history for user ${userId}, returning popular products`);
        return popularProductsService.getPopularProducts(limit);
      }

      // 2. Build user-item interaction matrix
      const userInteractions = userProfileService.buildUserInteractionProfile(userEvents);

      // If user doesn't have enough interactions, supplement with popular products
      if (Object.keys(userInteractions.productScores).length < minInteractions) {
        logger.info(`User ${userId} has insufficient interactions (${Object.keys(userInteractions.productScores).length}), supplementing with popular products`);
        const popularRecommendations = await popularProductsService.getPopularProducts(
          limit - Object.keys(userInteractions.productScores).length,
        );

        // Combine with the few interactions they do have
        const userBasedRecs = await this._generateUserBasedRecommendations(
          userInteractions,
          Object.keys(userInteractions.productScores).length,
          excludeViewed,
          excludeInCart,
          excludePurchased,
        );

        return [...userBasedRecs, ...popularRecommendations];
      }

      // 3. Generate recommendations based on user's profile
      const recommendations = await this._generateUserBasedRecommendations(
        userInteractions,
        limit,
        excludeViewed,
        excludeInCart,
        excludePurchased,
      );

      // 4. Cache the recommendations
      await recommendationCacheService.cacheRecommendations(userId, recommendations);

      return recommendations;
    } catch (error) {
      logger.error(`Failed to generate recommendations for user ${userId}: ${error.message}`);
      throw new ApiError(500, `Failed to generate recommendations: ${error.message}`);
    }
  }

  /**
   * Get popular products based on view, cart, and purchase events
   *
   * @param {number} limit - Number of products to return
   * @param {number} days - Time frame for popularity calculation (days)
   * @returns {Promise<Array>} - List of popular product IDs with scores
   */
  async getPopularProducts(limit = 10, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Aggregate events to find popular products
      const pipeline = [
        {
          $match: {
            timestamp: { $gte: startDate },
            eventType: { $in: ['view', 'add_to_cart', 'purchase'] },
          },
        },
        {
          $group: {
            _id: '$productId',
            score: {
              $sum: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$eventType', 'purchase'] }, then: 5 },
                    { case: { $eq: ['$eventType', 'add_to_cart'] }, then: 2 },
                    { case: { $eq: ['$eventType', 'view'] }, then: 1 },
                  ],
                  default: 0,
                },
              },
            },
            viewCount: {
              $sum: { $cond: [{ $eq: ['$eventType', 'view'] }, 1, 0] },
            },
            cartCount: {
              $sum: { $cond: [{ $eq: ['$eventType', 'add_to_cart'] }, 1, 0] },
            },
            purchaseCount: {
              $sum: { $cond: [{ $eq: ['$eventType', 'purchase'] }, 1, 0] },
            },
          },
        },
        {
          $sort: { score: -1 },
        },
        {
          $limit: limit,
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        {
          $unwind: '$product',
        },
        {
          $project: {
            productId: '$_id',
            score: 1,
            viewCount: 1,
            cartCount: 1,
            purchaseCount: 1,
            name: '$product.name',
            price: '$product.price',
            images: '$product.images',
            category: '$product.category',
            brand: '$product.brand',
          },
        },
      ];

      const popularProducts = await Event.aggregate(pipeline);

      // Format results
      return popularProducts.map((item) => ({
        productId: item.productId,
        score: item.score,
        reason: 'Popular product',
        stats: {
          views: item.viewCount,
          addedToCart: item.cartCount,
          purchased: item.purchaseCount,
        },
        product: {
          name: item.name,
          price: item.price,
          images: item.images ? item.images.slice(0, 1) : [],
          category: item.category,
          brand: item.brand,
        },
      }));
    } catch (error) {
      logger.error(`Failed to get popular products: ${error.message}`);
      throw new ApiError(500, `Failed to get popular products: ${error.message}`);
    }
  }

  /**
   * Find similar products based on co-occurrence in user events
   *
   * @param {string} productId - Product ID to find similar products for
   * @param {number} limit - Number of similar products to return
   * @returns {Promise<Array>} - List of similar product IDs with scores
   */
  async getSimilarProducts(productId, limit = 5) {
    try {
      // Validate product ID
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new ApiError(400, 'Invalid product ID');
      }

      // First, check if we already have cached similar products
      const cachedRecommendation = await Recommendation.findOne({
        sourceProductId: productId,
        recommendationType: 'collaborative',
        expiresAt: { $gt: new Date() },
      })
        .populate('products.productId', 'name price images category brand')
        .lean();

      if (cachedRecommendation) {
        return cachedRecommendation.products.slice(0, limit);
      }

      // Find users who interacted with this product
      const usersWhoInteracted = await Event.distinct('userId', {
        productId: new mongoose.Types.ObjectId(productId),
      });

      if (usersWhoInteracted.length === 0) {
        logger.info(`No user interactions found for product ${productId}, returning popular products`);
        const popularProducts = await this.getPopularProducts(limit);
        return popularProducts;
      }

      // Find other products these users interacted with (excluding the source product)
      const coOccurrenceResults = await Event.aggregate([
        {
          $match: {
            userId: { $in: usersWhoInteracted },
            productId: { $ne: new mongoose.Types.ObjectId(productId) },
          },
        },
        {
          $group: {
            _id: '$productId',
            score: {
              $sum: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$eventType', 'purchase'] }, then: 5 },
                    { case: { $eq: ['$eventType', 'add_to_cart'] }, then: 2 },
                    { case: { $eq: ['$eventType', 'view'] }, then: 1 },
                  ],
                  default: 0,
                },
              },
            },
            userCount: { $addToSet: '$userId' },
          },
        },
        {
          $project: {
            productId: '$_id',
            score: 1,
            userOverlap: { $size: '$userCount' },
            overlapRatio: { $divide: [{ $size: '$userCount' }, usersWhoInteracted.length] },
          },
        },
        {
          $sort: { score: -1, overlapRatio: -1 },
        },
        {
          $limit: limit,
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        {
          $unwind: '$product',
        },
        {
          $project: {
            productId: '$_id',
            score: 1,
            userOverlap: 1,
            overlapRatio: 1,
            product: {
              name: '$product.name',
              price: '$product.price',
              images: '$product.images',
              category: '$product.category',
              brand: '$product.brand',
            },
          },
        },
      ]);

      // Format and cache the results
      const formattedResults = coOccurrenceResults.map((item) => ({
        productId: item.productId,
        score: item.score,
        reason: `${Math.round(item.overlapRatio * 100)}% of users who interacted with this product also interacted with this item`,
        product: {
          name: item.product.name,
          price: item.product.price,
          images: item.product.images ? item.product.images.slice(0, 1) : [],
          category: item.product.category,
          brand: item.product.brand,
        },
      }));

      // Cache the results for future requests
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1); // Cache for 1 day

      await Recommendation.findOneAndUpdate(
        { sourceProductId: productId, recommendationType: 'collaborative' },
        {
          userId: null, // Not user-specific
          sourceProductId: productId,
          recommendationType: 'collaborative',
          products: formattedResults.map((r) => ({
            productId: r.productId,
            score: r.score,
            reason: r.reason,
          })),
          expiresAt,
        },
        { upsert: true, new: true },
      );

      return formattedResults;
    } catch (error) {
      logger.error(`Failed to get similar products for ${productId}: ${error.message}`);
      throw new ApiError(500, `Failed to get similar products: ${error.message}`);
    }
  }

  /**
   * Get user's recent event history
   * @private
   */
  async _getUserEvents(userId, maxAgeDays = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - maxAgeDays);

    return Event.find({
      userId,
      timestamp: { $gte: startDate },
      productId: { $exists: true, $ne: null },
    })
      .sort({ timestamp: -1 })
      .lean();
  }

  /**
   * Build a profile of user's product interactions
   * @private
   */
  _buildUserInteractionProfile(events) {
    const profile = {
      productScores: {},
      viewedProducts: new Set(),
      inCartProducts: new Set(),
      purchasedProducts: new Set(),
    };

    // Process each event
    events.forEach((event) => {
      const productId = event.productId.toString();

      // Initialize if not exists
      if (!profile.productScores[productId]) {
        profile.productScores[productId] = 0;
      }

      // Add score based on event type
      switch (event.eventType) {
        case 'view':
          profile.productScores[productId] += 1;
          profile.viewedProducts.add(productId);
          break;
        case 'add_to_cart':
          profile.productScores[productId] += 2;
          profile.inCartProducts.add(productId);
          break;
        case 'purchase':
          profile.productScores[productId] += 5;
          profile.purchasedProducts.add(productId);
          break;
        default:
          // No score for other event types
          break;
      }
    });

    return profile;
  }

  /**
   * Generate recommendations based on user's profile
   * @private
   */
  async _generateUserBasedRecommendations(userProfile, limit, excludeViewed, excludeInCart, excludePurchased) {
    try {
      // Get user's top products
      const topProducts = userProfileService.getTopProducts(userProfile, 5);

      // Get similar products for each top product
      const similarProductsPromises = topProducts.map((prodId) => similarProductsService.getSimilarProducts(prodId, 3));

      const similarProductsArrays = await Promise.all(similarProductsPromises);

      // Flatten and deduplicate recommendations
      const allRecommendations = [];
      const seenProductIds = new Set();

      // Create excluded set based on options
      const excludedProductIds = new Set();

      if (excludeViewed) {
        userProfile.viewedProducts.forEach((id) => excludedProductIds.add(id));
      }

      if (excludeInCart) {
        userProfile.inCartProducts.forEach((id) => excludedProductIds.add(id));
      }

      if (excludePurchased) {
        userProfile.purchasedProducts.forEach((id) => excludedProductIds.add(id));
      }

      // Process each array of similar products
      similarProductsArrays.forEach((products) => {
        products.forEach((product) => {
          const productId = product.productId.toString();

          // Skip if already seen or excluded
          if (seenProductIds.has(productId) || excludedProductIds.has(productId)) {
            return;
          }

          seenProductIds.add(productId);
          allRecommendations.push(product);
        });
      });

      // Sort by score and return limited results
      return allRecommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      logger.error(`Error generating user-based recommendations: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cache recommendations in database
   * @private
   */
  async _cacheRecommendations(userId, recommendations) {
    try {
      // Set expiration date (24 hours)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Create or update recommendations
      await Recommendation.findOneAndUpdate(
        {
          userId,
          recommendationType: 'collaborative',
          sourceProductId: null, // User-based, not product-based
        },
        {
          userId,
          recommendationType: 'collaborative',
          products: recommendations.map((rec) => ({
            productId: rec.productId,
            score: rec.score,
            reason: rec.reason || 'Based on your browsing history',
          })),
          expiresAt,
        },
        { upsert: true },
      );
    } catch (error) {
      // Don't fail if caching fails, just log the error
      logger.error(`Failed to cache recommendations for user ${userId}: ${error.message}`);
    }
  }
}

export default new CollaborativeFilterService();
