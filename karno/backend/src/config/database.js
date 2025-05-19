import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

/**
 * Connect to MongoDB with optimized connection settings
 * 
 * These settings are configured for optimal performance in production environments.
 * - maxPoolSize: Controls the maximum number of connections in the MongoDB connection pool
 * - minPoolSize: Sets the minimum number of connections maintained in the connection pool
 * - socketTimeoutMS: How long the driver will wait for a socket operation to complete
 * - connectTimeoutMS: How long the driver will wait for initial connection
 * - serverSelectionTimeoutMS: How long to wait for server selection
 * - heartbeatFrequencyMS: Controls frequency of ismaster operations to check server state
 * - retryWrites: Automatically retry write operations on network errors
 * - w: Write concern level
 * - readPreference: Preferred read operations distribution
 * 
 * @returns {Promise<mongoose.Connection>} Mongoose connection object
 */
export const connectDB = async () => {
  try {
    // Default connection options
    const connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 100,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 15000,
      heartbeatFrequencyMS: 10000,
    };
    
    // Use different settings for development vs production
    if (process.env.NODE_ENV === 'production') {
      // Optimized for production environments
      Object.assign(connectionOptions, {
        maxPoolSize: 100,
        minPoolSize: 10,
        readPreference: 'secondaryPreferred',
      });
    } else {
      // Development settings
      Object.assign(connectionOptions, {
        maxPoolSize: 10,
        minPoolSize: 2,
      });
    }

    // Connect to MongoDB with optimized options
    const conn = await mongoose.connect(process.env.MONGO_URI, connectionOptions);

    logger.info({
      message: `MongoDB Connected: ${conn.connection.host}`,
      environment: process.env.NODE_ENV,
      mongoVersion: conn.version,
    });
    
    return conn;
  } catch (error) {
    logger.error({
      message: 'MongoDB connection error',
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Close MongoDB connection gracefully
 * 
 * @returns {Promise<void>}
 */
export const closeConnection = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed successfully');
  } catch (error) {
    logger.error({
      message: 'Error closing MongoDB connection',
      error: error.message,
      stack: error.stack
    });
  }
};

export default { connectDB, closeConnection };
