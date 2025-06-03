import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import { AppError } from '../middleware/error-handler.middleware.js';
import { generateTrackingNumber } from '../utils/trackingNumber.js';
import User from '../models/user.model.js';
import { generateGuestOrderToken } from '../utils/guestOrderToken.js';
import Cart from '../models/cart.model.js';
import { generateOrderNumber, generateTrackingCode } from '../utils/orderUtils.js';
import { normalizePhoneNumber } from '../utils/phoneUtils.js';

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Order.countDocuments(query);

    res.status(200).json({
      status: 'success',
      results: orders.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user orders
// @route   GET /api/orders/user
// @access  Private
export const getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .select('orderNumber trackingCode status totalAmount createdAt items');

    res.status(200).json({
      status: 'success',
      results: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const order = await Order.findOne({ _id: id, user: userId });

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create order
// @route   POST /api/orders
// @access  Private/Public (supports both guest and authenticated users)
export const createOrder = async (req, res, next) => {
  try {
    const {
      items, totalAmount, shippingInfo, paymentMethod,
    } = req.body;
    const userId = req.user._id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return next(new AppError('Order must contain at least one item', 400));
    }

    // Basic validation
    if (!shippingInfo || !paymentMethod) {
      return next(new AppError('Shipping information and payment method are required', 400));
    }

    // Create the order
    const order = new Order({
      user: userId,
      orderNumber: generateOrderNumber(),
      trackingCode: generateTrackingCode(),
      items,
      totalAmount,
      shippingInfo,
      paymentMethod,
      status: 'pending',
    });

    // Save the order
    await order.save();

    // Clear the user's cart after successful order
    await Cart.findOneAndUpdate(
      { user: userId },
      { $set: { items: [], totalItems: 0, totalPrice: 0 } },
    );

    // Update user's shipping info if needed
    if (req.body.saveShippingInfo) {
      await User.findByIdAndUpdate(userId, {
        $set: { shippingInfo },
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Order created successfully',
      orderId: order._id,
      orderNumber: order.orderNumber,
      trackingCode: order.trackingCode,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      return next(new AppError('Status is required', 400));
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    order.status = status;

    // If status is delivered, set deliveredAt
    if (status === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    // If status is cancelled, restore product stock
    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.orderItems) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }
    }

    await order.save();

    res.status(200).json({
      status: 'success',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order
// @route   POST /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Check if user is authorized to cancel this order
    if (
      req.user.role !== 'admin'
      && order.user.toString() !== req.user._id.toString()
    ) {
      return next(new AppError('Not authorized to cancel this order', 403));
    }

    // Check if order can be cancelled
    if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
      return next(
        new AppError(`Order cannot be cancelled in ${order.status} status`, 400),
      );
    }

    // Restore product stock
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    order.status = 'cancelled';
    await order.save();

    res.status(200).json({
      status: 'success',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order payment status
// @route   PUT /api/orders/:id/payment
// @access  Private/Admin
export const updatePaymentStatus = async (req, res, next) => {
  try {
    const { isPaid, paymentResult } = req.body;

    if (typeof isPaid !== 'boolean') {
      return next(new AppError('isPaid status is required as boolean', 400));
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    order.isPaid = isPaid;

    if (isPaid) {
      order.paidAt = Date.now();
      if (paymentResult) {
        order.paymentResult = paymentResult;
      }
    } else {
      // If marking as unpaid, clear payment data
      order.paidAt = undefined;
      order.paymentResult = undefined;
    }

    await order.save();

    res.status(200).json({
      status: 'success',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order tracking information
// @route   PUT /api/orders/:id/tracking
// @access  Private/Admin
export const updateOrderTracking = async (req, res, next) => {
  try {
    const { trackingNumber, notes } = req.body;

    if (!trackingNumber) {
      return next(new AppError('Tracking number is required', 400));
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    order.trackingNumber = trackingNumber;

    if (notes) {
      order.notes = notes;
    }

    // If adding tracking and order is in 'processing', update to 'shipped'
    if (order.status === 'processing') {
      order.status = 'shipped';
    }

    await order.save();

    res.status(200).json({
      status: 'success',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order statistics
// @route   GET /api/orders/stats
// @access  Private/Admin
export const getOrderStats = async (req, res, next) => {
  try {
    // Get counts by status
    const statusCounts = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
        },
      },
    ]);

    // Format status counts
    const formattedStatusCounts = {};
    statusCounts.forEach((item) => {
      formattedStatusCounts[item._id] = {
        count: item.count,
        revenue: item.revenue,
      };
    });

    // Get counts by payment status
    const paymentCounts = await Order.aggregate([
      {
        $group: {
          _id: '$isPaid',
          count: { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
        },
      },
    ]);

    // Format payment counts
    const formattedPaymentCounts = {};
    paymentCounts.forEach((item) => {
      formattedPaymentCounts[item._id ? 'paid' : 'unpaid'] = {
        count: item.count,
        revenue: item.revenue,
      };
    });

    // Get daily order counts for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyOrders = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          count: { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    // Format daily orders
    const formattedDailyOrders = dailyOrders.map((item) => ({
      date: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}-${item._id.day.toString().padStart(2, '0')}`,
      count: item.count,
      revenue: item.revenue,
    }));

    res.status(200).json({
      status: 'success',
      data: {
        statusCounts: formattedStatusCounts,
        paymentCounts: formattedPaymentCounts,
        dailyOrders: formattedDailyOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk update order status
// @route   PUT /api/orders/bulk-status-update
// @access  Private/Admin
export const bulkUpdateOrderStatus = async (req, res, next) => {
  try {
    const { orderIds, status } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return next(new AppError('Order IDs array is required', 400));
    }

    if (!status) {
      return next(new AppError('Status is required', 400));
    }

    // Validate all order IDs exist
    const orders = await Order.find({ _id: { $in: orderIds } });

    if (orders.length !== orderIds.length) {
      return next(new AppError('Some order IDs are invalid', 400));
    }

    // Handle special logic for different status changes
    const updatePromises = orders.map(async (order) => {
      // Skip if already in the target status
      if (order.status === status) {
        return order;
      }

      // If cancelling, restore stock
      if (status === 'cancelled' && order.status !== 'cancelled') {
        for (const item of order.orderItems) {
          const product = await Product.findById(item.product);
          if (product) {
            product.stock += item.quantity;
            await product.save();
          }
        }
      }

      // If marking as delivered
      if (status === 'delivered') {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
      }

      order.status = status;
      return order.save();
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      status: 'success',
      message: `${orders.length} orders updated to status: ${status}`,
      count: orders.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by tracking number
// @route   GET /api/orders/track/:tracking
// @access  Public
export const getOrderByTracking = async (req, res, next) => {
  try {
    const { tracking } = req.params;

    if (!tracking) {
      return next(new AppError('Tracking number is required', 400));
    }

    const order = await Order.findOne({ trackingNumber: tracking });

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Return limited data for public access
    const publicOrderData = {
      trackingNumber: order.trackingNumber,
      status: order.status,
      createdAt: order.createdAt,
      isDelivered: order.isDelivered,
      deliveredAt: order.deliveredAt,
      estimatedDelivery: order.estimatedDelivery,
    };

    res.status(200).json({
      success: true,
      data: publicOrderData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get guest order by email and order ID
// @route   POST /api/orders/guest/verify
// @access  Public
export const verifyGuestOrder = async (req, res, next) => {
  try {
    const { email, orderId } = req.body;

    if (!email || !orderId) {
      return next(new AppError('Email and order ID are required', 400));
    }

    const order = await Order.findOne({
      _id: orderId,
      isGuest: true,
      guestEmail: email,
    });

    if (!order) {
      return next(new AppError('Order not found or access denied', 404));
    }

    // Generate a temporary access token for this guest to view their order
    const guestAccessToken = await generateGuestOrderToken(orderId, email);

    res.status(200).json({
      success: true,
      accessToken: guestAccessToken,
      expiresIn: '1h',
    });
  } catch (error) {
    next(error);
  }
};
