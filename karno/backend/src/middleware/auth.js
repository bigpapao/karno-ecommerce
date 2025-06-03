import jwt from 'jsonwebtoken';
import { ApiError, ErrorCodes } from '../utils/api-error.js';
import User from '../models/user.model.js';

/**
 * Verify JWT token middleware
 */
export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new ApiError(401, 'No token provided', ErrorCodes.UNAUTHORIZED);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      throw new ApiError(401, 'User not found', ErrorCodes.UNAUTHORIZED);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError(401, 'Invalid token', ErrorCodes.UNAUTHORIZED));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new ApiError(401, 'Token expired', ErrorCodes.UNAUTHORIZED));
    } else {
      next(error);
    }
  }
};

/**
 * Admin role middleware
 */
export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required', ErrorCodes.UNAUTHORIZED);
    }

    if (req.user.role !== 'admin') {
      throw new ApiError(403, 'Admin access required', ErrorCodes.FORBIDDEN);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware
 * Sets user if token is valid, but doesn't require it
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Ignore token errors and continue
    next();
  }
};
