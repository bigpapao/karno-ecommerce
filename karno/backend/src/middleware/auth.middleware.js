import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';
import User from '../models/user.model.js';
import { ROLES, PERMISSIONS, getPermissionsForRole, hasPermissions, canAccess } from '../utils/roles.js';

export const authenticate = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in cookies first (preferred method)
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } 
    // Fallback to authorization header (for API clients)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token found, not authenticated
    if (!token) {
      return next(new AppError('Not authenticated. Please log in to access this resource.', 401));
    }

    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secure-jwt-secret');
      
      // Find the user
      const user = await User.findById(decoded.id);
      
      // Check if user exists
      if (!user) {
        return next(new AppError('The user associated with this token no longer exists.', 401));
      }
      
      // Check if user changed password after token was issued
      if (user.passwordChangedAt) {
        const tokenIssuedAt = decoded.iat * 1000; // Convert to milliseconds
        if (user.passwordChangedAt.getTime() > tokenIssuedAt) {
          return next(new AppError('User recently changed password. Please log in again.', 401));
        }
      }
      
      // Grant access - attach user to request object
      req.user = user;
      next();
    } catch (jwtError) {
      return next(new AppError('Invalid authentication token. Please log in again.', 401));
    }
  } catch (error) {
    next(new AppError('Something went wrong with authentication.', 500));
  }
};

// Role-based authorization middleware
export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError(`Role '${req.user.role}' is not authorized to access this resource.`, 403));
  }
  next();
};

// Permission-based authorization middleware
export const hasPermission = (...requiredPermissions) => (req, res, next) => {
  // Check if the user has ALL the required permissions
  if (!hasPermissions(req.user.role, requiredPermissions)) {
    return next(new AppError('You do not have permission to perform this action', 403));
  }
  
  next();
};

// Resource-specific permission check
export const checkResourcePermission = (resource, action) => (req, res, next) => {
  if (!canAccess(req.user.role, resource, action)) {
    return next(new AppError(`You do not have permission to ${action.toLowerCase()} ${resource.toLowerCase()}`, 403));
  }
  
  next();
};

// Resource ownership authorization middleware
export const isOwnerOr = (roles) => async (req, res, next) => {
  try {
    // If user has one of the specified roles, allow access
    if (roles.includes(req.user.role)) {
      return next();
    }
    
    // Otherwise, check if user is the owner of the resource
    const resourceId = req.params.id;
    const userId = req.user._id.toString();
    
    // For user resources
    if (resourceId === userId) {
      return next();
    }
    
    // For other resources with a user field (like orders)
    // This depends on your resource structure and might need adaptation
    const resourceModel = req.resourceModel; // This would be set by a previous middleware
    if (resourceModel) {
      const resource = await resourceModel.findById(resourceId);
      if (resource && resource.user && resource.user.toString() === userId) {
        return next();
      }
    }
    
    return next(new AppError('Not authorized to access this resource', 403));
  } catch (error) {
    return next(new AppError('Error checking resource ownership', 500));
  }
};
