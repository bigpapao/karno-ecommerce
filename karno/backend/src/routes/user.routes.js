import express from 'express';
import {
  getUsers, getUserById, updateUser, deleteUser,
} from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

// Admin only routes
router.get('/', authorize('admin'), getUsers);

// User routes (self or admin)
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

export default router;
