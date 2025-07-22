import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';
import { connectWithOptimization, applyDatabaseOptimizations } from './database-optimization.js';
import { applyQueryMonitoring } from '../middleware/query-monitor.middleware.js';

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/karno';

// Enhanced connection configuration with optimizations
const connectionConfig = {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  heartbeatFrequencyMS: 10000,
  maxIdleTimeMS: 300000,
  retryWrites: true,
  retryReads: true,
  directConnection: false,
};

/**
 * Connect to MongoDB with optimizations
 */
export const connectDB = async () => {
  try {
    logger.info('Connecting to MongoDB with enhanced optimizations...');
    
    // Use the optimized connection function
    const connection = await connectWithOptimization(MONGODB_URI, connectionConfig);
    
    // Apply query monitoring to all models after connection
    setTimeout(() => {
      applyQueryMonitoring(mongoose.models);
      logger.info('Query monitoring applied to all models');
    }, 1000);
    
    logger.info('✅ MongoDB connected successfully with optimizations', {
      host: connection.host,
      port: connection.port,
      name: connection.name,
      poolSize: connectionConfig.maxPoolSize,
    });

    return connection;
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', {
      error: error.message,
      stack: error.stack,
    });
    
    // Exit process with failure
    process.exit(1);
  }
};

/**
 * Close database connection
 */
export const closeConnection = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error.message);
  }
};

/**
 * Setup database event listeners
 */
export const setupDatabaseEventListeners = () => {
  // Connection events
  mongoose.connection.on('connected', () => {
    logger.info('🔗 MongoDB connected');
  });

  mongoose.connection.on('error', (error) => {
    logger.error('🔴 MongoDB connection error:', error.message);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('🔌 MongoDB disconnected');
  });

  // Reconnection events
  mongoose.connection.on('reconnected', () => {
    logger.info('🔄 MongoDB reconnected');
  });

  mongoose.connection.on('close', () => {
    logger.info('📴 MongoDB connection closed');
  });

  // Performance monitoring events
  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_QUERY_MONITORING === 'true') {
    mongoose.connection.on('fullsetup', () => {
      logger.info('🚀 MongoDB connection pool fully established');
    });
  }
};

/**
 * Initialize database with optimizations
 */
export const initializeDatabase = async () => {
  // Setup event listeners first
  setupDatabaseEventListeners();
  
  // Connect with optimizations
  const connection = await connectDB();
  
  // Apply global optimizations
  applyDatabaseOptimizations();
  
  return connection;
};

export default {
  connectDB,
  closeConnection,
  setupDatabaseEventListeners,
  initializeDatabase,
};
