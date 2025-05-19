import express from 'express';
import {
  login,
  register,
  getProfile,
  updateProfile,
  logout,
  requestPhoneVerification,
  verifyPhoneAndLogin,
  refreshToken,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/request-verification', requestPhoneVerification);
router.post('/verify-phone', verifyPhoneAndLogin);
router.post('/refresh-token', refreshToken);

// Legacy routes (can be removed if no longer needed)
router.post('/login', login);
router.post('/register', register);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.get('/logout', authenticate, logout);

export default router;
