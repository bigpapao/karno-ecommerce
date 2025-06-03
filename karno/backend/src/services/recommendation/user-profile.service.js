import Event from '../../models/recommendation/event.model.js';
import { logger } from '../../utils/logger.js';

class UserProfileService {
  /**
   * Get user's recent event history
   * @private
   */
  async getUserEvents(userId, maxAgeDays = 30) {
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
  buildUserInteractionProfile(events) {
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
   * Get user's top products
   * @param {Object} userProfile - User interaction profile
   * @param {number} limit - Number of top products to return
   * @returns {Array} - Array of top product IDs
   */
  getTopProducts(userProfile, limit = 5) {
    return Object.entries(userProfile.productScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([productId]) => productId);
  }
}

export default new UserProfileService();
