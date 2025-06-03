/**
 * Rate Limiting Middleware
 *
 * This middleware provides enhanced rate limiting capabilities with multiple strategies
 * and configurable options for different routes.
 */

import rateLimit from 'express-rate-limit';
import { rateLimitConfig } from '../config/security.js';
import { logger } from '../utils/logger.js';
import { AppError } from './error-handler.middleware.js';

// Store keyGenerator functions for different rate limiting strategies
const keyGenerators = {
  // Default strategy based on IP address
  ip: (req) => req.ip,

  // Rate limiting by user ID (requires authentication)
  user: (req) => (req.user ? req.user._id : req.ip),

  // Combined strategy using both IP and user ID
  combined: (req) => {
    const userId = req.user ? req.user._id : 'anonymous';
    return `${req.ip}-${userId}`;
  },

  // API key based rate limiting
  apiKey: (req) => {
    const apiKey = req.get('X-API-Key') || 'anonymous';
    return apiKey;
  },
};

/**
 * Create a customized rate limiter middleware
 *
 * @param {Object} options - Rate limiter options
 * @param {string} [options.type='standard'] - Limiter type (standard, auth, api)
 * @param {string} [options.strategy='ip'] - Rate limiting strategy (ip, user, combined, apiKey)
 * @param {number} [options.windowMs] - Time window in milliseconds
 * @param {number} [options.max] - Maximum number of requests in the time window
 * @param {string} [options.message] - Error message when limit is reached
 * @param {string} [options.errorCode] - Error code to include in the response
 * @returns {Function} Express middleware
 */
export const createRateLimiter = (options = {}) => {
  // Get base config from the predefined types or use standard as default
  const baseConfig = rateLimitConfig[options.type] || rateLimitConfig.standard;

  // Merge base config with provided options
  const config = {
    ...baseConfig,
    ...options,
  };

  // Select the key generator based on strategy
  const keyGenerator = keyGenerators[options.strategy] || keyGenerators.ip;

  // Format the error message
  const errorMessage = JSON.stringify({
    status: 'error',
    error: {
      message: config.message || 'Too many requests, please try again later',
      code: config.errorCode || 'ERR_RATE_LIMIT',
      timestamp: new Date().toISOString(),
    },
  });

  // Create and return the rate limiter middleware
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: errorMessage,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,

    // Skip rate limiting in development mode if configured
    skip: (req) => (
      process.env.NODE_ENV === 'development' && process.env.SKIP_RATE_LIMIT === 'true'
    ),

    // Handler to execute when the limit is reached
    handler: (req, res, next, options) => {
      // Log rate limit hit
      logger.warn({
        message: 'Rate limit exceeded',
        ip: req.ip,
        userId: req.user ? req.user._id : 'anonymous',
        path: req.originalUrl,
        method: req.method,
        headers: req.headers,
      });

      // Send the response
      res.status(429).json({
        status: 'error',
        error: {
          message: config.message || 'Too many requests, please try again later',
          code: config.errorCode || 'ERR_RATE_LIMIT',
          timestamp: new Date().toISOString(),
        },
      });
    },
  });
};

// Pre-configured rate limiters
export const standardLimiter = createRateLimiter({
  type: 'standard',
  strategy: 'ip',
  errorCode: 'ERR_RATE_LIMIT_STANDARD',
});

export const authLimiter = createRateLimiter({
  type: 'auth',
  strategy: 'combined',
  errorCode: 'ERR_RATE_LIMIT_AUTH',
});

export const apiLimiter = createRateLimiter({
  type: 'api',
  strategy: 'apiKey',
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'API rate limit exceeded. Please upgrade your plan for higher limits.',
  errorCode: 'ERR_RATE_LIMIT_API',
});

// Create specialized limiters for different routes
export const sensitiveRoutesLimiter = createRateLimiter({
  strategy: 'combined',
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per 15 minutes
  message: 'Too many sensitive operations. Please try again later.',
  errorCode: 'ERR_RATE_LIMIT_SENSITIVE',
});

export const searchLimiter = createRateLimiter({
  strategy: 'ip',
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 search requests per minute
  message: 'Search rate limit exceeded. Please try again later.',
  errorCode: 'ERR_RATE_LIMIT_SEARCH',
});

// Middleware to apply dynamic rate limiting based on user role
export const dynamicRateLimiter = (req, res, next) => {
  // Apply different limits based on user role
  if (req.user && req.user.role === 'admin') {
    // Higher limits for admins
    createRateLimiter({
      max: 1000,
      windowMs: 15 * 60 * 1000,
    })(req, res, next);
  } else if (req.user && req.user.role === 'premium') {
    // Higher limits for premium users
    createRateLimiter({
      max: 300,
      windowMs: 15 * 60 * 1000,
    })(req, res, next);
  } else {
    // Standard limits for regular users
    standardLimiter(req, res, next);
  }
};

export default {
  createRateLimiter,
  standardLimiter,
  authLimiter,
  apiLimiter,
  sensitiveRoutesLimiter,
  searchLimiter,
  dynamicRateLimiter,
};
