/**
 * Sitemap Controller
 *
 * Provides data for the frontend to generate dynamic sitemaps
 */

import Product from '../models/product.model.js';
import Brand from '../models/brand.model.js';
import Category from '../models/category.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../middleware/error-handler.middleware.js';

/**
 * @desc    Get product data for sitemap
 * @route   GET /api/sitemap/products
 * @access  Public
 */
export const getProductsForSitemap = asyncHandler(async (req, res, next) => {
  const products = await Product.find({ isActive: true })
    .select('slug name updatedAt')
    .lean();

  if (!products) {
    return next(new AppError('No products found', 404));
  }

  res.status(200).json({
    status: 'success',
    results: products.length,
    data: products,
  });
});

/**
 * @desc    Get brand data for sitemap
 * @route   GET /api/sitemap/brands
 * @access  Public
 */
export const getBrandsForSitemap = asyncHandler(async (req, res, next) => {
  const brands = await Brand.find({ isActive: true })
    .select('slug name updatedAt')
    .lean();

  if (!brands) {
    return next(new AppError('No brands found', 404));
  }

  res.status(200).json({
    status: 'success',
    results: brands.length,
    data: brands,
  });
});

/**
 * @desc    Get category data for sitemap
 * @route   GET /api/sitemap/categories
 * @access  Public
 */
export const getCategoriesForSitemap = asyncHandler(async (req, res, next) => {
  const categories = await Category.find({ isActive: true })
    .select('slug name updatedAt')
    .lean();

  if (!categories) {
    return next(new AppError('No categories found', 404));
  }

  res.status(200).json({
    status: 'success',
    results: categories.length,
    data: categories,
  });
});
