/**
 * Cache Utility
 *
 * Provides caching functionality for frequently accessed data or expensive operations.
 * Uses in-memory cache for development and can be extended to use Redis for production.
 */

import { logger } from './logger.js';

// In-memory cache store
const memoryCache = new Map();

// Default TTL in seconds
const DEFAULT_TTL = 300; // 5 minutes

/**
 * Set a value in the cache
 *
 * @param {string} key - The cache key
 * @param {any} value - The value to store
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} Success status
 */
export const setCache = async (key, value, ttl = DEFAULT_TTL) => {
  try {
    const expiryTime = Date.now() + (ttl * 1000);

    memoryCache.set(key, {
      value,
      expiry: expiryTime,
    });

    return true;
  } catch (error) {
    logger.error({
      message: 'Cache set error',
      key,
      error: error.message,
      stack: error.stack,
    });
    return false;
  }
};

/**
 * Get a value from the cache
 *
 * @param {string} key - The cache key
 * @returns {Promise<any>} The cached value or null if not found
 */
export const getCache = async (key) => {
  try {
    const item = memoryCache.get(key);

    // Check if item exists and is not expired
    if (item && item.expiry > Date.now()) {
      return item.value;
    }

    // Remove expired item
    if (item) {
      memoryCache.delete(key);
    }

    return null;
  } catch (error) {
    logger.error({
      message: 'Cache get error',
      key,
      error: error.message,
      stack: error.stack,
    });
    return null;
  }
};

/**
 * Delete a value from the cache
 *
 * @param {string} key - The cache key
 * @returns {Promise<boolean>} Success status
 */
export const deleteCache = async (key) => {
  try {
    memoryCache.delete(key);
    return true;
  } catch (error) {
    logger.error({
      message: 'Cache delete error',
      key,
      error: error.message,
      stack: error.stack,
    });
    return false;
  }
};

/**
 * Clear the entire cache
 *
 * @returns {Promise<boolean>} Success status
 */
export const clearCache = async () => {
  try {
    memoryCache.clear();
    return true;
  } catch (error) {
    logger.error({
      message: 'Cache clear error',
      error: error.message,
      stack: error.stack,
    });
    return false;
  }
};

/**
 * Set a value in the search cache
 * This is a specialized version of setCache for search-related operations
 *
 * @param {string} key - The cache key
 * @param {any} value - The value to store
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} Success status
 */
export const setSearchCache = async (key, value, ttl = DEFAULT_TTL) => setCache(`search:${key}`, value, ttl);

/**
 * Get a value from the search cache
 * This is a specialized version of getCache for search-related operations
 *
 * @param {string} key - The cache key
 * @returns {Promise<any>} The cached value or null if not found
 */
export const getSearchCache = async (key) => getCache(`search:${key}`);

/**
 * Delete a value from the search cache
 *
 * @param {string} key - The cache key
 * @returns {Promise<boolean>} Success status
 */
export const deleteSearchCache = async (key) => deleteCache(`search:${key}`);

/**
 * Clear all search-related cache entries
 *
 * @returns {Promise<boolean>} Success status
 */
export const clearSearchCache = async () => {
  try {
    // Delete all entries with keys that start with 'search:'
    for (const key of memoryCache.keys()) {
      if (key.startsWith('search:')) {
        memoryCache.delete(key);
      }
    }
    return true;
  } catch (error) {
    logger.error({
      message: 'Search cache clear error',
      error: error.message,
      stack: error.stack,
    });
    return false;
  }
};

// Cleanup expired cache entries periodically
const CLEANUP_INTERVAL = 15 * 60 * 1000; // 15 minutes

setInterval(() => {
  try {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, item] of memoryCache.entries()) {
      if (item.expiry <= now) {
        memoryCache.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      logger.debug(`Cache cleanup: removed ${expiredCount} expired items`);
    }
  } catch (error) {
    logger.error({
      message: 'Cache cleanup error',
      error: error.message,
      stack: error.stack,
    });
  }
}, CLEANUP_INTERVAL);
