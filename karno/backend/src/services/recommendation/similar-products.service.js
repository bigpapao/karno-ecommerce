import mongoose from 'mongoose';
import Event from '../../models/recommendation/event.model.js';
import Recommendation from '../../models/recommendation/recommendation.model.js';
import { ApiError } from '../../utils/api-error.js';
import { logger } from '../../utils/logger.js';
import popularProductsService from './popular-products.service.js';

class SimilarProductsService {
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
        return popularProductsService.getPopularProducts(limit);
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
}

export default new SimilarProductsService();
