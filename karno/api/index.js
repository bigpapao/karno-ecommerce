// Vercel serverless function for API routes
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { connectDB } from '../backend/src/config/database.js';
import { errorHandler } from '../backend/src/middleware/error-handler.middleware.js';
import { logger } from '../backend/src/utils/logger.js';

// Import security middleware
import { securityMiddleware } from '../backend/src/middleware/security.middleware.js';
import { securityMonitorMiddleware } from '../backend/src/middleware/security-monitor.middleware.js';
import {
  standardLimiter,
  authLimiter,
  searchLimiter,
  sensitiveRoutesLimiter,
} from '../backend/src/middleware/rate-limit.middleware.js';

// Import recommendation monitoring middleware
import {
  trackRecommendationMetrics,
  anonymizeUserData,
} from '../backend/src/middleware/recommendation-monitoring.middleware.js';

// Import models to ensure they're registered
import '../backend/src/models/index.js';

// Import routes
import authRoutes from '../backend/src/routes/auth.routes.js';
import userRoutes from '../backend/src/routes/user.routes.js';
import productRoutes from '../backend/src/routes/product.routes.js';
import categoryRoutes from '../backend/src/routes/category.routes.js';
import brandRoutes from '../backend/src/routes/brand.routes.js';
import orderRoutes from '../backend/src/routes/order.routes.js';
import paymentRoutes from '../backend/src/routes/payment.routes.js';
import dashboardRoutes from '../backend/src/routes/dashboard.routes.js';
import adminRoutes from '../backend/src/routes/admin.routes.js';
import cartRoutes from '../backend/src/routes/cart.routes.js';
import addressRoutes from '../backend/src/routes/address.routes.js';
import sitemapRoutes from '../backend/src/routes/sitemap.routes.js';
import recommendationRoutes from '../backend/src/routes/recommendation.routes.js';
import analyticsRoutes from '../backend/src/routes/analytics.routes.js';
import recommendationMonitoringRoutes from '../backend/src/routes/recommendation-monitoring.routes.js';
import vehicleRoutes from '../backend/src/routes/vehicle.routes.js';

const app = express();

// Connect to MongoDB
try {
  await connectDB();
  logger.info('MongoDB connected successfully');
} catch (error) {
  logger.error({
    message: 'Failed to connect to MongoDB',
    error: error.message,
    stack: error.stack,
  });
}

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5000',
    'http://localhost:5001',
    'https://*.vercel.app',
    'https://*.netlify.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
  ],
}));

app.use(compression());
app.use(morgan('combined'));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(securityMiddleware);
app.use(securityMonitorMiddleware);

// Rate limiting
app.use('/api/auth', authLimiter);
app.use('/api/search', searchLimiter);
app.use('/api/admin', sensitiveRoutesLimiter);
app.use(standardLimiter);

// Recommendation monitoring
app.use(trackRecommendationMetrics);
app.use(anonymizeUserData);

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/brands', brandRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/addresses', addressRoutes);
app.use('/api/v1/sitemap', sitemapRoutes);
app.use('/api/v1/recommendations', recommendationRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/recommendation-monitoring', recommendationMonitoringRoutes);
app.use('/api/v1/vehicles', vehicleRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Karno API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Export the Express app for Vercel
export default app; 