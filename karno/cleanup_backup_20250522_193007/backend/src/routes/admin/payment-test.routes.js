/**
 * Admin Payment Test Routes
 *
 * Provides routes for testing payment gateway functionality in the admin panel.
 */
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate); router.use(authorize('admin'));

// Get the directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @route   GET /api/admin/payment-test
 * @desc    Render the payment test page for Zarinpal
 * @access  Private/Admin
 */
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/admin/payment-test.html'));
});

export default router;
