/**
 * Security Monitoring Middleware
 * 
 * This middleware monitors and logs security-related events and detects potential attacks.
 * It implements basic intrusion detection features by identifying suspicious requests.
 */

import { logger } from '../utils/logger.js';

// Constants for detection thresholds
const FAILED_LOGIN_THRESHOLD = 5; // Number of failed logins before alerting
const REQUEST_RATE_THRESHOLD = 100; // Number of requests in monitoring window
const MONITORING_WINDOW_MS = 60 * 1000; // 1 minute monitoring window

// In-memory storage for security monitoring
// In a production environment, this should be replaced with Redis or another distributed storage
const securityStore = {
  failedLogins: {}, // IP -> count
  requestCounts: {}, // IP -> count
  lastReset: Date.now(),
  suspicious: new Set(), // Set of suspicious IPs
  blockedIPs: new Set(), // Set of blocked IPs
  securityEvents: [], // Array of recent security events
};

/**
 * Reset counters periodically
 */
const resetCounters = () => {
  const now = Date.now();
  if (now - securityStore.lastReset > MONITORING_WINDOW_MS) {
    securityStore.failedLogins = {};
    securityStore.requestCounts = {};
    securityStore.lastReset = now;
  }
};

/**
 * Check if a request pattern matches known attack signatures
 * @param {Object} req - Express request object
 * @returns {Boolean} True if suspicious, false otherwise
 */
const checkRequestSignatures = (req) => {
  // Check for SQL injection attempts
  const sqlInjectionPatterns = [
    /'\s*OR\s*['"]?[0-9a-zA-Z]+(=|<>|!=)['"]?[0-9a-zA-Z]+/i,
    /;\s*DROP\s+TABLE/i,
    /--\s+/,
    /'\s*OR\s*1\s*=\s*1/i,
    /'\s*OR\s*'1'\s*=\s*'1/i,
    /UNION\s+ALL\s+SELECT/i,
  ];

  // Check for XSS attempts
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i,
    /javascript:/i,
    /onerror\s*=/i,
    /onload\s*=/i,
    /onclick\s*=/i,
    /onmouseover\s*=/i,
    /eval\s*\(/i,
  ];

  // Check for path traversal attempts
  const pathTraversalPatterns = [
    /\.\.\//,
    /\.\.\\/, 
    /etc\/passwd/i,
    /\/etc\/shadow/i,
    /\/proc\/self\/environ/i,
    /\/windows\/win.ini/i,
  ];

  // Check for suspicious parameters in query or body
  const params = { ...req.query, ...req.body, ...req.params };
  
  for (const param of Object.values(params)) {
    if (typeof param !== 'string') continue;
    
    // Check against SQL injection patterns
    if (sqlInjectionPatterns.some(pattern => pattern.test(param))) {
      logSecurityEvent(req, 'SQL Injection', param);
      return true;
    }
    
    // Check against XSS patterns
    if (xssPatterns.some(pattern => pattern.test(param))) {
      logSecurityEvent(req, 'XSS', param);
      return true;
    }
    
    // Check against path traversal patterns
    if (pathTraversalPatterns.some(pattern => pattern.test(param))) {
      logSecurityEvent(req, 'Path Traversal', param);
      return true;
    }
  }
  
  return false;
};

/**
 * Log a security event
 * @param {Object} req - Express request object
 * @param {String} type - Type of security event
 * @param {String} details - Additional details about the event
 */
const logSecurityEvent = (req, type, details = '') => {
  const event = {
    timestamp: new Date().toISOString(),
    type,
    ip: req.ip,
    userId: req.user?._id || 'anonymous',
    method: req.method,
    path: req.originalUrl,
    userAgent: req.get('user-agent'),
    details: details.substring(0, 100), // Truncate long details
  };
  
  // Log the event
  logger.warn({
    message: `Security event: ${type}`,
    ...event,
  });
  
  // Add to recent events (keep the last 100 events)
  securityStore.securityEvents.unshift(event);
  if (securityStore.securityEvents.length > 100) {
    securityStore.securityEvents.pop();
  }
  
  // Mark the IP as suspicious
  securityStore.suspicious.add(req.ip);
  
  // Emit event for real-time notification (when implemented)
  // This could connect to a WebSocket or similar for real-time admin alerts
};

/**
 * Record a failed login attempt
 * @param {String} ip - IP address
 * @param {String} username - Attempted username
 */
