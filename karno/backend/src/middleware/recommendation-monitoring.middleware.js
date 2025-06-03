import recommendationMonitoring from '../utils/recommendation-monitoring.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware to track recommendation API metrics
 * This middleware tracks performance metrics like latency, response status,
 * and cache hits for all recommendation routes.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const trackRecommendationMetrics = (req, res, next) => {
  try {
    // Improved route matching to capture all recommendation routes efficiently
    const isRecommendationRoute = req.originalUrl.startsWith('/api/recommendations')
      || req.originalUrl.startsWith('/api/recommendation-monitoring');

    if (!isRecommendationRoute) {
      return next();
    }

    // Mark the start time to calculate latency
    const startTime = Date.now();

    // Extract the specific endpoint for more detailed tracking
    const urlPath = req.originalUrl.split('?')[0];
    let endpoint = urlPath.replace(/^\/api\/(recommendations|recommendation-monitoring)\//, '');
    endpoint = endpoint || 'root';

    // Flag to track if response is from cache (set by services)
    if (req.cacheHit === undefined) {
      req.cacheHit = false;
    }

    // Store the original end method
    const originalEnd = res.end;

    // Override the end method to capture response metrics
    res.end = function (chunk, encoding) {
      try {
        // Calculate request latency
        const latency = Date.now() - startTime;

        // Determine if the request was successful
        const success = res.statusCode >= 200 && res.statusCode < 400;

        // Track the API call
        recommendationMonitoring.trackApiCall(endpoint, latency, success, req.cacheHit);

        // Call the original end method
        return originalEnd.call(this, chunk, encoding);
      } catch (error) {
        logger.error(`Error in recommendation monitoring middleware: ${error.message}`);
        // Ensure original end is called even if tracking fails
        return originalEnd.call(this, chunk, encoding);
      }
    };

    next();
  } catch (error) {
    logger.error(`Error initializing recommendation monitoring middleware: ${error.message}`);
    next(); // Continue processing the request even if monitoring fails
  }
};

/**
 * Middleware to anonymize sensitive user data for recommendation training
 * This ensures GDPR compliance by removing PII from recommendation data
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const anonymizeUserData = (req, res, next) => {
  try {
    // Only process recommendation training routes
    if (!req.originalUrl.includes('/recommendations/train')) {
      return next();
    }

    // If there's user data in the request, anonymize it
    if (req.body?.userData) {
      req.body.userData = recommendationMonitoring.getGdprCompliantUserData(req.body.userData);
    }

    // If there's a list of users, anonymize each one
    if (req.body?.users && Array.isArray(req.body.users)) {
      req.body.users = req.body.users.map((user) => recommendationMonitoring.getGdprCompliantUserData(user));
    }

    // If there's a userId parameter, anonymize it
    if (req.body?.userId) {
      req.body.anonymizedUserId = recommendationMonitoring.anonymizeUserId(req.body.userId);
      delete req.body.userId;
    }

    // Add anonymization info to request for debugging
    req.anonymized = true;

    next();
  } catch (error) {
    logger.error(`Error in anonymize user data middleware: ${error.message}`);
    next(); // Continue to allow request processing even if anonymization fails
  }
};
