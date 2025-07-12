/**
 * Cart Utilities
 * 
 * This file contains utility functions for cart operations
 * including persistent storage and API interactions.
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { addToCart as addCartItem, removeFromCart as removeCartItem, updateCartQuantity, clearCart } from '../store/slices/cartSlice';
import { toast } from 'react-toastify';
import api from '../services/api';
import { getSessionId, isGuestSession } from './sessionUtils';

/**
 * Add an item to the cart (handles both authenticated users and guests)
 * 
 * @param {Object} product - Product to add to cart
 * @param {number} quantity - Quantity to add
 * @param {Function} dispatch - Redux dispatch function
 * @param {boolean} isAuthenticated - Whether user is authenticated
 * @returns {Promise} Promise that resolves when the item is added
 */
export const addToCart = async (product, quantity, dispatch, isAuthenticated) => {
  try {
    if (isAuthenticated) {
      // For authenticated users, use the API
      const response = await api.post('/cart/add', {
        productId: product._id || product.id,
        quantity,
      });
      
      // Return the response data
      return response.data;
    } else {
      // For guests, use local storage + session ID
      const sessionId = getSessionId();
      
      // Add to guest cart in local storage
      const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
      
      // Check if product already exists in cart
      const productId = product._id || product.id;
      const existingItemIndex = cartItems.findIndex(item => item.id === productId);
      
      if (existingItemIndex >= 0) {
        // Update quantity if product already exists
        cartItems[existingItemIndex].quantity += quantity;
      } else {
        // Add new product to cart
        cartItems.push({
          id: productId,
          name: product.name,
          price: product.price,
          discountPrice: product.discountPrice,
          image: product.image || product.images?.[0],
          quantity,
          slug: product.slug,
          brand: product.brand,
          inStock: product.inStock !== false, // Default to true if not specified
          stockQuantity: product.stockQuantity || 10
        });
      }
      
      // Save to local storage
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      
      // Also sync with server-side guest cart
      try {
        await api.post('/cart/guest/add', {
          sessionId,
          productId: productId,
          quantity,
          name: product.name,
          price: product.price,
          discountPrice: product.discountPrice,
          image: product.image || product.images?.[0]
        });
      } catch (error) {
        console.warn('Failed to sync guest cart with server', error);
        // Continue anyway, as we've updated the local storage
      }
      
      // Return synthetic response
      return {
        status: 'success',
        message: 'Product added to cart',
        data: {
          cartItems,
          totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
          totalPrice: cartItems.reduce((sum, item) => sum + (item.discountPrice || item.price) * item.quantity, 0)
        }
      };
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
};

/**
 * Remove an item from the cart
 * 
 * @param {string} productId - ID of product to remove
 * @param {Function} dispatch - Redux dispatch function
 * @param {boolean} isAuthenticated - Whether user is authenticated
 * @returns {Promise} Promise that resolves when the item is removed
 */
export const removeFromCart = async (productId, dispatch, isAuthenticated) => {
  try {
    if (isAuthenticated) {
      // For authenticated users, use the API
      const response = await api.delete(`/cart/remove/${productId}`);
      return response.data;
    } else {
      // For guests, use local storage
      const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
      
      // Remove the item
      const updatedCartItems = cartItems.filter(item => item.id !== productId);
      
      // Save to local storage
      localStorage.setItem('cartItems', JSON.stringify(updatedCartItems));
      
      // Also sync with server-side guest cart
      try {
        const sessionId = getSessionId();
        await api.delete(`/cart/guest/remove/${productId}?sessionId=${sessionId}`);
      } catch (error) {
        console.warn('Failed to sync guest cart deletion with server', error);
        // Continue anyway, as we've updated the local storage
      }
      
      // Return synthetic response
      return {
        status: 'success',
        message: 'Product removed from cart',
        data: {
          cartItems: updatedCartItems,
          totalItems: updatedCartItems.reduce((sum, item) => sum + item.quantity, 0),
          totalPrice: updatedCartItems.reduce((sum, item) => sum + (item.discountPrice || item.price) * item.quantity, 0)
        }
      };
    }
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
};

/**
 * Update the quantity of an item in the cart
 * 
 * @param {string} productId - ID of product to update
 * @param {number} quantity - New quantity
 * @param {Function} dispatch - Redux dispatch function
 * @param {boolean} isAuthenticated - Whether user is authenticated
 * @returns {Promise} Promise that resolves when the item is updated
 */
export const updateCartItemQuantity = async (productId, quantity, dispatch, isAuthenticated) => {
  try {
    if (isAuthenticated) {
      // For authenticated users, use the API
      const response = await api.put('/cart/update', {
        productId,
        quantity,
      });
      return response.data;
    } else {
      // For guests, use local storage
      const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
      
      // Find and update the item
      const itemIndex = cartItems.findIndex(item => item.id === productId);
      
      if (itemIndex >= 0) {
        cartItems[itemIndex].quantity = quantity;
      }
      
      // Save to local storage
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
      
      // Also sync with server-side guest cart
      try {
        const sessionId = getSessionId();
        await api.put('/cart/guest/update', {
          sessionId,
          productId,
          quantity
        });
      } catch (error) {
        console.warn('Failed to sync guest cart update with server', error);
        // Continue anyway, as we've updated the local storage
      }
      
      // Return synthetic response
      return {
        status: 'success',
        message: 'Cart updated',
        data: {
          cartItems,
          totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
          totalPrice: cartItems.reduce((sum, item) => sum + (item.discountPrice || item.price) * item.quantity, 0)
        }
      };
    }
  } catch (error) {
    console.error('Error updating cart:', error);
    throw error;
  }
};

/**
 * Clear the entire cart
 * 
 * @param {Function} dispatch - Redux dispatch function
 * @param {boolean} isAuthenticated - Whether user is authenticated
 * @returns {Promise} Promise that resolves when the cart is cleared
 */
export const clearEntireCart = async (dispatch, isAuthenticated) => {
  try {
    if (isAuthenticated) {
      // For authenticated users, use the API
      const response = await api.delete('/cart/clear');
      return response.data;
    } else {
      // For guests, clear local storage
      localStorage.removeItem('cartItems');
      
      // Also sync with server-side guest cart
      try {
        const sessionId = getSessionId();
        await api.delete(`/cart/guest/clear?sessionId=${sessionId}`);
      } catch (error) {
        console.warn('Failed to sync guest cart clearing with server', error);
        // Continue anyway, as we've updated the local storage
      }
      
      // Return synthetic response
      return {
        status: 'success',
        message: 'Cart cleared',
        data: {
          cartItems: [],
          totalItems: 0,
          totalPrice: 0
        }
      };
    }
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
};

/**
 * Get cart items (from API for authenticated users, or local storage for guests)
 * 
 * @param {boolean} isAuthenticated - Whether user is authenticated
 * @returns {Promise} Promise that resolves to cart items
 */
export const getCartItems = async (isAuthenticated) => {
  try {
    if (isAuthenticated) {
      // For authenticated users, use the API
      const response = await api.get('/cart');
      return response.data;
    } else {
      // For guests, use local storage
      const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
      
      // Return synthetic response
      return {
        status: 'success',
        data: {
          items: cartItems,
          totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
          totalPrice: cartItems.reduce((sum, item) => sum + (item.discountPrice || item.price) * item.quantity, 0)
        }
      };
    }
  } catch (error) {
    console.error('Error getting cart items:', error);
    throw error;
  }
};

/**
 * Load cart from local storage (for guest users)
 * @param {Function} dispatch - Redux dispatch function
 */
export const loadCartFromLocalStorage = (dispatch) => {
  try {
    const cartData = localStorage.getItem('cart');
    if (cartData) {
      const cart = JSON.parse(cartData);
      // Dispatch all items to redux
      cart.items.forEach(item => {
        dispatch(addCartItem(item));
      });
    }
  } catch (error) {
    console.error('Failed to load cart from local storage', error);
    // If there's an error, clear corrupted data
    localStorage.removeItem('cart');
  }
};

/**
 * Save cart to local storage (for guest users)
 * @param {Object} cart - The cart data from Redux store
 */
export const saveCartToLocalStorage = (cart) => {
  try {
    localStorage.setItem('cart', JSON.stringify(cart));
  } catch (error) {
    console.error('Failed to save cart to local storage', error);
  }
};

/**
 * Merge guest cart with user cart after login
 * @param {Array} guestItems - Guest cart items
 * @param {Array} userItems - User cart items from API
 * @param {Function} dispatch - Redux dispatch function
 */
export const mergeCartsAfterLogin = async (guestItems, userItems, dispatch) => {
  if (!guestItems || guestItems.length === 0) {
    return;
  }
  
  try {
    // First clear current cart
    dispatch(clearCart());
    
    // Create a map of user items by ID for easier lookup
    const userItemsMap = userItems.reduce((map, item) => {
      map[item.id] = item;
      return map;
    }, {});
    
    // Process guest items
    for (const guestItem of guestItems) {
      if (userItemsMap[guestItem.id]) {
        // Item exists in both carts, use user's item but add quantities
        const mergedItem = {
          ...userItemsMap[guestItem.id],
          quantity: userItemsMap[guestItem.id].quantity + guestItem.quantity
        };
        dispatch(addCartItem(mergedItem));
      } else {
        // Item only in guest cart, add it to user cart
        dispatch(addCartItem(guestItem));
      }
    }
    
    // Simulate API call to merge carts on server
    await simulateApiCall('merge', { items: getCartFromReduxStore().items });
    
    // Clear local storage cart after successful merge
    localStorage.removeItem('cart');
  } catch (error) {
    console.error('Failed to merge carts', error);
    throw error;
  }
};

/**
 * Get cart from Redux store via getState
 * Used internally by the functions in this file
 * @returns {Object} - The cart data from Redux store
 */
const getCartFromReduxStore = () => {
  // In a real implementation, we would get this from Redux
  // For simplicity in this utility file, we'll return a mock
  // When integrated with the app, this would be replaced with
  // store.getState().cart
  
  // Mock implementation
  const cart = JSON.parse(localStorage.getItem('cart') || '{"items":[],"total":0,"quantity":0}');
  return cart;
};

/**
 * Simulate API call for cart operations
 * @param {string} operation - The operation (add, update, remove, clear, merge)
 * @param {Object} data - The data for the operation
 * @returns {Promise} - Promise that resolves after simulated delay
 */
const simulateApiCall = (operation, data) => {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      console.log(`[API Simulation] ${operation} cart operation:`, data);
      resolve({ success: true, data });
    }, 500);
  });
};

/**
 * Calculate cart totals (used for display in components)
 * @param {Array} items - Cart items
 * @returns {Object} - Object with total and quantity
 */
export const calculateCartTotals = (items) => {
  return items.reduce(
    (totals, item) => {
      const itemPrice = item.discountPrice || item.price;
      return {
        total: totals.total + itemPrice * item.quantity,
        quantity: totals.quantity + item.quantity,
      };
    },
    { total: 0, quantity: 0 }
  );
};

/**
 * Check if an item is in the cart
 * @param {string|number} productId - The product ID
 * @param {Array} cartItems - The cart items array
 * @returns {boolean} - True if item is in cart
 */
export const isItemInCart = (productId, cartItems) => {
  return cartItems.some(item => item.id.toString() === productId.toString());
};

/**
 * Get cart item quantity
 * @param {string|number} productId - The product ID
 * @param {Array} cartItems - The cart items array
 * @returns {number} - Quantity (0 if not in cart)
 */
export const getCartItemQuantity = (productId, cartItems) => {
  const item = cartItems.find(item => item.id.toString() === productId.toString());
  return item ? item.quantity : 0;
};
