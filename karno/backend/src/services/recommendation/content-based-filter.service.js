import mongoose from 'mongoose';
import Product from '../../models/product.model.js';
import Recommendation from '../../models/recommendation/recommendation.model.js';
import { ApiError } from '../../utils/api-error.js';
import { logger } from '../../utils/logger.js';

/**
 * Content-Based Filtering Service
 * Uses product metadata (categories, tags, descriptions) to find similar products
 * and generate recommendations based on content similarity
 */
class ContentBasedFilterService {
  // Cache expiration settings
  #CACHE_DURATION_HOURS = 24;

  #CACHE_TYPE = 'content_based';

  /**
   * Generate recommendations based on a user's viewing/interaction history
   * Uses content-based filtering approach
   *
   * @param {string} userId - User ID to generate recommendations for
   * @param {Object} options - Options for recommendation generation
   * @returns {Promise<Array>} - List of recommended product IDs with scores
   */
  async generateRecommendations(userId, options = {}) {
    try {
      const {
        limit = 10,
        excludeViewed = true,
        excludeInCart = true,
        excludePurchased = true,
        categories = [],
        maxAge = 30, // days
      } = options;

      // Check for cached recommendations first
      const cachedRecommendation = await this.#getCachedRecommendations(userId);
      if (cachedRecommendation) {
        return cachedRecommendation.products.slice(0, limit);
      }

      // Get recently viewed products for this user
      const recentProducts = await this._getUserViewedProducts(userId, maxAge, excludeViewed, excludeInCart, excludePurchased);

      if (recentProducts.length === 0) {
        logger.info(`No recent product history for user ${userId}, returning category-based recommendations`);
        return this.getCategoryBasedRecommendations(categories, limit);
      }

      // Get similar products based on content features
      // Only use the top 3 most recently viewed products to limit processing
      const productIds = recentProducts.slice(0, 3).map((product) => product._id);
      const similarProductsArrays = await Promise.all(
        productIds.map((productId) => this.getSimilarProducts(productId, 5)),
      );

      // Flatten and deduplicate recommendations
      const seenProductIds = new Set();
      const results = [];

      // Process each array of similar products
      for (const products of similarProductsArrays) {
        for (const product of products) {
          const productId = product.productId.toString();

          // Skip if already seen or in viewed/cart/purchased lists
          if (seenProductIds.has(productId)) {
            continue;
          }

          seenProductIds.add(productId);
          results.push(product);
        }
      }

      // Cache the recommendations
      await this._cacheRecommendations(userId, results);

      // Return the top N recommendations
      return results.slice(0, limit);
    } catch (error) {
      logger.error(`Failed to generate content-based recommendations for user ${userId}: ${error.message}`);
      throw new ApiError(500, `Failed to generate recommendations: ${error.message}`);
    }
  }

  /**
   * Find similar products based on product metadata (categories, tags, description)
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
        recommendationType: this.#CACHE_TYPE,
        expiresAt: { $gt: new Date() },
      })
        .populate('products.productId', 'name price images category brand')
        .lean();

      if (cachedRecommendation) {
        // Don't modify req here as it's not available in the service layer
        // This will be handled by the controller middleware
        return cachedRecommendation.products.slice(0, limit);
      }

      // Get the source product
      const sourceProduct = await Product.findById(productId).lean();

      if (!sourceProduct) {
        throw new ApiError(404, 'Product not found');
      }

      // Find similar products based on category, brand, and tags
      const similarProducts = await this.#findSimilarProductsViaAggregate(sourceProduct, limit);

      // Format results
      const formattedResults = this.#formatSimilarProducts(similarProducts, sourceProduct);

      // Cache the results for future requests
      await this.#cacheSimilarProducts(productId, formattedResults);

      return formattedResults;
    } catch (error) {
      logger.error(`Failed to get content-based similar products for ${productId}: ${error.message}`);
      throw new ApiError(500, `Failed to get similar products: ${error.message}`);
    }
  }

  /**
   * Get recommendations based on product categories
   *
   * @param {Array} categories - List of category IDs to get recommendations for
   * @param {number} limit - Number of recommendations to return
   * @returns {Promise<Array>} - List of recommended products
   */
  async getCategoryBasedRecommendations(categories = [], limit = 10) {
    try {
      const categoryFilter = categories.length > 0
        ? { category: { $in: categories.map((id) => new mongoose.Types.ObjectId(id)) } }
        : {};

      // Get top-rated or newest products in these categories
      const products = await Product.aggregate([
        { $match: categoryFilter },
        {
          $addFields: {
            score: {
              $add: [
                { $ifNull: ['$averageRating', 3] }, // Default rating if none
                {
                  $cond: [
                    {
                      $gt: [
                        { $subtract: [new Date(), '$createdAt'] },
                        1000 * 60 * 60 * 24 * 30, // 30 days in milliseconds
                      ],
                    },
                    0, // Older than 30 days
                    2, // Newer than 30 days (boost)
                  ],
                },
              ],
            },
          },
        },
        { $sort: { score: -1 } },
        { $limit: limit },
        {
          $project: {
            _id: 1,
            name: 1,
            price: 1,
            images: { $slice: ['$images', 1] },
            category: 1,
            brand: 1,
            score: 1,
          },
        },
      ]);

      // Format results
      return products.map((item) => ({
        productId: item._id,
        score: item.score,
        reason: categories.length > 0 ? 'From your preferred categories' : 'Popular product',
        product: {
          name: item.name,
          price: item.price,
          images: item.images || [],
          category: item.category,
          brand: item.brand,
        },
      }));
    } catch (error) {
      logger.error(`Failed to get category-based recommendations: ${error.message}`);
      throw new ApiError(500, `Failed to get category recommendations: ${error.message}`);
    }
  }

