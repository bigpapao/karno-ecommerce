import Cart from '../models/cart.model.js';
import Product from '../models/product.model.js';
import { AppError } from '../middleware/error-handler.middleware.js';
import User from '../models/user.model.js';
import {
  validateProductForCart,
  formatProductForCart,
  updateCartTotals,
} from '../utils/cart.utils.js';
import {
  calculateCartPricing,
  validatePromoCode,
  applyPromoCodeToCart,
} from '../services/pricing.service.js';

/**
 * @desc    Get cart for a user
 * @route   GET /api/cart
 * @access  Private
 */
export const getCart = async (req, res, next) => {
  try {
    const userId = req.user._id;

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [],
        totalPrice: 0,
        totalItems: 0,
      });
      await cart.save();
    }

    res.status(200).json({
      status: 'success',
      data: {
        items: cart.items,
        totalItems: cart.totalItems,
        totalPrice: cart.totalPrice,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get cart for a guest user
 * @route   GET /api/cart/guest/:sessionId
 * @access  Public
 */
export const getGuestCart = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return next(new AppError('Session ID is required', 400));
    }

    // Find cart for session or create new one
    let cart = await Cart.findOne({ sessionId });

    // If cart doesn't exist, create a new empty one
    if (!cart) {
      // Create a temporary user for the guest cart
      const tempUser = await User.create({
        phone: `temp-${sessionId}`,
        role: 'user',
        phoneVerified: false,
      });

      cart = await Cart.create({
        user: tempUser._id,
        sessionId,
        items: [],
        totalPrice: 0,
        totalItems: 0,
      });
    }

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(new AppError(`Error retrieving guest cart: ${error.message}`, 500));
  }
};

/**
 * @desc    Merge guest cart with user cart after login
 * @route   POST /api/cart/merge
 * @access  Private
 */
export const mergeGuestCart = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { guestCart } = req.body;

    if (!guestCart || !Array.isArray(guestCart) || guestCart.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No items to merge',
        data: { items: [], totalItems: 0, totalPrice: 0 },
      });
    }

    // Find user cart or create new one
    let userCart = await Cart.findOne({ user: userId });
    if (!userCart) {
      userCart = new Cart({
        user: userId,
        items: [],
        totalItems: 0,
        totalPrice: 0,
      });
    }

    // Merge items from guest cart to user cart
    for (const guestItem of guestCart) {
      const existingItemIndex = userCart.items.findIndex(
        (item) => item.product.toString() === guestItem.productId.toString(),
      );

      if (existingItemIndex > -1) {
        // Add quantities if product already exists in user cart
        userCart.items[existingItemIndex].quantity += guestItem.quantity;
      } else {
        // Find product to get current price and details
        const product = await Product.findById(guestItem.productId);
        if (product) {
          // Add new item to user cart
          userCart.items.push({
            product: guestItem.productId,
            name: product.name,
            quantity: guestItem.quantity,
            price: product.discountPrice || product.price,
            image: product.images?.[0] || product.thumbnail,
          });
        }
      }
    }

    // Update cart totals
    userCart.totalItems = userCart.items.reduce((total, item) => total + item.quantity, 0);
    userCart.totalPrice = userCart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

    // Save the updated cart
    await userCart.save();

    res.status(200).json({
      success: true,
      message: 'Carts merged successfully',
      data: userCart,
    });
  } catch (error) {
    next(new AppError(`Error merging carts: ${error.message}`, 500));
  }
};

/**
 * @desc    Add item to cart
 * @route   POST /api/cart
 * @access  Private
 */
