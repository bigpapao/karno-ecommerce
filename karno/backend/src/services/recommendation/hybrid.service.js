import mongoose from 'mongoose';
import Recommendation from '../../models/recommendation/recommendation.model.js';
import collaborativeFilterService from './collaborative-filter.service.js';
import contentBasedFilterService from './content-based-filter.service.js';
import { ApiError } from '../../utils/api-error.js';
import { logger } from '../../utils/logger.js';

/**
 * Hybrid Recommendation Service
 * Combines collaborative filtering and content-based recommendations
 * using a weighted ensemble approach
 */
class HybridRecommendationService {
  /**
   * Generate hybrid recommendations for a user
   *
   * @param {string} userId - User ID to generate recommendations for
   * @param {Object} options - Options for recommendation generation
   * @returns {Promise<Array>} - List of recommended products with scores
   */
  async generateRecommendations(userId, options = {}) {
    try {
      const {
        limit = 10,
        excludeViewed = true,
        excludeInCart = true,
        excludePurchased = true,
        categories = [],
        weights = { collaborative: 0.6, contentBased: 0.4 },
      } = options;

      // Check if we have cached hybrid recommendations
      const cachedRecommendation = await Recommendation.findOne({
        userId,
        recommendationType: 'hybrid',
        expiresAt: { $gt: new Date() },
      })
        .populate('products.productId', 'name price images category brand')
        .lean();

      if (cachedRecommendation) {
        return cachedRecommendation.products.slice(0, limit);
      }

      // 1. Get collaborative filtering recommendations
      const collaborativeOptions = {
        limit: Math.min(limit * 2, 20), // Get more to have a good pool to choose from
        excludeViewed,
        excludeInCart,
        excludePurchased,
      };
      const collaborativeRecommendations = await collaborativeFilterService.generateRecommendations(
        userId,
        collaborativeOptions,
      );

      // 2. Get content-based recommendations
      const contentBasedOptions = {
        limit: Math.min(limit * 2, 20),
        excludeViewed,
        excludeInCart,
        excludePurchased,
        categories,
      };
      const contentBasedRecommendations = await contentBasedFilterService.generateRecommendations(
        userId,
        contentBasedOptions,
      );

      // 3. Merge recommendations using a weighted approach
      const mergedRecommendations = this._mergeRecommendations(
        collaborativeRecommendations,
        contentBasedRecommendations,
        weights,
        limit,
      );

      // 4. Cache the recommendations
      await this._cacheRecommendations(userId, mergedRecommendations);

      return mergedRecommendations;
    } catch (error) {
      logger.error(`Failed to generate hybrid recommendations for user ${userId}: ${error.message}`);
      throw new ApiError(500, `Failed to generate hybrid recommendations: ${error.message}`);
    }
  }

  /**
   * Get similar products using a hybrid approach
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

      // Check if we have cached hybrid similar products
      const cachedRecommendation = await Recommendation.findOne({
        sourceProductId: productId,
        recommendationType: 'hybrid',
        expiresAt: { $gt: new Date() },
      })
        .populate('products.productId', 'name price images category brand')
        .lean();

      if (cachedRecommendation) {
        return cachedRecommendation.products.slice(0, limit);
      }

      // 1. Get collaborative similar products
      const collaborativeSimilar = await collaborativeFilterService.getSimilarProducts(
        productId,
        Math.min(limit * 2, 10),
      );

      // 2. Get content-based similar products
      const contentBasedSimilar = await contentBasedFilterService.getSimilarProducts(
        productId,
        Math.min(limit * 2, 10),
      );

      // 3. Merge the recommendations with default weights
      const weights = { collaborative: 0.6, contentBased: 0.4 };
      const mergedRecommendations = this._mergeRecommendations(
        collaborativeSimilar,
        contentBasedSimilar,
        weights,
        limit,
      );

      // 4. Cache the recommendations
      await Recommendation.findOneAndUpdate(
        {
          sourceProductId: productId,
          recommendationType: 'hybrid',
        },
        {
          userId: null, // Not user-specific
          sourceProductId: productId,
          recommendationType: 'hybrid',
          products: mergedRecommendations.map((r) => ({
            productId: r.productId,
            score: r.score,
            reason: r.reason,
          })),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
        { upsert: true, new: true },
      );

      return mergedRecommendations;
    } catch (error) {
      logger.error(`Failed to get hybrid similar products for ${productId}: ${error.message}`);
      throw new ApiError(500, `Failed to get hybrid similar products: ${error.message}`);
    }
  }

  /**
   * Merge recommendations from multiple sources
   * @private
   */
  _mergeRecommendations(collaborativeRecs, contentBasedRecs, weights, limit) {
    // Create a map to hold merged products with their scores
    const mergedMap = new Map();

    // Process collaborative recommendations
    collaborativeRecs.forEach((rec) => {
      const productId = rec.productId.toString();

      if (!mergedMap.has(productId)) {
        mergedMap.set(productId, {
          productId: rec.productId,
          score: rec.score * weights.collaborative,
          sources: ['collaborative'],
          sourceScores: { collaborative: rec.score },
          reason: rec.reason,
          product: rec.product,
        });
      }
    });

    // Process content-based recommendations
    contentBasedRecs.forEach((rec) => {
      const productId = rec.productId.toString();

      if (!mergedMap.has(productId)) {
        // Add new recommendation
        mergedMap.set(productId, {
          productId: rec.productId,
          score: rec.score * weights.contentBased,
          sources: ['contentBased'],
          sourceScores: { contentBased: rec.score },
          reason: rec.reason,
          product: rec.product,
        });
      } else {
        // Update existing recommendation
        const existing = mergedMap.get(productId);
        existing.score += rec.score * weights.contentBased;
        existing.sources.push('contentBased');
        existing.sourceScores.contentBased = rec.score;

        // Update reason to indicate hybrid source
        if (existing.sources.includes('collaborative')) {
          existing.reason = 'Recommended based on your browsing history and product features';
        }
      }
    });

    // Convert map to array, sort by score, and limit
    const result = Array.from(mergedMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Normalize scores to a 0-10 range for consistency
    const maxScore = Math.max(...result.map((item) => item.score));
    if (maxScore > 0) {
      result.forEach((item) => {
        item.score = Math.round((item.score / maxScore) * 10 * 10) / 10; // Round to 1 decimal place
      });
    }

    return result;
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
          recommendationType: 'hybrid',
          sourceProductId: null, // User-based, not product-based
        },
        {
          userId,
          recommendationType: 'hybrid',
          products: recommendations.map((rec) => ({
            productId: rec.productId,
            score: rec.score,
            reason: rec.reason,
          })),
          expiresAt,
        },
        { upsert: true },
      );
    } catch (error) {
      // Don't fail if caching fails, just log the error
      logger.error(`Failed to cache hybrid recommendations for user ${userId}: ${error.message}`);
    }
  }
}

export default new HybridRecommendationService();
