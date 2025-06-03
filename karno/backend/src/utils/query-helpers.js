/**
 * Query Helper Utilities
 *
 * This file contains utilities to optimize MongoDB queries, including:
 * - Pagination
 * - Filtering
 * - Sorting
 * - Field selection
 * - Performance optimization techniques
 */

import { AppError } from '../middleware/error-handler.middleware.js';
import { logger } from './logger.js';

/**
 * Apply pagination to a Mongoose query
 *
 * @param {Object} query - Mongoose query object
 * @param {Object} options - Pagination options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=10] - Number of items per page
 * @returns {Object} Modified query object with pagination
 */
export const paginate = (query, { page = 1, limit = 10 } = {}) => {
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  // Validate page and limit
  if (isNaN(pageNum) || pageNum < 1) {
    throw new AppError('Page must be a positive number', 400);
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    throw new AppError('Limit must be between 1 and 100', 400);
  }

  const skip = (pageNum - 1) * limitNum;

  return query.skip(skip).limit(limitNum);
};

/**
 * Build a MongoDB sort object from query parameters
 *
 * @param {string|Object} sortParam - Sort parameter (e.g., 'createdAt,-price')
 * @param {Object} defaultSort - Default sort if none provided
 * @returns {Object} MongoDB sort object
 */
export const buildSortObject = (sortParam, defaultSort = { createdAt: -1 }) => {
  if (!sortParam) {
    return defaultSort;
  }

  const sortFields = typeof sortParam === 'string' ? sortParam.split(',') : [];
  const sortObject = {};

  if (sortFields.length === 0) {
    return defaultSort;
  }

  for (const field of sortFields) {
    if (field.startsWith('-')) {
      sortObject[field.substring(1)] = -1;
    } else {
      sortObject[field] = 1;
    }
  }

  return sortObject;
};

/**
 * Build a MongoDB filter object from query parameters
 *
 * @param {Object} filterParams - Filter parameters
 * @param {Object} allowedFields - Object mapping parameter names to MongoDB field names
 * @param {Object} options - Additional options
 * @param {boolean} [options.exactMatch=false] - Whether to use exact match for string fields
 * @returns {Object} MongoDB filter object
 */
export const buildFilterObject = (filterParams, allowedFields, { exactMatch = false } = {}) => {
  const filter = {};

  for (const [key, value] of Object.entries(filterParams)) {
    // Skip pagination and sorting parameters
    if (['page', 'limit', 'sort', 'fields'].includes(key)) {
      continue;
    }

    // Check if this is an allowed filter field
    if (allowedFields[key]) {
      const fieldName = allowedFields[key];

      // Handle range filters (e.g., minPrice, maxPrice)
      if (key.startsWith('min') && value) {
        const targetField = allowedFields[key.substring(3).toLowerCase()];
        if (targetField) {
          filter[targetField] = filter[targetField] || {};
          filter[targetField].$gte = parseFloat(value);
        }
      } else if (key.startsWith('max') && value) {
        const targetField = allowedFields[key.substring(3).toLowerCase()];
        if (targetField) {
          filter[targetField] = filter[targetField] || {};
          filter[targetField].$lte = parseFloat(value);
        }
      }
      // Handle comma-separated values for OR queries
      else if (value && value.includes(',')) {
        filter[fieldName] = { $in: value.split(',') };
      }
      // Handle exact match vs partial match for strings
      else if (value && typeof value === 'string' && !exactMatch) {
        // Use case-insensitive regex search for strings
        filter[fieldName] = { $regex: value, $options: 'i' };
      }
      // Handle normal equality filters
      else if (value) {
        filter[fieldName] = value;
      }
    }
  }

  return filter;
};

/**
 * Select specific fields for a MongoDB query
 *
 * @param {Object} query - Mongoose query object
 * @param {string} fields - Comma-separated list of fields to include
 * @param {string[]} [alwaysInclude=[]] - Fields to always include
 * @returns {Object} Modified query object with field selection
 */