export const addToCart = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { productId, quantity = 1 } = req.body;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    // Get or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [],
        totalPrice: 0,
        totalItems: 0,
      });
    }

    // Check if product already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId.toString(),
    );

    if (existingItemIndex > -1) {
      // Update quantity if product already in cart
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      cart.items.push({
        product: productId,
        name: product.name,
        quantity,
        price: product.discountPrice || product.price,
        image: product.images?.[0] || product.thumbnail,
      });
    }

    // Update cart totals
    cart.totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
    cart.totalPrice = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

    // Save the cart
    await cart.save();

    res.status(200).json({
      status: 'success',
      message: 'Product added to cart',
      data: {
        items: cart.items,
        totalItems: cart.totalItems,
        totalPrice: cart.totalPrice,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add item to guest cart
 * @route   POST /api/cart/guest/:sessionId
 * @access  Public
 */
export const addToGuestCart = async (req, res, next) => {
  try {
    const {
      sessionId, productId, quantity = 1, name, price, discountPrice, image,
    } = req.body;

    if (!sessionId || !productId) {
      return next(new AppError('Session ID and product ID are required', 400));
    }

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product && !name) {
      return next(new AppError('Product not found', 404));
    }

    // Get or create guest cart
    let cart = await Cart.findOne({ sessionId });
    if (!cart) {
      cart = new Cart({
        sessionId,
        items: [],
        totalPrice: 0,
        totalItems: 0,
      });
    }

    // Check if product already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.product?.toString() === productId.toString(),
    );

    if (existingItemIndex > -1) {
      // Update quantity if product already in cart
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      cart.items.push({
        product: productId,
        name: name || product.name,
        quantity,
        price: discountPrice || price || (product.discountPrice || product.price),
        image: image || product.images?.[0] || product.thumbnail,
      });
    }

    // Update cart totals
    cart.totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
    cart.totalPrice = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

    // Save the cart
    await cart.save();

    res.status(200).json({
      status: 'success',
      message: 'Product added to guest cart',
      data: {
        items: cart.items,
        totalItems: cart.totalItems,
        totalPrice: cart.totalPrice,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/cart/:itemId
 * @access  Private
 */
export const updateCartItem = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return next(new AppError('Product ID and quantity are required', 400));
    }

    if (quantity < 1) {
      return next(new AppError('Quantity must be at least 1', 400));
    }

    // Get cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }

    // Find the item in the cart
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId.toString(),
    );

    if (itemIndex === -1) {
      return next(new AppError('Product not found in cart', 404));
    }

    // Get the product to check stock
    const product = await Product.findById(cart.items[itemIndex].product);
    if (!product) {
      return next(new AppError('Product no longer exists', 404));
    }

    // Check if requested quantity is available
    if (product.stock < quantity) {
      return next(new AppError(`Only ${product.stock} items available in stock`, 400));
    }

    // Update the quantity
    cart.items[itemIndex].quantity = quantity;

    // Update cart totals
    cart.totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
    cart.totalPrice = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

    // Save the cart
    await cart.save();

    res.status(200).json({
      status: 'success',
      message: 'Cart updated',
      data: {
        items: cart.items,
        totalItems: cart.totalItems,
        totalPrice: cart.totalPrice,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/remove/:productId
 * @access  Private
 */
export const removeCartItem = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    // Get cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }

    // Remove item from cart
    cart.items = cart.items.filter((item) => item.product.toString() !== productId);

    // Update cart totals
    cart.totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
    cart.totalPrice = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

    // Save the cart
    await cart.save();

    res.status(200).json({
      status: 'success',
      message: 'Item removed from cart',
      data: {
        items: cart.items,
        totalItems: cart.totalItems,
        totalPrice: cart.totalPrice,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Clear cart
 * @route   DELETE /api/cart
 * @access  Private
 */
export const clearCart = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }

    // Clear the cart
    cart.items = [];
    cart.totalItems = 0;
    cart.totalPrice = 0;

    // Save the cart
    await cart.save();

    res.status(200).json({
      status: 'success',
      message: 'Cart cleared',
      data: {
        items: [],
        totalItems: 0,
        totalPrice: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Calculate detailed cart pricing
 * @route   GET /api/cart/pricing
 * @access  Private
 */
export const getCartPricing = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find cart for user
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }

    // Get query parameters
    const { promoCode } = req.query;

    // Calculate detailed pricing
    const pricingDetails = promoCode
      ? await applyPromoCodeToCart(cart, promoCode)
      : {
        success: true,
        pricing: calculateCartPricing(cart.items),
      };

    res.status(200).json({
      success: true,
      data: {
        cart,
        pricing: pricingDetails.pricing,
        promoApplied: promoCode ? pricingDetails.success : false,
        promoMessage: pricingDetails.message || null,
      },
    });
  } catch (error) {
    next(new AppError(`Error calculating cart pricing: ${error.message}`, 500));
  }
};

/**
 * @desc    Apply promo code to cart
 * @route   POST /api/cart/promo
 * @access  Private
 */
export const applyPromoCode = async (req, res, next) => {
  try {
    const { promoCode } = req.body;
    const userId = req.user._id;

    if (!promoCode) {
      return next(new AppError('Promo code is required', 400));
    }

    // Find cart for user
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }

    // Apply promo code to cart
    const result = await applyPromoCodeToCart(cart, promoCode);

    if (!result.success) {
      return next(new AppError(result.message, 400));
    }

    // Store promo code on cart for future reference (optional)
    cart.promoCode = promoCode;
    await cart.save();

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        cart,
        pricing: result.pricing,
        promoDetails: result.promoDetails,
      },
    });
  } catch (error) {
    next(new AppError(`Error applying promo code: ${error.message}`, 500));
  }
};

/**
 * Update an item in a guest cart
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const updateGuestCartItem = async (req, res, next) => {
  try {
    const { sessionId, productId, quantity } = req.body;

    if (!sessionId || !productId || quantity === undefined) {
      return next(new AppError('Session ID, product ID and quantity are required', 400));
    }

    if (quantity < 1) {
      return next(new AppError('Quantity must be at least 1', 400));
    }

    // Get cart
    const cart = await Cart.findOne({ sessionId });
    if (!cart) {
      return next(new AppError('Guest cart not found', 404));
    }

    // Find the item in the cart
    const itemIndex = cart.items.findIndex(
      (item) => item.product?.toString() === productId.toString(),
    );

    if (itemIndex === -1) {
      return next(new AppError('Product not found in guest cart', 404));
    }

    // Update the quantity
    cart.items[itemIndex].quantity = quantity;

    // Update cart totals
    cart.totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
    cart.totalPrice = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

    // Save the cart
    await cart.save();

    res.status(200).json({
      status: 'success',
      message: 'Guest cart updated',
      data: {
        items: cart.items,
        totalItems: cart.totalItems,
        totalPrice: cart.totalPrice,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove an item from a guest cart
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const removeFromGuestCart = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { sessionId } = req.query;

    if (!sessionId) {
      return next(new AppError('Session ID is required', 400));
    }

    // Get cart
    const cart = await Cart.findOne({ sessionId });
    if (!cart) {
      return next(new AppError('Guest cart not found', 404));
    }

    // Remove the item from the cart
    cart.items = cart.items.filter((item) => item.product?.toString() !== productId.toString());

    // Update cart totals
    cart.totalItems = cart.items.reduce((total, item) => total + item.quantity, 0);
    cart.totalPrice = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

    // Save the cart
    await cart.save();

    res.status(200).json({
      status: 'success',
      message: 'Product removed from guest cart',
      data: {
        items: cart.items,
        totalItems: cart.totalItems,
        totalPrice: cart.totalPrice,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear a guest cart
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const clearGuestCart = async (req, res, next) => {
  try {
    const { sessionId } = req.query;

    if (!sessionId) {
      return next(new AppError('Session ID is required', 400));
    }

    // Get cart
    const cart = await Cart.findOne({ sessionId });
    if (!cart) {
      return next(new AppError('Guest cart not found', 404));
    }

    // Clear the cart
    cart.items = [];
    cart.totalItems = 0;
    cart.totalPrice = 0;

    // Save the cart
    await cart.save();

    res.status(200).json({
      status: 'success',
      message: 'Guest cart cleared',
      data: {
        items: [],
        totalItems: 0,
        totalPrice: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
