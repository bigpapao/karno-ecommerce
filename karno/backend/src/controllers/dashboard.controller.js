import User from '../models/user.model.js';
import Product from '../models/product.model.js';
import Order from '../models/order.model.js';
import { AppError } from '../middleware/error-handler.middleware.js';

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Admin
export const getDashboardStats = async (req, res, next) => {
  try {
    // Basic stats with error handling
    let userCount = 0;
    let productCount = 0;
    let orderCount = 0;
    let totalRevenue = 0;
    let recentOrders = [];
    let topProducts = [];
    let lowStockProducts = [];
    let monthlySales = [];
    const orderStatusCounts = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    try {
      userCount = await User.countDocuments();
    } catch (err) {
      console.error('Error counting users:', err);
    }

    try {
      productCount = await Product.countDocuments();
    } catch (err) {
      console.error('Error counting products:', err);
    }

    try {
      orderCount = await Order.countDocuments();
    } catch (err) {
      console.error('Error counting orders:', err);
    }

    // Get total revenue - with safer approach
    try {
      const orders = await Order.find({ status: { $ne: 'cancelled' } });
      totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

      // Calculate order status counts
      orders.forEach((order) => {
        if (orderStatusCounts.hasOwnProperty(order.status)) {
          orderStatusCounts[order.status]++;
        }
      });

      // Calculate monthly sales for the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyOrdersData = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsAgo },
            status: { $ne: 'cancelled' },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            totalSales: { $sum: '$totalPrice' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      // Format monthly sales data
      monthlySales = monthlyOrdersData.map((item) => ({
        month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
        sales: item.totalSales,
        count: item.count,
      }));
    } catch (err) {
      console.error('Error calculating revenue and sales data:', err);
    }

    // Get recent orders - with safer approach
    try {
      recentOrders = await Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'firstName lastName email')
        .lean();
    } catch (err) {
      console.error('Error fetching recent orders:', err);
    }

    // Get top selling products
    try {
      // Aggregate to find top selling products
      const topProductsData = await Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $unwind: '$orderItems' },
        {
          $group: {
            _id: '$orderItems.product',
            productName: { $first: '$orderItems.name' },
            totalQuantity: { $sum: '$orderItems.quantity' },
            totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 5 },
      ]);

      // Populate with additional product details if needed
      if (topProductsData.length > 0) {
        const productIds = topProductsData.map((item) => item._id);
        const productDetails = await Product.find({ _id: { $in: productIds } })
          .select('name slug images stock price');

        // Create a map for quick lookup
        const productMap = {};
        productDetails.forEach((product) => {
          productMap[product._id.toString()] = product;
        });

        // Combine the aggregation results with product details
        topProducts = topProductsData.map((item) => {
          const product = productMap[item._id.toString()];
          return {
            _id: item._id,
            name: item.productName,
            slug: product?.slug || '',
            image: product?.images?.length > 0 ? product.images[0] : null,
            totalQuantity: item.totalQuantity,
            totalRevenue: item.totalRevenue,
            currentStock: product?.stock || 0,
            price: product?.price || 0,
          };
        });
      }
    } catch (err) {
      console.error('Error calculating top products:', err);
    }

    // Get low stock products
    try {
      lowStockProducts = await Product.find({ stock: { $lt: 10 } })
        .select('name slug stock images price')
        .sort({ stock: 1 })
        .limit(5)
        .lean();
    } catch (err) {
      console.error('Error fetching low stock products:', err);
    }

    // Return the data we have
    res.status(200).json({
      status: 'success',
      data: {
        userCount,
        productCount,
        orderCount,
        totalRevenue,
        recentOrders,
        topProducts,
        lowStockProducts,
        monthlySales,
        orderStatusCounts,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    next(new AppError(`Error getting dashboard stats: ${error.message}`, 500));
  }
};

// @desc    Get sales analytics
// @route   GET /api/dashboard/sales
// @access  Admin
export const getSalesAnalytics = async (req, res, next) => {
  try {
    const { period = 'monthly', start, end } = req.query;

    // Set default date range if not provided
    const startDate = start ? new Date(start) : new Date();
    const endDate = end ? new Date(end) : new Date();

    // If no custom range provided, set default ranges based on period
    if (!start) {
      if (period === 'weekly') {
        // Last 7 weeks
        startDate.setDate(startDate.getDate() - 7 * 7);
      } else if (period === 'monthly') {
        // Last 6 months
        startDate.setMonth(startDate.getMonth() - 6);
      } else if (period === 'yearly') {
        // Last 2 years
        startDate.setFullYear(startDate.getFullYear() - 2);
      }
    }

    // Create match stage for date range
    const matchStage = {
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $ne: 'cancelled' },
    };

    // Create group stage based on period
    let groupStage = {};
    if (period === 'weekly') {
      groupStage = {
        _id: {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' },
        },
        totalSales: { $sum: '$totalPrice' },
        count: { $sum: 1 },
      };
    } else if (period === 'monthly') {
      groupStage = {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        totalSales: { $sum: '$totalPrice' },
        count: { $sum: 1 },
      };
    } else if (period === 'yearly') {
      groupStage = {
        _id: { year: { $year: '$createdAt' } },
        totalSales: { $sum: '$totalPrice' },
        count: { $sum: 1 },
      };
    }

    // Execute aggregation
    const salesData = await Order.aggregate([
      { $match: matchStage },
      { $group: groupStage },
      { $sort: period === 'yearly' ? { '_id.year': 1 } : { '_id.year': 1, [period === 'weekly' ? '_id.week' : '_id.month']: 1 } },
    ]);

    // Format results based on period
    let formattedData = [];
    if (period === 'weekly') {
      formattedData = salesData.map((item) => ({
        period: `${item._id.year}-W${item._id.week.toString().padStart(2, '0')}`,
        sales: item.totalSales,
        count: item.count,
      }));
    } else if (period === 'monthly') {
      formattedData = salesData.map((item) => ({
        period: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
        sales: item.totalSales,
        count: item.count,
      }));
    } else if (period === 'yearly') {
      formattedData = salesData.map((item) => ({
        period: item._id.year.toString(),
        sales: item.totalSales,
        count: item.count,
      }));
    }

    res.status(200).json({
      status: 'success',
      data: {
        period,
        startDate,
        endDate,
        sales: formattedData,
      },
    });
  } catch (error) {
    console.error('Sales analytics error:', error);
    next(new AppError(`Error getting sales analytics: ${error.message}`, 500));
  }
};