export const recordFailedLogin = (ip, username) => {
  resetCounters();
  
  // Increment failed login count
  securityStore.failedLogins[ip] = (securityStore.failedLogins[ip] || 0) + 1;
  
  // Check if threshold exceeded
  if (securityStore.failedLogins[ip] >= FAILED_LOGIN_THRESHOLD) {
    logger.warn({
      message: 'Multiple failed login attempts detected',
      ip,
      attemptedUsername: username,
      count: securityStore.failedLogins[ip],
    });
    
    // Mark as suspicious
    securityStore.suspicious.add(ip);
    
    // Log security event
    const event = {
      timestamp: new Date().toISOString(),
      type: 'Multiple Failed Logins',
      ip,
      details: `${securityStore.failedLogins[ip]} failed attempts for user ${username}`,
    };
    
    securityStore.securityEvents.unshift(event);
    if (securityStore.securityEvents.length > 100) {
      securityStore.securityEvents.pop();
    }
  }
};

/**
 * Record a successful login to reset failed login counter
 * @param {String} ip - IP address
 */
export const recordSuccessfulLogin = (ip) => {
  // Reset failed login count
  securityStore.failedLogins[ip] = 0;
};

/**
 * Get recent security events for monitoring
 * @param {Number} limit - Maximum number of events to return
 * @returns {Array} Array of security events
 */
export const getSecurityEvents = (limit = 100) => {
  return securityStore.securityEvents.slice(0, limit);
};

/**
 * Get list of suspicious IPs
 * @returns {Array} Array of suspicious IP addresses
 */
export const getSuspiciousIPs = () => {
  return Array.from(securityStore.suspicious);
};

/**
 * Block an IP address
 * @param {String} ip - IP address to block
 */
export const blockIP = (ip) => {
  securityStore.blockedIPs.add(ip);
  logger.warn({
    message: 'IP address blocked',
    ip,
  });
  
  // Log security event
  const event = {
    timestamp: new Date().toISOString(),
    type: 'IP Blocked',
    ip,
    details: 'IP address manually blocked by admin',
  };
  
  securityStore.securityEvents.unshift(event);
};

/**
 * Unblock an IP address
 * @param {String} ip - IP address to unblock
 */
export const unblockIP = (ip) => {
  securityStore.blockedIPs.delete(ip);
  logger.info({
    message: 'IP address unblocked',
    ip,
  });
};

/**
 * Clear suspicious IP list
 */
export const clearSuspiciousIPs = () => {
  securityStore.suspicious.clear();
  logger.info('Suspicious IP list cleared');
};

/**
 * Express middleware for security monitoring
 * @returns {Function} Express middleware
 */
export const securityMonitorMiddleware = () => {
  return (req, res, next) => {
    resetCounters();
    
    // Check if IP is blocked
    if (securityStore.blockedIPs.has(req.ip)) {
      logger.warn({
        message: 'Blocked IP attempted access',
        ip: req.ip,
        path: req.originalUrl,
      });
      
      return res.status(403).json({
        status: 'error',
        error: {
          message: 'Access denied',
          code: 'ERR_ACCESS_DENIED',
        }
      });
    }
    
    // Increment request count
    securityStore.requestCounts[req.ip] = (securityStore.requestCounts[req.ip] || 0) + 1;
    
    // Check for high request rate
    if (securityStore.requestCounts[req.ip] > REQUEST_RATE_THRESHOLD) {
      logSecurityEvent(req, 'High Request Rate', `${securityStore.requestCounts[req.ip]} requests in monitoring window`);
    }
    
    // Check for suspicious request patterns
    if (checkRequestSignatures(req)) {
      // If suspicious pattern detected, checkRequestSignatures will log it
      
      // Extra logging for highly suspicious requests
      if (securityStore.suspicious.has(req.ip)) {
        logger.warn({
          message: 'Repeated suspicious activity from IP',
          ip: req.ip,
          path: req.originalUrl,
          method: req.method,
        });
      }
    }
    
    // Continue processing the request
    next();
  };
};

/**
 * Add security monitoring API to request object
 * @returns {Function} Express middleware
 */
export const securityMonitorAPI = () => {
  return (req, res, next) => {
    // Add security monitoring methods to request
    req.security = {
      recordFailedLogin,
      recordSuccessfulLogin,
      getSecurityEvents,
      getSuspiciousIPs,
      blockIP,
      unblockIP,
      clearSuspiciousIPs,
    };
    
    next();
  };
};

export default {
  securityMonitorMiddleware,
  securityMonitorAPI,
  recordFailedLogin,
  recordSuccessfulLogin,
  getSecurityEvents,
  getSuspiciousIPs,
  blockIP,
  unblockIP,
  clearSuspiciousIPs,
};