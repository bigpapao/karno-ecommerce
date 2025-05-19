/**
 * Cache Middleware
 * 
 * This middleware provides route-level caching for API responses.
 * It can be applied to routes that return relatively static data or
 * routes where the response is expensive to compute but doesn't change frequently.
 */

import { setCache, getCache, deleteCache } from '../utils/cache.js';
import { logger } from '../utils/logger.js';

/**
 * Cache middleware factory function
 * 
 * @param {number} ttl - Time to live in seconds
 * @param {Function} [keyGenerator] - Optional function to generate custom cache keys
 * @returns {Function} Express middleware
 */
export const cacheMiddleware = (ttl = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Generate cache key based on URL and query parameters
    const key = keyGenerator 
      ? keyGenerator(req)
      : `route:${req.originalUrl || req.url}`;
    
    try {
      // Try to get from cache
      const cachedResponse = await getCache(key);
      
      if (cachedResponse) {
        // Return cached response
        logger.debug(`Cache hit for key: ${key}`);
        return res.status(cachedResponse.status).json(cachedResponse.data);
      }
      
      // Cache miss, store the original json method
      const originalJson = res.json;
      
      // Override res.json method to cache the response
      res.json = function(data) {
        // Restore original json method
        res.json = originalJson;
        
        // Cache the response
        const responseToCache = {
          status: res.statusCode,
          data
        };
        
        setCache(key, responseToCache, ttl).catch(error => {
          logger.error({
            message: 'Failed to cache response',
            key,
            error: error.message,
            stack: error.stack
          });
        });
        
        // Return the response as usual
        return originalJson.call(this, data);
      };
      
      logger.debug(`Cache miss for key: ${key}`);
      next();
    } catch (error) {
      logger.error({
        message: 'Cache middleware error',
        key,
        error: error.message,
        stack: error.stack
      });
      next();
    }
  };
};

/**
 * Clear the cache for a specific route
 * 
 * @param {string} route - Route path to clear cache for
 * @returns {Function} Express middleware
 */
export const clearRouteCache = (route) => {
  return async (req, res, next) => {
    try {
      // Clear cache for the route
      const key = `route:${route}`;
      await deleteCache(key);
      logger.debug(`Cleared cache for route: ${route}`);
      next();
    } catch (error) {
      logger.error({
        message: 'Failed to clear route cache',
        route,
        error: error.message,
        stack: error.stack
      });
      next();
    }
  };
}; 