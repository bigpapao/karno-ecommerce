/**
 * Sitemap Routes
 * 
 * These routes provide the data needed for generating a dynamic sitemap
 */

import express from 'express';
import { 
  getProductsForSitemap, 
  getBrandsForSitemap, 
  getCategoriesForSitemap 
} from '../controllers/sitemap.controller.js';
import { cacheMiddleware } from '../middleware/cache.middleware.js';

const router = express.Router();

// Get data for product pages sitemap (long cache time since it's only for crawlers)
router.get('/products', cacheMiddleware(3600), getProductsForSitemap);

// Get data for brand pages sitemap
router.get('/brands', cacheMiddleware(3600), getBrandsForSitemap);

// Get data for category pages sitemap
router.get('/categories', cacheMiddleware(3600), getCategoriesForSitemap);

export default router; 