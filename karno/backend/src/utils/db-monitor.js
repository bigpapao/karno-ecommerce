import mongoose from 'mongoose';
import { logger } from './logger.js';

// Enable query logging in development
if (process.env.NODE_ENV === 'development') {
  mongoose.set('debug', (collectionName, method, query, doc) => {
    logger.debug({
      message: 'MongoDB Query',
      collection: collectionName,
      method,
      query,
      doc,
    });
  });
}

// Monitor slow queries
const SLOW_QUERY_THRESHOLD = 100; // milliseconds

mongoose.set('debug', (collectionName, method, query, doc, options) => {
  const start = Date.now();

  return () => {
    const duration = Date.now() - start;

    if (duration > SLOW_QUERY_THRESHOLD) {
      logger.warn({
        message: 'Slow MongoDB Query',
        collection: collectionName,
        method,
        query,
        duration,
        threshold: SLOW_QUERY_THRESHOLD,
      });
    }
  };
});

// Monitor connection pool
const monitorConnectionPool = () => {
  const { connection } = mongoose;

  connection.on('connected', () => {
    logger.info({
      message: 'MongoDB Connected',
      host: connection.host,
      port: connection.port,
      name: connection.name,
    });
  });

  connection.on('disconnected', () => {
    logger.warn('MongoDB Disconnected');
  });

  connection.on('error', (err) => {
    logger.error({
      message: 'MongoDB Connection Error',
      error: err.message,
      stack: err.stack,
    });
  });

  // Monitor pool size
  setInterval(() => {
    try {
      const poolStats = connection.client?.topology?.s?.pool;
      if (poolStats) {
        logger.debug({
          message: 'MongoDB Connection Pool Stats',
          totalConnections: poolStats.totalConnectionCount,
          availableConnections: poolStats.availableConnectionCount,
          pendingConnections: poolStats.pendingConnectionCount,
          maxPoolSize: poolStats.maxPoolSize,
        });
      }
    } catch (error) {
      // Silently ignore pool monitoring errors
    }
  }, 60000); // Log every minute
};

// Export monitoring functions
export const startMonitoring = () => {
  monitorConnectionPool();
};

export default {
  startMonitoring,
};
