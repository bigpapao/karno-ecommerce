import Cart from '../models/cart.model.js';
import Product from '../models/product.model.js';
import { AppError } from '../middleware/errorHandler.js';
import User from '../models/user.model.js';
import { 
  validateProductForCart, 
  formatProductForCart,
  updateCartTotals
} from '../utils/cart.utils.js';
import { 
  calculateCartPricing, 
  validatePromoCode,
  applyPromoCodeToCart
} from '../services/pricing.service.js';

/**
 * @desc    Get cart for a user
 * @route   GET /api/cart
 * @access  Private
 */
export const getCart = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find cart for user or create new one
    let cart = await Cart.findOne({ user: userId });

    // If cart doesn't exist, create a new empty one
    if (!cart) {
      cart = await Cart.create({
        user: userId,
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
    next(new AppError(`Error retrieving cart: ${error.message}`, 500));
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
 * @route   POST /api/cart/merge/:sessionId
 * @access  Private
 */
export const mergeGuestCart = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    if (!sessionId) {
      return next(new AppError('Session ID is required', 400));
    }

    // Find guest cart
    const guestCart = await Cart.findOne({ sessionId });
    if (!guestCart) {
      return next(new AppError('Guest cart not found', 404));
    }

    // Find user cart or create new one
    let userCart = await Cart.findOne({ user: userId });
    if (!userCart) {
      userCart = new Cart({
        user: userId,
        items: [],
      });
    }

    // Merge items from guest cart to user cart
    for (const guestItem of guestCart.items) {
      const existingItemIndex = userCart.items.findIndex(
        (item) => item.product.toString() === guestItem.product.toString()
      );

      if (existingItemIndex > -1) {
        // Add quantities if product already exists in user cart
        userCart.items[existingItemIndex].quantity += guestItem.quantity;
      } else {
        // Add new item to user cart
        userCart.items.push({
          product: guestItem.product,
          name: guestItem.name,
          quantity: guestItem.quantity,
          price: guestItem.price,
          image: guestItem.image,
        });
      }
    }

    // Update cart totals and save
    updateCartTotals(userCart);
    await userCart.save();

    // Delete guest cart
    await Cart.findByIdAndDelete(guestCart._id);

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
    const { productId, quantity = 1 } = req.body;
    const userId = req.user._id;

    try {
      // Validate product
      const product = await validateProductForCart(productId, quantity);
      
      // Find user cart
      let cart = await Cart.findOne({ user: userId });

      // If cart doesn't exist, create a new one
      if (!cart) {
        cart = new Cart({
          user: userId,
          items: [],
        });
      }

      // Check if product already exists in cart
      const existingItemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (existingItemIndex > -1) {
        // Update quantity if product already in cart
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        // Add new item to cart
        cart.items.push(formatProductForCart(product, quantity));
      }

      // Update totals and save cart
      updateCartTotals(cart);
      await cart.save();

      res.status(200).json({
        success: true,
        message: 'Product added to cart',
        data: cart,
      });
    } catch (error) {
      // This catches AppError from validateProductForCart
      return next(error);
    }
  } catch (error) {
    next(new AppError(`Error adding to cart: ${error.message}`, 500));
  }
};

/**
 * @desc    Add item to guest cart
 * @route   POST /api/cart/guest/:sessionId
 * @access  Public
 */
export const addToGuestCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const { sessionId } = req.params;

    if (!sessionId) {
      return next(new AppError('Session ID is required', 400));
    }

    try {
      // Validate product
      const product = await validateProductForCart(productId, quantity);
      
      // Find guest cart
      let cart = await Cart.findOne({ sessionId });

      // If cart doesn't exist, create a new one with a temporary user
      if (!cart) {
        // Create a temporary user for the guest cart
        const tempUser = await User.create({
          phone: `temp-${sessionId}`,
          role: 'user',
          phoneVerified: false,
        });

        cart = new Cart({
          user: tempUser._id,
          sessionId,
          items: [],
        });
      }

      // Check if product already exists in cart
      const existingItemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (existingItemIndex > -1) {
        // Update quantity if product already in cart
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        // Add new item to cart
        cart.items.push(formatProductForCart(product, quantity));
      }

      // Update totals and save cart
      updateCartTotals(cart);
      await cart.save();

      res.status(200).json({
        success: true,
        message: 'Product added to guest cart',
        data: cart,
      });
    } catch (error) {
      // This catches AppError from validateProductForCart
      return next(error);
    }
  } catch (error) {
    next(new AppError(`Error adding to guest cart: ${error.message}`, 500));
  }
};

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/cart/:itemId
 * @access  Private
 */
export const updateCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!quantity || quantity < 1) {
      return next(new AppError('Quantity must be at least 1', 400));
    }

    // Find user cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }

    // Find the cart item
    const cartItem = cart.items.id(itemId);
    if (!cartItem) {
      return next(new AppError('Cart item not found', 404));
    }

    // Get the product to check stock
    const product = await Product.findById(cartItem.product);
    if (!product) {
      return next(new AppError('Product no longer exists', 404));
    }

    // Check if requested quantity is available
    if (product.stock < quantity) {
      return next(new AppError(`Only ${product.stock} items available in stock`, 400));
    }

    // Update quantity
    cartItem.quantity = quantity;

    // Update totals and save cart
    updateCartTotals(cart);
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart item updated',
      data: cart,
    });
  } catch (error) {
    next(new AppError(`Error updating cart item: ${error.message}`, 500));
  }
};

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/:itemId
 * @access  Private
 */
export const removeCartItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id;

    // Find user cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }

    // Remove item from cart
    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);

    // Update totals and save cart
    updateCartTotals(cart);
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: cart,
    });
  } catch (error) {
    next(new AppError(`Error removing item from cart: ${error.message}`, 500));
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

    // Find user cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }

    // Clear cart items
    cart.items = [];
    
    // Update totals and save cart
    updateCartTotals(cart);
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      data: cart,
    });
  } catch (error) {
    next(new AppError(`Error clearing cart: ${error.message}`, 500));
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
          pricing: calculateCartPricing(cart.items) 
        };

    res.status(200).json({
      success: true,
      data: {
        cart,
        pricing: pricingDetails.pricing,
        promoApplied: promoCode ? pricingDetails.success : false,
        promoMessage: pricingDetails.message || null,
      }
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
      }
    });
  } catch (error) {
    next(new AppError(`Error applying promo code: ${error.message}`, 500));
  }
}; 