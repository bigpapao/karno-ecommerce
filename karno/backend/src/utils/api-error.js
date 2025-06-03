// utils/api-error.js

/**
 * Custom API Error class
 * Provides structured error handling across the app
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (e.g. 404, 500)
   * @param {string} message - Human-readable error message
   * @param {string} code - Optional internal error code
   */
  constructor(statusCode, message, code = ErrorCodes.INTERNAL_SERVER_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.status = String(statusCode).startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common internal API error codes for better client-side handling
 */
export const ErrorCodes = Object.freeze({
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
});
