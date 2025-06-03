import mongoose from 'mongoose';
import Event from '../../models/recommendation/event.model.js';
import { ApiError } from '../../utils/api-error.js';
import { logger } from '../../utils/logger.js';

class PopularProductsService {
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
}

export default new PopularProductsService();
