/**
 * CSRF Protection Middleware
 * 
 * Implements CSRF (Cross-Site Request Forgery) protection using double submit cookie pattern.
 * This middleware generates and validates CSRF tokens for all state-changing requests.
 */

import crypto from 'crypto';
import { logger } from '../utils/logger.js';
import { AppError } from './errorHandler.js';

// Token length and cookie name constants
const TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';

/**
 * Generate a cryptographically secure random CSRF token
 * @returns {string} CSRF token string
 */
export const generateToken = () => {
  try {
    return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
  } catch (error) {
    logger.error('Failed to generate CSRF token', error);
    // Fallback implementation in case randomBytes fails
    return crypto
      .createHash('sha256')
      .update(crypto.randomBytes(16))
      .update(Date.now().toString())
      .digest('hex');
  }
};

/**
 * Set the CSRF token cookie and add the token to res.locals for templates
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const setCSRFCookie = (req, res) => {
  // Generate a new CSRF token
  const csrfToken = generateToken();
  
  // Determine cookie settings based on environment
  const secure = process.env.NODE_ENV === 'production';
  const sameSite = process.env.NODE_ENV === 'production' ? 'strict' : 'lax';
  
  // Set the CSRF token cookie
  res.cookie(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false, // Must be accessible to client-side JavaScript for headers
    secure,
    sameSite,
    path: '/',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });
  
  // Make token available to templates
  res.locals.csrfToken = csrfToken;
  
  return csrfToken;
};

/**
 * Middleware to handle CSRF tokens for all routes
 * 
 * @returns {Function} Express middleware
 */
export const csrfProtection = () => {
  return (req, res, next) => {
    // Only apply CSRF protection to state-changing methods
    const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    
    if (!stateChangingMethods.includes(req.method)) {
      // For non-state-changing methods, set a new CSRF token and continue
      if (!req.cookies[CSRF_COOKIE_NAME]) {
        setCSRFCookie(req, res);
      }
      return next();
    }
    
    // For state-changing requests, validate the token
    const cookieToken = req.cookies[CSRF_COOKIE_NAME];
    
    // Get token from header or form body
    const headerToken = req.headers[CSRF_HEADER_NAME.toLowerCase()] || 
                        req.headers['x-csrf-token'] || 
                        req.body._csrf;
    
    // If no token in the request, respond with an error
    if (!cookieToken || !headerToken) {
      logger.warn({
        message: 'CSRF token missing',
        ip: req.ip,
        path: req.originalUrl,
        method: req.method,
        hasHeaderToken: !!headerToken,
        hasCookieToken: !!cookieToken,
      });
      
      return next(new AppError('CSRF token missing or invalid', 403, 'ERR_CSRF_MISSING'));
    }
    
    // Compare the tokens using a timing-safe comparison
    if (!crypto.timingSafeEqual(
      Buffer.from(cookieToken), 
      Buffer.from(headerToken)
    )) {
      logger.warn({
        message: 'CSRF token invalid',
        ip: req.ip,
        path: req.originalUrl,
        method: req.method,
      });
      
      return next(new AppError('CSRF token missing or invalid', 403, 'ERR_CSRF_INVALID'));
    }
    
    // If validation passes, set a new token for the next request and continue
    setCSRFCookie(req, res);
    next();
  };
};

/**
 * Express middleware that only sets the CSRF token without validation
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const setCSRFToken = (req, res, next) => {
  if (!req.cookies[CSRF_COOKIE_NAME]) {
    setCSRFCookie(req, res);
  }
  next();
};

/**
 * Middleware to exclude specific paths from CSRF protection
 * 
 * @param {Array} excludePaths - Array of paths to exclude from CSRF protection
 * @returns {Function} Express middleware
 */
export const csrfExclude = (excludePaths = []) => {
  const csrfMiddleware = csrfProtection();
  
  return (req, res, next) => {
    // Check if the current path should be excluded
    if (excludePaths.some(path => 
      (typeof path === 'string' && req.path.startsWith(path)) ||
      (path instanceof RegExp && path.test(req.path))
    )) {
      return next();
    }
    
    // Apply CSRF protection to non-excluded paths
    return csrfMiddleware(req, res, next);
  };
};

export default {
  generateToken,
  setCSRFCookie,
  csrfProtection,
  setCSRFToken,
  csrfExclude
}; 