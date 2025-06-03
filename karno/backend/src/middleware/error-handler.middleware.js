// middleware/error-handler.middleware.js

import { logger } from '../utils/logger.js';

/**
 * Custom AppError class for operational errors
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode || 500;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errorCode = errorCode || 'ERR_INTERNAL';
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

// ───── Specialized Error Transformers ─────
const handleValidationError = (err) => {
  const errors = Object.values(err.errors || {}).map((e) => e.message);
  return new AppError(`Invalid input data. ${errors.join('. ')}`, 400, 'ERR_VALIDATION');
};

const handleCastError = (err) => new AppError(`Invalid ${err.path}: ${err.value}`, 400, 'ERR_INVALID_ID');

const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(`Duplicate field value for '${field}'.`, 400, 'ERR_DUPLICATE');
};

const handleJWTError = () => new AppError('Invalid token. Please log in again.', 401, 'ERR_INVALID_TOKEN');

const handleJWTExpiredError = () => new AppError('Token expired. Please log in again.', 401, 'ERR_EXPIRED_TOKEN');

// ───── Global Error Middleware ─────
const errorHandler = (err, req, res, next) => {
  let customError = { ...err };
  customError.message = err.message || 'Something went wrong';
  customError.name = err.name;
  customError.stack = err.stack;

  // Log structured error
  logger.error({
    message: `${req.method} ${req.originalUrl} → ${customError.message}`,
    statusCode: err.statusCode || 500,
    user: req.user?.id || 'unauthenticated',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    stack: customError.stack,
  });

  // Transform known errors
  if (err.name === 'ValidationError') customError = handleValidationError(err);
  if (err.name === 'CastError') customError = handleCastError(err);
  if (err.code === 11000) customError = handleDuplicateKeyError(err);
  if (err.name === 'JsonWebTokenError') customError = handleJWTError();
  if (err.name === 'TokenExpiredError') customError = handleJWTExpiredError();

  const {
    statusCode = 500, status = 'error', message, errorCode,
  } = customError;

  const response = {
    status,
    error: {
      message,
      code: errorCode,
      timestamp: new Date().toISOString(),
    },
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = customError.stack;
    response.details = customError;
  }

  res.status(statusCode).json(response);
};

export { AppError, errorHandler };
