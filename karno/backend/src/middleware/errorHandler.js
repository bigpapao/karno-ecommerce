import { logger } from '../utils/logger.js';

/**
 * Custom Error class for application-specific errors
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errorCode = errorCode || `ERR_${this.status.toUpperCase()}`;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle validation errors from Mongoose
 */
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400, 'ERR_VALIDATION');
};

/**
 * Handle Mongoose CastError (invalid ID)
 */
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400, 'ERR_INVALID_ID');
};

/**
 * Handle Mongoose duplicate key error
 */
const handleDuplicateKeyError = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value.`;
  return new AppError(message, 400, 'ERR_DUPLICATE');
};

/**
 * Handle JWT errors
 */
const handleJWTError = () => 
  new AppError('Invalid token. Please log in again.', 401, 'ERR_INVALID_TOKEN');

/**
 * Handle JWT expiration
 */
const handleJWTExpiredError = () => 
  new AppError('Your token has expired. Please log in again.', 401, 'ERR_EXPIRED_TOKEN');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Default values
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Create a deep copy of the error to avoid modification
  let error = JSON.parse(JSON.stringify(err));
  error.message = err.message;
  error.stack = err.stack;
  error.name = err.name;

  // Log detailed error information
  logger.error({
    message: `${req.method} ${req.originalUrl} - ${err.statusCode || 500} ${err.message}`,
    error: err,
    requestInfo: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      user: req.user ? req.user.id : 'unauthenticated',
    },
    timestamp: new Date().toISOString(),
  });

  // Handle specific types of errors
  if (error.name === 'ValidationError') error = handleValidationError(err);
  if (error.name === 'CastError') error = handleCastError(err);
  if (error.code === 11000) error = handleDuplicateKeyError(err);
  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

  // Send appropriate response based on environment
  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      status: err.status,
      error: {
        message: err.message,
        code: err.errorCode || 'ERR_UNKNOWN',
        timestamp: new Date().toISOString(),
      },
      stack: err.stack,
      details: err,
    });
  } 
  
  // Production response
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: {
        message: err.message,
        code: err.errorCode || 'ERR_UNKNOWN',
        timestamp: new Date().toISOString(),
      },
    });
  } 
  
  // For non-operational errors (programming errors), send a generic message
  return res.status(500).json({
    status: 'error',
    error: {
      message: 'Something went wrong on the server',
      code: 'ERR_INTERNAL',
      timestamp: new Date().toISOString(),
    },
  });
};

export { AppError, errorHandler };
