import Recommendation from '../../models/recommendation/recommendation.model.js';
import { logger } from '../../utils/logger.js';

class RecommendationCacheService {
  /**
   * Cache recommendations in database
   * @param {string} userId - User ID to cache recommendations for
   * @param {Array} recommendations - List of recommendations to cache
   * @param {string} [sourceProductId] - Optional source product ID for product-based recommendations
   */
  async cacheRecommendations(userId, recommendations, sourceProductId = null) {
    try {
      // Set expiration date (24 hours)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Create or update recommendations
      await Recommendation.findOneAndUpdate(
        {
          userId,
          recommendationType: 'collaborative',
          sourceProductId,
        },
        {
          userId,
          recommendationType: 'collaborative',
          sourceProductId,
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

  /**
   * Get cached recommendations
   * @param {string} userId - User ID to get cached recommendations for
   * @param {string} [sourceProductId] - Optional source product ID for product-based recommendations
   * @returns {Promise<Array|null>} - Cached recommendations or null if not found/expired
   */
  async getCachedRecommendations(userId, sourceProductId = null) {
    try {
      const cachedRecommendation = await Recommendation.findOne({
        userId,
        recommendationType: 'collaborative',
        sourceProductId,
        expiresAt: { $gt: new Date() },
      })
        .populate('products.productId', 'name price images category brand')
        .lean();

      return cachedRecommendation?.products || null;
    } catch (error) {
      logger.error(`Failed to get cached recommendations for user ${userId}: ${error.message}`);
      return null;
    }
  }
}

export default new RecommendationCacheService();
