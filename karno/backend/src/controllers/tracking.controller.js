/**
 * Order Tracking Controller
 *
 * Handles endpoints related to order tracking functionality.
 */

import Order from '../models/order.model.js';
import { validateTrackingNumber } from '../utils/trackingNumber.js';
import { AppError } from '../middleware/error-handler.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * @desc    Track order status by tracking number
 * @route   GET /api/tracking/:trackingNumber
 * @access  Public (with rate limiting)
 */
export const trackOrderByNumber = asyncHandler(async (req, res, next) => {
  const { trackingNumber } = req.params;

  // Validate tracking number format
  if (!validateTrackingNumber(trackingNumber)) {
    return next(new AppError('Invalid tracking number format', 400));
  }

  // Find order by tracking number
  const order = await Order.findOne({ trackingNumber })
    .select('status trackingNumber createdAt estimatedDeliveryDate shippingOption isDelivered deliveredAt notes');

  if (!order) {
    return next(new AppError('No order found with this tracking number', 404));
  }

  // Format response to only include needed tracking information
  const trackingInfo = {
    trackingNumber: order.trackingNumber,
    status: order.status,
    orderDate: order.createdAt,
    estimatedDeliveryDate: order.estimatedDeliveryDate,
    shippingMethod: order.shippingOption,
    isDelivered: order.isDelivered,
    deliveredAt: order.deliveredAt,
    notes: order.notes,
    // Add a human-readable status message
    statusMessage: getStatusMessage(order.status),
    // Add milestone data for timeline display
    milestones: generateMilestones(order),
  };

  res.status(200).json({
    status: 'success',
    data: trackingInfo,
  });
});

/**
 * @desc    Validate tracking number format without revealing if it exists
 * @route   POST /api/tracking/validate
 * @access  Public (with rate limiting)
 */
export const validateTrackingNumberFormat = asyncHandler(async (req, res) => {
  const { trackingNumber } = req.body;

  const isValid = validateTrackingNumber(trackingNumber);

  res.status(200).json({
    status: 'success',
    data: {
      isValid,
    },
  });
});

/**
 * Generate human-readable status message based on order status
 *
 * @param {string} status - Order status
 * @returns {string} Human-readable status message
 */
const getStatusMessage = (status) => {
  const statusMessages = {
    pending: 'سفارش شما در انتظار تایید است',
    processing: 'سفارش شما در حال پردازش است',
    shipped: 'سفارش شما ارسال شده است',
    delivered: 'سفارش شما تحویل داده شده است',
    cancelled: 'سفارش شما لغو شده است',
  };

  return statusMessages[status] || 'وضعیت سفارش نامشخص است';
};

/**
 * Generate timeline milestones for tracking display
 *
 * @param {Object} order - Order object with tracking data
 * @returns {Array} Array of milestone objects
 */
const generateMilestones = (order) => {
  const milestones = [
    {
      title: 'ثبت سفارش',
      date: order.createdAt,
      icon: 'ShoppingCartIcon',
      completed: true,
    },
    {
      title: 'پردازش سفارش',
      date: order.status === 'pending' ? null : new Date(order.createdAt.getTime() + 24 * 60 * 60 * 1000),
      icon: 'SettingsIcon',
      completed: ['processing', 'shipped', 'delivered'].includes(order.status),
    },
    {
      title: 'ارسال سفارش',
      date: order.status === 'shipped' || order.status === 'delivered'
        ? new Date(order.createdAt.getTime() + 2 * 24 * 60 * 60 * 1000)
        : null,
      icon: 'LocalShippingIcon',
      completed: ['shipped', 'delivered'].includes(order.status),
    },
    {
      title: 'تحویل سفارش',
      date: order.deliveredAt || null,
      icon: 'CheckCircleIcon',
      completed: order.status === 'delivered',
    },
  ];

  // If order is cancelled, add cancelled milestone and mark others as not completed
  if (order.status === 'cancelled') {
    const cancelledMilestone = {
      title: 'لغو سفارش',
      date: new Date(), // This should ideally be the cancellation date from order history
      icon: 'CancelIcon',
      completed: true,
      isCancelled: true,
    };

    // Mark all other milestones as not completed
    milestones.forEach((milestone) => {
      if (milestone.title !== 'ثبت سفارش') {
        milestone.completed = false;
      }
    });

    // Add cancelled milestone
    milestones.push(cancelledMilestone);
  }

  return milestones;
};
