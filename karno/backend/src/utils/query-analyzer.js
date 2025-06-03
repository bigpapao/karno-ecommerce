/**
 * Query Analyzer Utility
 *
 * This utility helps analyze and track Mongoose query performance.
 * It provides instrumentation for Mongoose models to track query execution times.
 */

import { logger } from './logger.js';

// Store query timings
export const queryTimings = {
  // Storage for query timing data
  _data: {},

  // Add timing for a query
  addTiming(collectionName, operationType, query, executionTime) {
    if (!this._data[collectionName]) {
      this._data[collectionName] = [];
    }

    const timestamp = new Date();
    this._data[collectionName].push({
      timestamp,
      operationType,
      query: typeof query === 'object' ? JSON.stringify(query) : query,
      executionTime,
    });

    // Limit stored queries to prevent memory leaks
    if (this._data[collectionName].length > 1000) {
      this._data[collectionName] = this._data[collectionName].slice(-1000);
    }

    // Log slow queries (> 500ms)
    if (executionTime > 500) {
      logger.warn({
        message: 'Slow query detected',
        collection: collectionName,
        operation: operationType,
        query: typeof query === 'object' ? JSON.stringify(query) : query,
        executionTime,
      });
    }
  },

  // Get summary of all query timings
  getSummary() {
    const summary = {};

    for (const [collection, timings] of Object.entries(this._data)) {
      if (!summary[collection]) {
        summary[collection] = {
          totalQueries: 0,
          totalTime: 0,
          averageTime: 0,
          slowQueries: 0,
          operationCounts: {},
        };
      }

      summary[collection].totalQueries = timings.length;
      summary[collection].totalTime = timings.reduce((sum, timing) => sum + timing.executionTime, 0);
      summary[collection].averageTime = Math.round(summary[collection].totalTime / timings.length) || 0;
      summary[collection].slowQueries = timings.filter((timing) => timing.executionTime > 500).length;

      // Count by operation type
      const operationCounts = {};
      for (const timing of timings) {
        operationCounts[timing.operationType] = (operationCounts[timing.operationType] || 0) + 1;
      }
      summary[collection].operationCounts = operationCounts;
    }

    return summary;
  },

  // Get slowest queries for a collection
  getSlowestQueries(collectionName, limit = 10) {
    if (!this._data[collectionName]) {
      return [];
    }

    return [...this._data[collectionName]]
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, limit);
  },

  // Clear timings
  clearTimings(collectionName = null) {
    if (collectionName) {
      this._data[collectionName] = [];
    } else {
      this._data = {};
    }
  },
};

/**
 * Create an instrumented version of a Mongoose model that tracks query performance
 * @param {Object} model - The Mongoose model to instrument
 * @returns {Object} Instrumented model
 */
export const createInstrumentedModel = (model) => {
  const collectionName = model.collection.name;
  const instrumentedModel = {};

  // Copy all properties from the original model
  for (const key in model) {
    instrumentedModel[key] = model[key];
  }

  // Instrument query methods
  const methodsToInstrument = [
    'find', 'findOne', 'findById', 'countDocuments', 'estimatedDocumentCount',
    'create', 'insertMany', 'updateOne', 'updateMany', 'findOneAndUpdate',
    'deleteOne', 'deleteMany', 'findOneAndDelete', 'findOneAndRemove',
    'aggregate',
  ];

  for (const method of methodsToInstrument) {
    if (typeof model[method] === 'function') {
      instrumentedModel[method] = function (...args) {
        const startTime = Date.now();
        const result = model[method].apply(model, args);

        // Handle promises
        if (result && typeof result.then === 'function') {
          return result.then((data) => {
            const endTime = Date.now();
            const executionTime = endTime - startTime;

            queryTimings.addTiming(
              collectionName,
              method,
              args[0] || '', // First argument is typically the query
              executionTime,
            );

            return data;
          });
        }

        // For non-promise returns
        const endTime = Date.now();
        queryTimings.addTiming(
          collectionName,
          method,
          args[0] || '',
          endTime - startTime,
        );

        return result;
      };
    }
  }

  return instrumentedModel;
};

export default {
  queryTimings,
  createInstrumentedModel,
};
