import Stripe from 'stripe';
import Order from '../models/order.model.js';
import { AppError } from '../middleware/error-handler.middleware.js';
import { logger } from '../utils/logger.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Create payment intent
// @route   POST /api/payments/create-payment-intent
// @access  Private
export const createPaymentIntent = async (req, res, next) => {
  try {
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

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalPrice * 100), // Stripe expects amount in cents
      currency: 'usd',
      metadata: {
        orderId: order._id.toString(),
        userId: req.user._id.toString(),
      },
    });

    res.status(200).json({
      status: 'success',
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Handle Stripe webhook
// @route   POST /api/payments/webhook
// @access  Public
export const handleStripeWebhook = async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      logger.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await handleSuccessfulPayment(paymentIntent);
        break;
      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object;
        logger.error(`Payment failed: ${failedPaymentIntent.id}`);
        break;
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error(`Webhook Error: ${error.message}`);
    res.status(500).send(`Webhook Error: ${error.message}`);
  }
};

// Helper function to handle successful payment
const handleSuccessfulPayment = async (paymentIntent) => {
  try {
    const { orderId } = paymentIntent.metadata;

    if (!orderId) {
      logger.error('No order ID in payment intent metadata');
      return;
    }

    const order = await Order.findById(orderId);

    if (!order) {
      logger.error(`Order not found: ${orderId}`);
      return;
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: paymentIntent.id,
      status: paymentIntent.status,
      update_time: new Date().toISOString(),
    };

    await order.save();
    logger.info(`Order ${orderId} marked as paid`);
  } catch (error) {
    logger.error(`Error handling successful payment: ${error.message}`);
  }
};

// @desc    Get payment methods
// @route   GET /api/payments/methods
// @access  Private
export const getPaymentMethods = async (req, res, next) => {
  try {
    // This is a simple example, in a real app you might fetch this from a database
    const paymentMethods = [
      { id: 'stripe', name: 'Credit/Debit Card', icon: 'credit-card' },
      {
        id: 'zarinpal', name: 'Zarinpal', icon: 'zarinpal', description: 'پرداخت اینترنتی با درگاه زرین‌پال',
      },
    ];

    res.status(200).json({
      status: 'success',
      data: paymentMethods,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
export const getPaymentById = async (req, res, next) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(req.params.id);

    if (!paymentIntent) {
      return next(new AppError('Payment not found', 404));
    }

    // Check if user is authorized to view this payment
    const { orderId, userId } = paymentIntent.metadata;

    if (
      req.user.role !== 'admin'
      && userId !== req.user._id.toString()
    ) {
      return next(new AppError('Not authorized to view this payment', 403));
    }

    res.status(200).json({
      status: 'success',
      data: paymentIntent,
    });
  } catch (error) {
    next(error);
  }
};
