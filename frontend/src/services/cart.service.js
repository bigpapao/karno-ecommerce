import api from './api';

export const cartService = {
  // Get user's cart from server
  async getCart() {
    try {
      const response = await api.get('/cart');
      return response.data;
    } catch (error) {
      // Error fetching cart handled by caller
      throw error.response?.data || error;
    }
  },

  // Add item to cart
  async addItem(item) {
    try {
      const response = await api.post('/cart/add', item);
      return response.data;
    } catch (error) {
      // Error adding item to cart handled by caller
      throw error.response?.data || error;
    }
  },

  // Update item quantity in cart
  async updateQuantity(productId, quantity) {
    try {
      const response = await api.put(`/cart/update/${productId}`, { quantity });
      return response.data;
    } catch (error) {
      // Error updating cart quantity handled by caller
      throw error.response?.data || error;
    }
  },

  // Remove item from cart
  async removeItem(productId) {
    try {
      const response = await api.delete(`/cart/remove/${productId}`);
      return response.data;
    } catch (error) {
      // Error removing item from cart handled by caller
      throw error.response?.data || error;
    }
  },

  // Clear entire cart
  async clearCart() {
    try {
      const response = await api.delete('/cart/clear');
      return response.data;
    } catch (error) {
      // Error clearing cart handled by caller
      throw error.response?.data || error;
    }
  },

  // Sync guest cart with user cart (merge)
  async syncCart(guestCartItems) {
    try {
      const response = await api.post('/cart/sync', { items: guestCartItems });
      return response.data;
    } catch (error) {
      // Error syncing cart handled by caller
      throw error.response?.data || error;
    }
  }
};