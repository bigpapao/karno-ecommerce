import express from 'express';
import {
  getMetrics,
  getModelFreshness,
  getApiPerformance,
  triggerDataDriftCheck,
  updateModelFreshness,
} from '../controllers/recommendation-monitoring.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Monitoring endpoints
router.get('/metrics', getMetrics);
router.get('/model-freshness', getModelFreshness);
router.get('/api-performance', getApiPerformance);
router.post('/check-data-drift', triggerDataDriftCheck);
router.post('/update-model-freshness', updateModelFreshness);

export default router;
