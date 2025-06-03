import express from 'express';
import {
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
} from '../controllers/recommendation.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Event tracking endpoints
router.post('/events', authenticate, trackEvent);
router.get('/events/user', authenticate, getUserEvents);
router.get('/events/analytics', authenticate, authorize('admin'), getEventAnalytics);

// Recommendation endpoints
router.get('/personal', authenticate, getPersonalRecommendations);
router.get('/content-based', authenticate, getContentBasedRecommendations);
router.get('/hybrid', authenticate, getHybridRecommendations);
router.get('/by-category', getCategoryRecommendations);
router.get('/popular', getPopularProducts);
router.get('/similar/:productId', getSimilarProducts);
router.get('/similar-content/:productId', getContentSimilarProducts);
router.get('/similar-hybrid/:productId', getHybridSimilarProducts);

export default router;
