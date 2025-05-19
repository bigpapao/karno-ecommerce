/**
 * Security Configuration
 * This file contains security-related settings for the application
 */

// Rate limiting configuration
export const rateLimitConfig = {
  // General API rate limit
  standard: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 200 requests per windowMs
    message: JSON.stringify({ status: 'error', message: 'Too many requests from this IP, please try again after 15 minutes' }),
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  },
  // More restrictive limit for authentication endpoints
  auth: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: process.env.NODE_ENV === 'development' ? 100 : 30, // Higher limit for development
    message: JSON.stringify({ status: 'error', message: 'Too many authentication attempts from this IP, please try again after an hour' }),
    standardHeaders: true,
    legacyHeaders: false,
  },
  // API rate limiting for external consumers
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: JSON.stringify({ status: 'error', message: 'API rate limit exceeded. Please upgrade your plan for higher limits.' }),
    standardHeaders: true,
    legacyHeaders: false,
  },
};

// CORS configuration
export const corsConfig = {
  development: {
    origin: true, // Allow all origins in development
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization,X-Requested-With,Origin,Accept',
    credentials: true,
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204,
  },
  production: {
    origin: process.env.CLIENT_URL,
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization,X-Requested-With,Origin,Accept',
    credentials: true,
    maxAge: 86400, // 24 hours
  },
};

// Content Security Policy configuration
export const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdn.jsdelivr.net'],
    imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    connectSrc: ["'self'", process.env.CLIENT_URL || 'http://localhost:3000'],
    frameSrc: ["'self'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
  },
};

// Cookie configuration
export const cookieConfig = {
  development: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  production: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
};

// Password policy
export const passwordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
  preventReuse: 5, // Prevent reuse of last 5 passwords
};

// Account lockout policy
export const accountLockoutPolicy = {
  maxAttempts: 5,
  lockoutDuration: 30 * 60 * 1000, // 30 minutes
  resetAttemptsAfter: 60 * 60 * 1000, // 1 hour
};

// JWT configuration
export const jwtConfig = {
  accessTokenExpiry: process.env.JWT_EXPIRES_IN || '1d',
  refreshTokenExpiry: '7d',
  cookieExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// XSS prevention configuration
export const xssConfig = {
  whiteList: {}, // Use default whitelist
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script'],
};

// Security headers
export const securityHeaders = {
  'X-XSS-Protection': '1; mode=block',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'same-origin',
};
