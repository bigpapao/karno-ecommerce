import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  refreshToken,
  logout,
} from '../controllers/auth.core.controller.js';
import {
  getProfile,
  updateProfile,
} from '../controllers/auth.profile.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRequest, schemas } from '../middleware/validation.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// ───────── Rate Limit (Login) ─────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({
    status: 'error',
    message: 'تعداد تلاش‌های ورود بیش از حد مجاز است. لطفاً چند دقیقه دیگر امتحان کنید.',
  }),
});

// ───────── Public Routes ─────────
router.post('/register', validateRequest(schemas.register), asyncHandler(register));
router.post('/login', loginLimiter, validateRequest(schemas.login), asyncHandler(login));
router.post('/refresh-token', asyncHandler(refreshToken));

// ───────── Protected Routes ─────────
router.get('/profile', authenticate, asyncHandler(getProfile));
router.put('/profile', authenticate, /* validateRequest(schemas.updateProfile), */ asyncHandler(updateProfile));
router.post('/logout', authenticate, asyncHandler(logout));

export default router;
