import mongoose from 'mongoose';
import Product from '../models/product.model.js';
import { AppError } from '../middleware/error-handler.middleware.js';

// @desc    Get product analytics
// @route   GET /api/products/analytics
// @access  Private/Admin
export const getProductAnalytics = async (req, res, next) => {
  try {
    // Get product counts by category
    const categoryCounts = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          totalStock: { $sum: '$stock' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get product counts by brand
    const brandCounts = await Product.aggregate([
      {
        $group: {
          _id: '$brand',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          totalStock: { $sum: '$stock' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get stock statistics
    const stockStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          avgStock: { $avg: '$stock' },
          lowStockCount: {
            $sum: { $cond: [{ $lt: ['$stock', 10] }, 1, 0] },
          },
          outOfStockCount: {
            $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] },
          },
        },
      },
    ]);

    // Get price range statistics
    const priceStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          avgPrice: { $avg: '$price' },
        },
      },
    ]);

    // Get low stock products
    const lowStockProducts = await Product.find({ stock: { $lt: 10 } })
      .select('name slug stock price images category brand')
      .populate('category', 'name')
      .populate('brand', 'name')
      .sort({ stock: 1 })
      .limit(10);

    // Populate category and brand information
    const populatedCategoryCounts = await Promise.all(
      categoryCounts.map(async (item) => {
        const category = await mongoose.model('Category').findById(item._id);
        return {
          ...item,
          categoryName: category ? category.name : 'Unknown',
          categorySlug: category ? category.slug : 'unknown',
        };
      }),
    );

    const populatedBrandCounts = await Promise.all(
      brandCounts.map(async (item) => {
        const brand = await mongoose.model('Brand').findById(item._id);
        return {
          ...item,
          brandName: brand ? brand.name : 'Unknown',
          brandSlug: brand ? brand.slug : 'unknown',
        };
      }),
    );

    res.status(200).json({
      status: 'success',
      data: {
        categories: populatedCategoryCounts,
        brands: populatedBrandCounts,
        stockStats: stockStats[0] || {},
        priceStats: priceStats[0] || {},
        lowStockProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product stock
// @route   PUT /api/products/:id/stock
// @access  Private/Admin
export const updateProductStock = async (req, res, next) => {
  try {
    const { stock } = req.body;

    if (stock === undefined || stock < 0) {
      return next(new AppError('Valid stock quantity is required', 400));
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    product.stock = stock;
    await product.save();

    res.status(200).json({
      status: 'success',
      data: {
        product,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk update product stock
// @route   PUT /api/products/bulk-stock-update
// @access  Private/Admin
export const bulkUpdateProductStock = async (req, res, next) => {
  try {
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return next(new AppError('Valid updates array is required', 400));
    }

    // Validate structure of updates
    for (const update of updates) {
      if (!update.productId || update.stock === undefined || update.stock < 0) {
        return next(new AppError('Each update must contain productId and valid stock quantity', 400));
      }
    }

    // Process updates
    const updateResults = await Promise.all(
      updates.map(async (update) => {
        try {
          const product = await Product.findByIdAndUpdate(
            update.productId,
            { stock: update.stock },
            { new: true, runValidators: true },
          );

          return {
            productId: update.productId,
            success: !!product,
            newStock: product ? product.stock : null,
            error: product ? null : 'Product not found',
          };
        } catch (error) {
          return {
            productId: update.productId,
            success: false,
            newStock: null,
            error: error.message,
          };
        }
      }),
    );

    const successCount = updateResults.filter((result) => result.success).length;

    res.status(200).json({
      status: 'success',
      message: `${successCount} of ${updates.length} products updated successfully`,
      data: {
        results: updateResults,
      },
    });
  } catch (error) {
    next(error);
  }
};
