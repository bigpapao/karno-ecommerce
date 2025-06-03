// middleware/auth.middleware.js (Optimized)
import jwt from 'jsonwebtoken';
import { AppError } from './error-handler.middleware.js';
import User from '../models/user.model.js';
import {
  hasPermissions,
  canAccess,
} from '../utils/roles.js';

// ───────────── Authenticate ─────────────
export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.access_token;
    if (!token) return next(new AppError('شما احراز هویت نشده‌اید. لطفاً وارد شوید.', 401));

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secure-jwt-secret');
    const user = await User.findById(decoded.id);
    if (!user) return next(new AppError('کاربر یافت نشد یا حذف شده است.', 401));

    if (user.passwordChangedAt?.getTime() > decoded.iat * 1000) return next(new AppError('رمز عبور شما تغییر کرده است. لطفاً دوباره وارد شوید.', 401));

    req.user = user;
    next();
  } catch (err) {
    next(new AppError('توکن احراز هویت نامعتبر است یا منقضی شده.', 401));
  }
};

// ───────────── Authorize by Role ─────────────
export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError(`نقش '${req.user.role}' مجاز به دسترسی نیست.`, 403));
  }
  next();
};

// ───────────── Check Specific Permissions ─────────────
export const hasPermission = (...permissions) => (req, res, next) => {
  if (!hasPermissions(req.user.role, permissions)) {
    return next(new AppError('دسترسی به این عملیات برای شما مجاز نیست.', 403));
  }
  next();
};

// ───────────── Resource Action Permissions ─────────────
export const checkResourcePermission = (resource, action) => (req, res, next) => {
  if (!canAccess(req.user.role, resource, action)) {
    return next(new AppError(`اجازه ${action} روی ${resource} را ندارید.`, 403));
  }
  next();
};

// ───────────── Resource Ownership or Role ─────────────
export const isOwnerOr = (roles = []) => async (req, res, next) => {
  try {
    if (roles.includes(req.user.role)) return next();

    const resourceId = req.params.id;
    const userId = req.user._id.toString();

    if (resourceId === userId) return next();

    const { resourceModel } = req;
    if (resourceModel) {
      const resource = await resourceModel.findById(resourceId);
      if (resource?.user?.toString() === userId) return next();
    }

    return next(new AppError('دسترسی غیرمجاز به این منبع.', 403));
  } catch (err) {
    return next(new AppError('خطا در بررسی مالکیت منبع.', 500));
  }
};
