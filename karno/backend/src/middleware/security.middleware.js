/**
 * Security Headers Middleware
 *
 * This middleware applies various security headers to all responses
 * to enhance the application's security posture.
 */

import helmet from 'helmet';
import hpp from 'hpp';
import xss from 'xss-clean';
import mongoSanitize from 'express-mongo-sanitize';
import { cspConfig, securityHeaders } from '../config/security.js';
import { logger } from '../utils/logger.js';

/**
 * Apply Helmet middleware with CSP configuration
 * @returns {Function} Express middleware
 */
export const helmetMiddleware = () => (req, res, next) => {
  // Apply helmet with base configuration
  helmet()(req, res, next);
};

/**
 * Apply Content Security Policy (CSP)
 * @returns {Function} Express middleware
 */
export const contentSecurityPolicy = () => (req, res, next) => {
  // Apply CSP with configuration from security.js
  helmet.contentSecurityPolicy(cspConfig)(req, res, next);
};

/**
 * Apply HTTP Strict Transport Security (HSTS)
 * @returns {Function} Express middleware
 */
export const strictTransportSecurity = () => (req, res, next) => {
  // Apply HSTS
  helmet.hsts({
    maxAge: 15552000, // 180 days in seconds
    includeSubDomains: true,
    preload: true,
  })(req, res, next);
};

/**
 * Apply additional security headers
 * @returns {Function} Express middleware
 */
export const addSecurityHeaders = () => (req, res, next) => {
  // Apply additional security headers from config
  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Set Feature Policy header (now Permissions Policy)
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  );

  // Add Cross-Origin headers for better protection
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

  next();
};

/**
 * Prevent parameter pollution
 * @param {Array} whitelist - Array of parameters to whitelist
 * @returns {Function} Express middleware
 */
export const preventParameterPollution = (whitelist = []) => hpp({
  whitelist: ['price', 'rating', 'category', 'brand', ...whitelist],
});

/**
 * Sanitize data to prevent NoSQL injection
 * @returns {Function} Express middleware
 */
export const sanitizeData = () => mongoSanitize();

/**
 * Prevent XSS attacks
 * @returns {Function} Express middleware
 */
export const preventXSS = () => xss();

/**
 * Validate and sanitize request bodies
 * @returns {Function} Express middleware
 */
export const sanitizeRequestBody = () => (req, res, next) => {
  // Sanitize request body fields
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === 'string') {
        // Basic sanitization - remove script tags and other potentially dangerous content
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/\bon\w+\s*=/gi, '');
      }
    });
  }

  next();
};

/**
 * HTTPS enforcement middleware for production
 * @returns {Function} Express middleware
 */
export const enforceHTTPS = () => (req, res, next) => {
  // Only enforce HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
  }
  next();
};

/**
 * Combine all security middlewares into a single stack
 * @param {Object} options - Configuration options
 * @returns {Array} Array of middleware functions
 */
export const securityMiddleware = (options = {}) => {
  // Create an array of middleware functions
  const middleware = [
    enforceHTTPS(),
    helmetMiddleware(),
    contentSecurityPolicy(),
    strictTransportSecurity(),
    addSecurityHeaders(),
    preventParameterPollution(options.paramWhitelist),
    sanitizeData(),
    preventXSS(),
    sanitizeRequestBody(),
  ];

  return middleware;
};

export default {
  helmetMiddleware,
  contentSecurityPolicy,
  strictTransportSecurity,
  addSecurityHeaders,
  preventParameterPollution,
  sanitizeData,
  preventXSS,
  sanitizeRequestBody,
  enforceHTTPS,
  securityMiddleware,
};
