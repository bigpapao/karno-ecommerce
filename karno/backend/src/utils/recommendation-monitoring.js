import mongoose from 'mongoose';
import crypto from 'crypto';
import { logger } from './logger.js';

/**
 * Utility class for monitoring recommendation system performance and
 * managing data privacy
 */
class RecommendationMonitoring {
  /**
   * Initialize monitoring metrics
   */
  constructor() {
    this.metrics = {
      apiCalls: {
        total: 0,
        byEndpoint: {},
        errors: 0,
      },
      latency: {
        values: [],
        average: 0,
        max: 0,
        min: 0,
      },
      cacheHits: 0,
      cacheMisses: 0,
      modelFreshness: {
        collaborative: null,
        contentBased: null,
        hybrid: null,
      },
      dataDrift: {
        lastChecked: null,
        status: 'unknown',
      },
    };

    // Maximum number of endpoints to track to prevent memory leaks
    this.MAX_ENDPOINTS = 100;
    // Start collecting metrics immediately
    this.startPeriodicTasks();
  }

  /**
   * Record an API call to a recommendation endpoint
   *
   * @param {string} endpoint - The endpoint that was called
   * @param {number} latencyMs - Response time in milliseconds
   * @param {boolean} success - Whether the call was successful
   * @param {boolean} cacheHit - Whether the result came from cache
   */
  trackApiCall(endpoint, latencyMs, success = true, cacheHit = false) {
    try {
      // Update API call counts
      this.metrics.apiCalls.total++;

      // Prevent endpoint tracking memory leak by limiting number of endpoints
      const endpointCount = Object.keys(this.metrics.apiCalls.byEndpoint).length;
      if (endpointCount < this.MAX_ENDPOINTS || endpoint in this.metrics.apiCalls.byEndpoint) {
        this.metrics.apiCalls.byEndpoint[endpoint] = (this.metrics.apiCalls.byEndpoint[endpoint] || 0) + 1;
      }

      if (!success) {
        this.metrics.apiCalls.errors++;
      }

      // Update latency metrics
      this.metrics.latency.values.push(latencyMs);

      // Keep only the last 1000 latency values
      if (this.metrics.latency.values.length > 1000) {
        this.metrics.latency.values.shift();
      }

      // Recalculate latency statistics
      if (this.metrics.latency.values.length > 0) {
        this.metrics.latency.average = this.metrics.latency.values.reduce((a, b) => a + b, 0)
          / this.metrics.latency.values.length;
        this.metrics.latency.max = Math.max(...this.metrics.latency.values);
        this.metrics.latency.min = Math.min(...this.metrics.latency.values);
      }

      // Update cache metrics
      if (cacheHit) {
        this.metrics.cacheHits++;
      } else {
        this.metrics.cacheMisses++;
      }
    } catch (error) {
      logger.error(`Error tracking API call: ${error.message}`);
    }
  }

  /**
   * Record when a recommendation model was last updated
   *
   * @param {string} modelType - The type of model ('collaborative', 'contentBased', or 'hybrid')
   */
  updateModelFreshness(modelType) {
    try {
      if (['collaborative', 'contentBased', 'hybrid'].includes(modelType)) {
        this.metrics.modelFreshness[modelType] = new Date();
      }
    } catch (error) {
      logger.error(`Error updating model freshness: ${error.message}`);
    }
  }

  /**
   * Check for data drift in recommendation models
   */
  async checkForDataDrift() {
    try {
      // This could involve comparing recent user behavior distribution
      // with the distribution used to train the models
      // For now, we'll just update the last checked timestamp
      this.metrics.dataDrift.lastChecked = new Date();
      this.metrics.dataDrift.status = 'normal'; // Could be 'normal', 'warning', 'critical'

      logger.info('Recommendation system data drift check completed');
    } catch (error) {
      logger.error(`Error checking for data drift: ${error.message}`);
      this.metrics.dataDrift.status = 'error';
    }
  }

  /**
   * Anonymize personally identifiable information (PII)
   *
   * @param {string} userId - User ID to anonymize
   * @returns {string} - Anonymized ID
   */
  anonymizeUserId(userId) {
    if (!userId) return null;

    try {
      // Create a one-way hash of the user ID to anonymize it
      // This allows correlation of user behavior without storing the actual ID
      return crypto
        .createHash('sha256')
        .update(userId.toString() + (process.env.ANONYMIZATION_SALT || 'default-salt'))
        .digest('hex');
    } catch (error) {
      logger.error(`Error anonymizing user ID: ${error.message}`);
      // Return a fallback anonymized ID in case of error
      return `anon-${Date.now()}`;
    }
  }

