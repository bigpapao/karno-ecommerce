import Category from '../models/category.model.js';
import { AppError } from '../middleware/error-handler.middleware.js';

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res, next) => {
  try {
    // Get only parent categories if specified
    const { parentOnly } = req.query;
    const query = {};

    if (parentOnly === 'true') {
      query.parent = null;
    }

    const categories = await Category.find(query)
      .sort({ order: 1, name: 1 })
      .populate({
        path: 'children',
        select: 'name slug image',
        options: { sort: { order: 1, name: 1 } },
      });

    res.status(200).json({
      status: 'success',
      results: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured categories
// @route   GET /api/categories/featured
// @access  Public
export const getFeaturedCategories = async (req, res, next) => {
  try {
    const { limit = 6 } = req.query;
    const limitNum = parseInt(limit, 10);

    const categories = await Category.find({ featured: true })
      .sort({ order: 1, name: 1 })
      .limit(limitNum);

    res.status(200).json({
      status: 'success',
      results: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Public
export const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate({
        path: 'children',
        select: 'name slug image',
        options: { sort: { order: 1, name: 1 } },
      });

    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);

    res.status(201).json({
      status: 'success',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res, next) => {
  try {
    // Check if category has children
    const childrenCount = await Category.countDocuments({ parent: req.params.id });
    if (childrenCount > 0) {
      return next(new AppError('Cannot delete category with subcategories. Remove subcategories first.', 400));
    }

    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