export const selectFields = (query, fields, alwaysInclude = []) => {
  if (!fields) {
    return query;
  }

  const fieldsList = fields.split(',');
  const selectedFields = [...fieldsList, ...alwaysInclude].join(' ');

  return query.select(selectedFields);
};

/**
 * Create an API features builder for MongoDB queries
 *
 * @param {Object} Model - Mongoose model
 * @param {Object} queryParams - Request query parameters
 * @param {Object} options - Additional options
 * @returns {Object} API features object
 */
export const createAPIFeatures = (Model, queryParams, options = {}) => {
  const {
    allowedFilters = {},
    defaultSort = { createdAt: -1 },
    alwaysIncludeFields = [],
    exactMatchFields = false,
    populateFields = [],
    countQuery = true,
  } = options;

  // Build filter
  const filter = buildFilterObject(queryParams, allowedFilters, {
    exactMatch: exactMatchFields,
  });

  // Create query
  let query = Model.find(filter);

  // Apply sorting
  const sortObject = buildSortObject(queryParams.sort, defaultSort);
  query = query.sort(sortObject);

  // Apply field selection
  if (queryParams.fields) {
    query = selectFields(query, queryParams.fields, alwaysIncludeFields);
  }

  // Apply population
  if (populateFields.length > 0) {
    for (const field of populateFields) {
      if (typeof field === 'string') {
        query = query.populate(field);
      } else {
        query = query.populate(field.path, field.select);
      }
    }
  }

  // Create count query if requested
  let countQueryObj = null;
  if (countQuery) {
    countQueryObj = Model.countDocuments(filter);
  }

  // Apply pagination
  query = paginate(query, {
    page: queryParams.page,
    limit: queryParams.limit,
  });

  return {
    query,
    countQuery: countQueryObj,
    filter,
    sort: sortObject,
    async execute() {
      try {
        const [data, total] = await Promise.all([
          query.exec(),
          countQueryObj ? countQueryObj.exec() : Promise.resolve(null),
        ]);

        const page = parseInt(queryParams.page, 10) || 1;
        const limit = parseInt(queryParams.limit, 10) || 10;

        return {
          data,
          total,
          currentPage: page,
          totalPages: total ? Math.ceil(total / limit) : null,
          limit,
        };
      } catch (error) {
        logger.error({
          message: 'Error executing API query',
          error: error.message,
          stack: error.stack,
          filter,
          sort: sortObject,
        });
        throw error;
      }
    },
  };
};

/**
 * Lean query helper - creates a lean query with selected fields
 * Returns plain JavaScript objects instead of Mongoose documents
 * for better performance when only reading data.
 *
 * @param {Object} Model - Mongoose model
 * @param {Object} filter - MongoDB filter object
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of plain JavaScript objects
 */
export const leanQuery = async (Model, filter = {}, options = {}) => {
  const {
    sort = { createdAt: -1 },
    limit = 0,
    skip = 0,
    select = '',
    populate = [],
  } = options;

  try {
    let query = Model.find(filter)
      .sort(sort)
      .lean();

    if (limit > 0) {
      query = query.limit(limit);
    }

    if (skip > 0) {
      query = query.skip(skip);
    }

    if (select) {
      query = query.select(select);
    }

    if (populate.length > 0) {
      for (const field of populate) {
        if (typeof field === 'string') {
          query = query.populate(field, '-__v');
        } else {
          query = query.populate(field.path, field.select || '-__v');
        }
      }
    }

    return await query.exec();
  } catch (error) {
    logger.error({
      message: 'Error executing lean query',
      error: error.message,
      stack: error.stack,
      filter,
      options,
    });
    throw error;
  }
};

export default {
  paginate,
  buildSortObject,
  buildFilterObject,
  selectFields,
  createAPIFeatures,
  leanQuery,
};
