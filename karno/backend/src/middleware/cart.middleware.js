import { AppError } from './error-handler.middleware.js';
import Cart from '../models/cart.model.js';

/**
 * Middleware to check if the cart belongs to the authenticated user
 */
export const verifyCartOwnership = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const cartId = req.params.cartId || req.body.cartId;

    if (!cartId) {
      return next();
    }

    const cart = await Cart.findById(cartId);

    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }

    // Check if the cart belongs to the authenticated user
    if (cart.user.toString() !== userId.toString()) {
      return next(new AppError('You are not authorized to access this cart', 403));
    }

    req.cart = cart;
    next();
  } catch (error) {
    next(new AppError(`Error verifying cart ownership: ${error.message}`, 500));
  }
};

/**
 * Middleware to check if the cart item belongs to the user's cart
 */
export const verifyCartItemOwnership = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;

    if (!itemId) {
      return next(new AppError('Item ID is required', 400));
    }

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }

    // Check if the item exists in the user's cart
    const cartItem = cart.items.id(itemId);
    if (!cartItem) {
      return next(new AppError('Cart item not found', 404));
    }

    req.cart = cart;
    req.cartItem = cartItem;
    next();
  } catch (error) {
    next(new AppError(`Error verifying cart item ownership: ${error.message}`, 500));
  }
};

/**
 * Middleware to validate cart operation payload
 */
export const validateCartPayload = (req, res, next) => {
  // For adding items to cart
  if (req.body.productId && req.body.quantity) {
    if (typeof req.body.quantity !== 'number' || req.body.quantity < 1) {
      return next(new AppError('Quantity must be a positive number', 400));
    }
  }

  // For updating cart item quantity
  if (req.params.itemId && req.body.quantity) {
    if (typeof req.body.quantity !== 'number' || req.body.quantity < 1) {
      return next(new AppError('Quantity must be a positive number', 400));
    }
  }

  next();
};

/**
 * Middleware to validate session ID for guest carts
 */
export const validateSessionId = (req, res, next) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return next(new AppError('Session ID is required', 400));
  }

  // Basic validation for session ID format (alphanumeric, length, etc.)
  if (!/^[a-zA-Z0-9-_]{10,100}$/.test(sessionId)) {
    return next(new AppError('Invalid session ID format', 400));
  }

  next();
};
