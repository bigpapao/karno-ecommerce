import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/database.js';
import { errorHandler } from './middleware/error-handler.middleware.js';
// app.use(errorHandler);
import { logger, logAPIRequest } from './utils/logger.js';


// Import custom security middleware
import { securityMiddleware } from './middleware/security.middleware.js';
import { securityMonitorMiddleware, securityMonitorAPI } from './middleware/security-monitor.middleware.js';
import {
  standardLimiter,
  authLimiter,
  searchLimiter,
  sensitiveRoutesLimiter,
} from './middleware/rate-limit.middleware.js';

// Import recommendation monitoring middleware
import {
  trackRecommendationMetrics,
  anonymizeUserData,
} from './middleware/recommendation-monitoring.middleware.js';

// Import models to ensure they're registered
import './models/index.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import productRoutes from './routes/product.routes.js';
import categoryRoutes from './routes/category.routes.js';
import brandRoutes from './routes/brand.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import adminRoutes from './routes/admin.routes.js';
import cartRoutes from './routes/cart.routes.js';
import addressRoutes from './routes/address.routes.js';
import sitemapRoutes from './routes/sitemap.routes.js';
import recommendationRoutes from './routes/recommendation.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import recommendationMonitoringRoutes from './routes/recommendation-monitoring.routes.js';
import vehicleRoutes from './routes/vehicle.routes.js';

const app = express();
const PORT = process.env.PORT || 8080;

// Connect to MongoDB
try {
  await connectDB();
  logger.info('MongoDB connected successfully');

  // Skip external index creation - models already define their own indexes
  logger.info('Database indexes are managed by model schemas');
} catch (error) {
  logger.error({
    message: 'Failed to connect to MongoDB',
    error: error.message,
    stack: error.stack,
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
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    `http://localhost:${PORT}`,
    'http://localhost:5001',
    'https://karno-ecommerce.vercel.app',
    'https://*.vercel.app',
    'https://*.onrender.com',
    'https://*.railway.app',
    'https://*.fly.dev',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
  ], // Removed X-XSRF-TOKEN and X-CSRF-TOKEN
}));

// Apply security middleware stack
app.use(...securityMiddleware());

app.use(compression());

// Use morgan for HTTP request logging, integrated with our logger
app.use(morgan('combined', { stream: logger.stream }));

// Add our custom request logger middleware for all routes
app.use(logAPIRequest);

// Add security monitoring
try {
  app.use(securityMonitorMiddleware());
} catch (e) {
  logger.warn('Security monitor middleware failed to load:', e.message);
}

try {
  app.use(securityMonitorAPI());
} catch (e) {
  logger.warn('Security monitor API failed to load:', e.message);
}

// Apply rate limiting with custom middleware
app.use(standardLimiter);

// Apply specific rate limiters to routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter); // Consider removing if not used
app.use('/api/auth/reset-password', authLimiter); // Consider removing if not used
app.use('/api/products/search', searchLimiter);

// Apply JSON request parsing with reduced limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Apply recommendation monitoring middleware to relevant routes only
app.use(['/api/recommendations', '/api/recommendation-monitoring'], trackRecommendationMetrics);
app.use('/api/recommendations/train', anonymizeUserData);

// ES Module __dirname setup
const currentFileUrl = import.meta.url;
const currentDirPath = path.dirname(fileURLToPath(currentFileUrl));

// Special handling for uploaded images with proper CORS
app.use('/uploads', (req, res, next) => {
  // Set CORS headers specifically for uploaded files
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(currentDirPath, 'public/uploads')));

// Serve static files from the 'public' directory
app.use(express.static(path.join(currentDirPath, 'public')));

// API Routes with versioning
const apiV1Router = express.Router();

// Apply rate limiting to sensitive endpoints (some might be duplicates from above, ensure correct placement)
// Note: /api/v1/auth/login and /api/v1/auth/register are already covered if using apiV1Router prefix.
apiV1Router.use('/auth/login', authLimiter); // This will be /api/v1/auth/login
apiV1Router.use('/auth/register', authLimiter); // This will be /api/v1/auth/register
apiV1Router.use('/products/search', searchLimiter);
apiV1Router.use('/admin', sensitiveRoutesLimiter);

// Mount routes to versioned router
apiV1Router.use('/auth', authRoutes);
apiV1Router.use('/users', userRoutes);
apiV1Router.use('/products', productRoutes);
apiV1Router.use('/categories', categoryRoutes);
apiV1Router.use('/brands', brandRoutes);
apiV1Router.use('/orders', orderRoutes);
apiV1Router.use('/payments', paymentRoutes);
apiV1Router.use('/dashboard', dashboardRoutes);
apiV1Router.use('/admin', adminRoutes);
apiV1Router.use('/cart', cartRoutes);
apiV1Router.use('/addresses', addressRoutes);
apiV1Router.use('/sitemap', sitemapRoutes);
apiV1Router.use('/recommendations', recommendationRoutes);
apiV1Router.use('/recommendation-monitoring', recommendationMonitoringRoutes);
apiV1Router.use('/analytics', analyticsRoutes);
apiV1Router.use('/vehicles', vehicleRoutes);

// Mount versioned API router
app.use('/api/v1', apiV1Router);

// Health check endpoint for Cloud Run
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// 404 handler
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
  });
};

// Handle 404 errors
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server with better error handling
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server is running on port ${PORT}`);
  console.log(`Server is running on port ${PORT}`);
});

// Handle server errors
server.on('error', (error) => {
  logger.error('Server error:', error);
  console.error('Server error:', error);
  process.exit(1);
});
