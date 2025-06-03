/**
 * Zarinpal Payment Gateway Controller
 *
 * This controller provides endpoints for integrating with the Zarinpal payment gateway.
 */

import Order from '../models/order.model.js';
import { AppError } from '../middleware/error-handler.middleware.js';
import { logger } from '../utils/logger.js';
import zarinpalService from '../services/zarinpal.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * @desc    Initiate a payment with Zarinpal and redirect to payment gateway
 * @route   POST /api/payments/zarinpal/pay
 * @access  Private
 */
export const initiateZarinpalPayment = asyncHandler(async (req, res, next) => {
  const { orderId } = req.body;

  if (!orderId) {
    return next(new AppError('Order ID is required', 400));
  }

  const order = await Order.findById(orderId);

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Check if user is authorized to pay for this order
  if (
    req.user.role !== 'admin'
    && order.user.toString() !== req.user._id.toString()
  ) {
    return next(new AppError('Not authorized to pay for this order', 403));
  }

  // Check if order is already paid
  if (order.isPaid) {
    return next(new AppError('Order is already paid', 400));
  }

  // Set payment method to zarinpal if not already set
  if (order.paymentMethod !== 'zarinpal') {
    order.paymentMethod = 'zarinpal';
    await order.save();
  }

  // Amount in IRR (Toman * 10)
  const amount = Math.round(order.totalPrice * 10); // Convert to Toman and then to IRR

  // Callback URL - where Zarinpal will redirect after payment
  const callbackUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/zarinpal/callback?orderId=${orderId}`;

  try {
    // Create payment request
    const paymentRequest = await zarinpalService.createPaymentRequest({
      amount,
      description: `Payment for order #${order._id}`,
      email: req.user.email,
      mobile: req.user.phoneNumber,
      callbackUrl,
    });

    if (paymentRequest.Status === 100) {
      // Store the authority in the session for verification
      req.session.zarinpalAuthority = {
        authority: paymentRequest.Authority,
        orderId: order._id.toString(),
        amount,
      };

      // Get the payment URL
      const paymentUrl = zarinpalService.getPaymentURL(paymentRequest.Authority);

      res.status(200).json({
        status: 'success',
        data: {
          authority: paymentRequest.Authority,
          paymentUrl,
        },
      });
    } else {
      return next(
        new AppError(
          `Zarinpal payment request failed: ${zarinpalService.getStatusMessage(paymentRequest.Status)}`,
          400,
        ),
      );
    }
  } catch (error) {
    logger.error({
      message: 'Error initiating Zarinpal payment',
      error: error.message,
      stack: error.stack,
      orderId,
    });
    return next(new AppError(`Failed to initiate payment: ${error.message}`, 500));
  }
});

/**
 * @desc    Handle Zarinpal callback after payment
 * @route   GET /api/payments/zarinpal/callback
 * @access  Public
 */
export const handleZarinpalCallback = asyncHandler(async (req, res, next) => {
  const { Authority, Status } = req.query;
  const { orderId } = req.query;

  if (!Authority || !Status || !orderId) {
    return next(new AppError('Invalid callback parameters', 400));
  }

  // Find the order
  const order = await Order.findById(orderId);
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  try {
    // Check if payment was successful
    if (Status === 'OK' || Status === 'success') {
      // Get the amount from the order - convert to IRR (Toman * 10)
      const amount = Math.round(order.totalPrice * 10);

      // Verify the payment
      const verificationResult = await zarinpalService.verifyPayment({
        authority: Authority,
        amount,
      });

      if (verificationResult.Status === 100) {
        // Payment was successful, update the order
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = {
          id: verificationResult.RefID,
          status: 'success',
          update_time: new Date().toISOString(),
        };

        // Update the order status to processing
        order.status = 'processing';

        await order.save();

        logger.info({
          message: 'Payment successful',
          orderId: order._id,
          refId: verificationResult.RefID,
        });

        // Redirect to the frontend success page
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?orderId=${order._id}`);
      }
      // Payment verification failed
      logger.warn({
        message: 'Payment verification failed',
        orderId: order._id,
        authority: Authority,
        status: verificationResult.Status,
      });

      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failed?orderId=${order._id}&error=${zarinpalService.getStatusMessage(verificationResult.Status)}`);
    }
    // Payment was canceled or failed
    logger.warn({
      message: 'Payment was canceled or failed',
      orderId: order._id,
      authority: Authority,
      status: Status,
    });

    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failed?orderId=${order._id}&error=Payment was canceled or failed`);
  } catch (error) {
    logger.error({
      message: 'Error handling Zarinpal callback',
      error: error.message,
      stack: error.stack,
      orderId,
      authority: Authority,
    });

    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failed?orderId=${order._id}&error=An error occurred while processing your payment`);
  }
});

/**
 * @desc    Get Zarinpal payment status
 * @route   GET /api/payments/zarinpal/status/:orderId
 * @access  Private
 */
export const getZarinpalPaymentStatus = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;

  if (!orderId) {
    return next(new AppError('Order ID is required', 400));
  }

  const order = await Order.findById(orderId);

  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Check if user is authorized to view this order
  if (
    req.user.role !== 'admin'
    && order.user.toString() !== req.user._id.toString()
  ) {
    return next(new AppError('Not authorized to view this order', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      isPaid: order.isPaid,
      paidAt: order.paidAt,
      paymentMethod: order.paymentMethod,
      paymentResult: order.paymentResult,
    },
  });
});

export default {
  initiateZarinpalPayment,
  handleZarinpalCallback,
  getZarinpalPaymentStatus,
};