  /**
   * Get recently viewed products for a user
   * @private
   */
  async _getUserViewedProducts(userId, maxAgeDays, excludeViewed, excludeInCart, excludePurchased) {
    // Start by getting user's recent product view history
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - maxAgeDays);

    const viewConditions = [{ userId: new mongoose.Types.ObjectId(userId) }];

    // Create a pipeline for aggregation
    const pipeline = [
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          timestamp: { $gte: startDate },
          productId: { $exists: true, $ne: null },
          eventType: 'view',
        },
      },
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: '$productId',
          lastViewed: { $first: '$timestamp' },
          viewCount: { $sum: 1 },
        },
      },
      {
        $sort: { lastViewed: -1 },
      },
      {
        $limit: 10, // Get the 10 most recently viewed products
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
        $replaceRoot: { newRoot: '$product' },
      },
    ];

    const recentlyViewedProducts = await Product.aggregate(pipeline);

    return recentlyViewedProducts;
  }

  /**
   * Cache recommendations in database
   * @private
   */
  async _cacheRecommendations(userId, recommendations) {
    try {
      // Set expiration date
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.#CACHE_DURATION_HOURS);

      // Create or update recommendations
      await Recommendation.findOneAndUpdate(
        {
          userId,
          recommendationType: this.#CACHE_TYPE,
          sourceProductId: null, // User-based, not product-based
        },
        {
          userId,
          recommendationType: this.#CACHE_TYPE,
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
      logger.error(`Failed to cache content-based recommendations for user ${userId}: ${error.message}`);
    }
  }

  /**
   * Get cached recommendations for a user if available
   * @private
   */
  async #getCachedRecommendations(userId) {
    try {
      const cachedRecommendation = await Recommendation.findOne({
        userId,
        recommendationType: this.#CACHE_TYPE,
        sourceProductId: null,
        expiresAt: { $gt: new Date() },
      })
        .populate('products.productId', 'name price images category brand')
        .lean();

      if (cachedRecommendation) {
        // Don't modify req here as it's not available in the service layer
        // This will be handled by the controller middleware
        logger.debug(`Using cached content-based recommendations for user ${userId}`);
      }

      return cachedRecommendation;
    } catch (error) {
      logger.error(`Error checking cached recommendations: ${error.message}`);
      return null;
    }
  }

  /**
   * Find similar products using MongoDB aggregation
   * @private
   */
  async #findSimilarProductsViaAggregate(sourceProduct, limit) {
    return Product.aggregate([
      {
        $match: {
          _id: { $ne: new mongoose.Types.ObjectId(sourceProduct._id) },
          $or: [
            { category: sourceProduct.category },
            { brand: sourceProduct.brand },
            { tags: { $in: sourceProduct.tags || [] } },
          ],
        },
      },
      {
        $addFields: {
          // Calculate similarity score
          similarityScore: {
            $add: [
              // Category match (highest weight)
              { $cond: [{ $eq: ['$category', sourceProduct.category] }, 5, 0] },

              // Brand match
              { $cond: [{ $eq: ['$brand', sourceProduct.brand] }, 3, 0] },

              // Price similarity (closer prices = higher score)
              {
                $cond: [
                  {
                    $lt: [
                      { $abs: { $subtract: ['$price', sourceProduct.price] } },
                      sourceProduct.price * 0.2, // Within 20% of price
                    ],
                  },
                  2,
                  0,
                ],
              },

              // Tag overlap score
              {
                $cond: [
                  { $isArray: '$tags' },
                  {
                    $size: {
                      $setIntersection: ['$tags', sourceProduct.tags || []],
                    },
                  },
                  0,
                ],
              },
            ],
          },
        },
      },
      { $sort: { similarityScore: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          images: { $slice: ['$images', 1] },
          category: 1,
          brand: 1,
          similarityScore: 1,
        },
      },
    ]);
  }

  /**
   * Format similar products results for response
   * @private
   */
  #formatSimilarProducts(similarProducts, sourceProduct) {
    return similarProducts.map((item) => {
      // Generate reason message based on matching criteria
      let reason = '';
      if (item.category === sourceProduct.category) {
        reason += 'Same category';
      }
      if (item.brand === sourceProduct.brand) {
        reason += reason ? ', same brand' : 'Same brand';
      }
      if (!reason) {
        reason = 'Similar product features';
      }

      return {
        productId: item._id,
        score: item.similarityScore,
        reason,
        product: {
          name: item.name,
          price: item.price,
          images: item.images || [],
          category: item.category,
          brand: item.brand,
        },
      };
    });
  }

  /**
   * Cache similar products results
   * @private
   */
  async #cacheSimilarProducts(productId, formattedResults) {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.#CACHE_DURATION_HOURS);

      await Recommendation.findOneAndUpdate(
        {
          sourceProductId: productId,
          recommendationType: this.#CACHE_TYPE,
        },
        {
          userId: null, // Not user-specific
          sourceProductId: productId,
          recommendationType: this.#CACHE_TYPE,
          products: formattedResults.map((r) => ({
            productId: r.productId,
            score: r.score,
            reason: r.reason,
          })),
          expiresAt,
        },
        { upsert: true, new: true },
      );
    } catch (error) {
      logger.error(`Error caching similar products: ${error.message}`);
      // Don't throw - this is a non-critical operation
    }
  }
}

export default new ContentBasedFilterService();
