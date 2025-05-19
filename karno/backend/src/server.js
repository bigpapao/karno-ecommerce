import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import {
  rateLimitConfig, corsConfig, cspConfig, securityHeaders,
} from './config/security.js';
import { connectDB } from './config/database.js';
import { errorHandler, AppError } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import { createAllIndexes } from './utils/database-indexes.js';

// Import custom security middleware
import { securityMiddleware } from './middleware/security.middleware.js';
import { csrfProtection, csrfExclude, setCSRFToken } from './middleware/csrf.middleware.js';
import { securityMonitorMiddleware, securityMonitorAPI } from './middleware/security-monitor.middleware.js';
import { 
  standardLimiter, 
  authLimiter, 
  apiLimiter,
  searchLimiter,
  sensitiveRoutesLimiter
} from './middleware/rateLimit.middleware.js';

// Import models to ensure they're registered
import './models/index.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import productRoutes from './routes/product.routes.enhanced.js';
import categoryRoutes from './routes/category.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import adminRoutes from './routes/admin.routes.js';
import cartRoutes from './routes/cart.routes.js';
import addressRoutes from './routes/address.routes.js';
import sitemapRoutes from './routes/sitemap.routes.js';

const app = express();
const port = process.env.PORT || 5000;

// Connect to MongoDB
try {
  await connectDB();
  logger.info('MongoDB connected successfully');
  
  // Create database indexes (if not already present)
  if (process.env.CREATE_INDEXES_ON_STARTUP !== 'false') {
    try {
      const result = await createAllIndexes();
      if (result.success) {
        logger.info('Database indexes initialized successfully');
      } else {
        logger.warn(`Database indexes initialization skipped or failed: ${result.error}`);
      }
    } catch (indexError) {
      logger.error({
        message: 'Error initializing database indexes',
        error: indexError.message,
        stack: indexError.stack
      });
      // Continue without indexes - they can be created later with the script
    }
  }
} catch (error) {
  logger.error({
    message: 'Failed to connect to MongoDB',
    error: error.message,
    stack: error.stack
  });
  // Continue running the server even if database connection fails
  // This allows us to test the security features without a database
}

// Middleware
// HTTPS redirection in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// CORS configuration for frontend
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-XSRF-TOKEN', 'X-CSRF-TOKEN'],
}));

// Apply security middleware stack
app.use(...securityMiddleware());

// Configure and use sessions with MongoDB store
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-super-secure-session-secret',
  name: 'karno.sid', // Custom cookie name, not using the default "connect.sid"
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Ensure cookies are only used over HTTPS in production
    httpOnly: true, // Prevent client-side JS from reading the cookie
    maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days in milliseconds
    sameSite: 'lax', // Controls when cookies are sent with cross-site requests
  },
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/',
    touchAfter: 24 * 60 * 60, // Time in seconds between session updates (24 hours)
    crypto: {
      secret: process.env.SESSION_CRYPTO_SECRET || 'session-crypto-secret',
    },
    ttl: 14 * 24 * 60 * 60, // 14 days in seconds
  }),
};

// Only use secure cookies in production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // Trust first proxy
  sessionConfig.cookie.secure = true; // Serve cookies over HTTPS only
}

// Initialize session middleware
app.use(session(sessionConfig));

app.use(compression());

// Use morgan for HTTP request logging, integrated with our logger
app.use(morgan('combined', { stream: logger.stream }));

// Add our custom request logger middleware for all routes
app.use(logger.logAPIRequest);

// Add security monitoring
app.use(securityMonitorMiddleware());
app.use(securityMonitorAPI());

// Apply rate limiting with custom middleware
app.use(standardLimiter);

// Apply specific rate limiters to routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/products/search', searchLimiter);

// Apply JSON request parsing with reduced limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Apply CSRF protection with excluded paths
app.use(csrfExclude([
  '/api/auth/login',        // Login route
  '/api/auth/register',     // Registration route
  '/api/auth/google-login', // OAuth routes
  '/api/payments/webhook',  // Payment webhooks
  /\/api\/public\/.*/,      // Public API routes (regex)
]));

// Set CSRF token for all GET requests
app.use(setCSRFToken);

// ES Module __dirname setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/sitemap', sitemapRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Handle undefined routes - 404
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404, 'ERR_NOT_FOUND'));
});

// Global error handling middleware - Must be last!
app.use(errorHandler);

// Graceful error handling for uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err) => {
  logger.error({
    message: 'UNCAUGHT EXCEPTION! 💥 Shutting down...',
    error: err.message,
    stack: err.stack
  });
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err);
  // Exit with error code 1
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error({
    message: 'UNHANDLED REJECTION! 💥 Shutting down...',
    error: err.message,
    stack: err.stack
  });
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err);
  // Close server gracefully
  server.close(() => {
    // Exit with error code 1
    process.exit(1);
  });
});

// Start server
let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(port, () => {
    logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${port}`);
  });
}

export default app;