  /**
   * Get GDPR-compliant user data for recommendation training
   * Removes unnecessary PII while preserving behavior patterns
   *
   * @param {Object} userData - User data to anonymize
   * @returns {Object} - Anonymized user data safe for model training
   */
  getGdprCompliantUserData(userData) {
    if (!userData) return null;

    try {
      // Create a copy to avoid modifying the original
      const anonymizedData = { ...userData };

      // Replace user ID with anonymized version
      if (anonymizedData._id) {
        anonymizedData.anonymizedId = this.anonymizeUserId(anonymizedData._id);
        delete anonymizedData._id;
      }

      // Remove other PII fields that aren't needed for recommendations
      const fieldsToRemove = [
        'email', 'firstName', 'lastName', 'password', 'address',
        'phoneNumber', 'nationalId', 'dateOfBirth',
      ];

      fieldsToRemove.forEach((field) => {
        if (field in anonymizedData) {
          delete anonymizedData[field];
        }
      });

      // Keep only fields needed for recommendations
      const safeFields = {
        anonymizedId: anonymizedData.anonymizedId,
        preferences: anonymizedData.preferences,
        // Convert dates to age ranges instead of exact dates
        accountAgeMonths: anonymizedData.createdAt
          ? Math.floor((new Date() - new Date(anonymizedData.createdAt)) / (1000 * 60 * 60 * 24 * 30)) : null,
        // Store country/region but not specific address
        region: anonymizedData.region || anonymizedData.country,
        // Only store relevant behavior patterns
        purchaseCount: anonymizedData.purchaseCount,
        averageOrderValue: anonymizedData.averageOrderValue,
        lastActive: anonymizedData.lastActive,
        // Anonymize categories/products viewed/purchased
        categories: anonymizedData.categories,
        tags: anonymizedData.tags,
      };

      return safeFields;
    } catch (error) {
      logger.error(`Error creating GDPR-compliant user data: ${error.message}`);
      return { anonymizedId: this.anonymizeUserId(userData._id || 'unknown') };
    }
  }

  /**
   * Get the current monitoring metrics
   *
   * @returns {Object} - Current monitoring metrics
   */
  getMetrics() {
    try {
      return {
        ...this.metrics,
        timestamp: new Date(),
        cacheHitRate: this.calculateCacheHitRate(),
        modelAge: this.calculateModelAge(),
      };
    } catch (error) {
      logger.error(`Error getting metrics: ${error.message}`);
      return {
        error: 'Failed to retrieve metrics',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Calculate the cache hit rate
   *
   * @returns {number} - Cache hit rate as percentage
   */
  calculateCacheHitRate() {
    try {
      const total = this.metrics.cacheHits + this.metrics.cacheMisses;
      if (total === 0) return 0;
      return (this.metrics.cacheHits / total) * 100;
    } catch (error) {
      logger.error(`Error calculating cache hit rate: ${error.message}`);
      return 0;
    }
  }

  /**
   * Calculate the age of each model in days
   *
   * @returns {Object} - Age of each model type in days
   */
  calculateModelAge() {
    try {
      const now = new Date();
      const result = {};

      for (const [modelType, lastUpdated] of Object.entries(this.metrics.modelFreshness)) {
        if (lastUpdated) {
          result[modelType] = Math.floor((now - lastUpdated) / (1000 * 60 * 60 * 24));
        } else {
          result[modelType] = null;
        }
      }

      return result;
    } catch (error) {
      logger.error(`Error calculating model age: ${error.message}`);
      return { collaborative: null, contentBased: null, hybrid: null };
    }
  }

  /**
   * Start periodic monitoring tasks
   */
  startPeriodicTasks() {
    // Check for data drift every 24 hours
    setInterval(() => {
      this.checkForDataDrift();
    }, 24 * 60 * 60 * 1000);

    // Log metrics summary every hour
    setInterval(() => {
      this.logMetricsSummary();
    }, 60 * 60 * 1000);

    // Clean up monitoring data every 6 hours
    setInterval(() => {
      this.cleanupMonitoringData();
    }, 6 * 60 * 60 * 1000);
  }

  /**
   * Clean up accumulated monitoring data to prevent memory issues
   */
  cleanupMonitoringData() {
    try {
      // Trim endpoint tracking to prevent memory leaks
      const endpoints = this.metrics.apiCalls.byEndpoint;
      if (Object.keys(endpoints).length > this.MAX_ENDPOINTS) {
        // Keep only the most frequently used endpoints
        const sortedEndpoints = Object.entries(endpoints)
          .sort((a, b) => b[1] - a[1])
          .slice(0, this.MAX_ENDPOINTS);

        this.metrics.apiCalls.byEndpoint = Object.fromEntries(sortedEndpoints);
      }

      logger.info('Recommendation monitoring data cleanup completed');
    } catch (error) {
      logger.error(`Error during monitoring data cleanup: ${error.message}`);
    }
  }

  /**
   * Log a summary of current metrics
   */
  logMetricsSummary() {
    try {
      const metrics = this.getMetrics();
      logger.info(`Recommendation System Metrics Summary:
        - Total API calls: ${metrics.apiCalls.total}
        - Error rate: ${metrics.apiCalls.total > 0 ? (metrics.apiCalls.errors / metrics.apiCalls.total * 100).toFixed(2) : 0}%
        - Avg latency: ${metrics.latency.average.toFixed(2)}ms
        - Cache hit rate: ${metrics.cacheHitRate.toFixed(2)}%
        - Data drift status: ${metrics.dataDrift.status}
        - Most popular endpoint: ${this.getMostPopularEndpoint()}
      `);
    } catch (error) {
      logger.error(`Error logging metrics summary: ${error.message}`);
    }
  }

  /**
   * Get the most frequently called recommendation endpoint
   *
   * @returns {string} - Name of the most popular endpoint
   */
  getMostPopularEndpoint() {
    try {
      const endpoints = this.metrics.apiCalls.byEndpoint;
      if (Object.keys(endpoints).length === 0) return 'none';

      return Object.entries(endpoints)
        .sort((a, b) => b[1] - a[1])
        .map((entry) => `${entry[0]} (${entry[1]} calls)`)
        .slice(0, 1)[0];
    } catch (error) {
      logger.error(`Error getting most popular endpoint: ${error.message}`);
      return 'error';
    }
  }
}

export default new RecommendationMonitoring();
