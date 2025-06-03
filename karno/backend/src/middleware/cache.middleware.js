/**
 * Cache Middleware
 *
 * This middleware provides route-level caching for API responses.
 * It can be applied to routes that return relatively static data or
 * routes where the response is expensive to compute but doesn't change frequently.
 */

import { redisClient, CACHE_TTL } from '../config/redis.js';
import { logger } from '../utils/logger.js';

/**
 * Cache middleware factory
 * @param {string} key - Cache key
 * @param {number} ttl - Time to live in seconds
 * @returns {Function} Express middleware
 */
const cacheMiddleware = (key, ttl = CACHE_TTL.PRODUCTS) => async (req, res, next) => {
  try {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key based on request parameters
    const cacheKey = `${key}:${req.originalUrl || req.url}`;

    // Try to get data from cache
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      logger.debug(`Cache hit for ${cacheKey}`);
      return res.json(JSON.parse(cachedData));
    }

    // If no cached data, modify res.json to cache the response
    const originalJson = res.json;
    res.json = function (data) {
      redisClient.setex(cacheKey, ttl, JSON.stringify(data));
      return originalJson.call(this, data);
    };

    next();
  } catch (error) {
    logger.error('Cache Middleware Error:', error);
    next();
  }
};

/**
 * Clear cache middleware
 * @param {string} pattern - Cache key pattern to clear
 * @returns {Function} Express middleware
 */
const clearCache = (pattern) => async (req, res, next) => {
  try {
    const keys = await redisClient.keys(`${pattern}:*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.debug(`Cleared cache for pattern: ${pattern}`);
    }
    next();
  } catch (error) {
    logger.error('Clear Cache Error:', error);
    next();
  }
};

export { cacheMiddleware, clearCache };
export default { cacheMiddleware, clearCache };
