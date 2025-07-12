import api from './api';
import { getOrders, getOrderById, getOrdersByUserId, updateOrderStatus, createOrder } from './mockData';

const USE_MOCK = false; // Toggle this to switch between mock and real API

export const orderService = {
  /**
   * Create a new order
   * @param {Object} orderData - Order data
   * @returns {Promise} Promise with order data
   */
  createOrder: async (orderData) => {
    try {
      // For guest orders, use the guest endpoint
      const endpoint = orderData.guestInfo ? '/orders/guest' : '/orders';
      const response = await api.post(endpoint, orderData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'خطا در ایجاد سفارش';
    }
  },
  
  /**
   * Get user orders
   * @returns {Promise} Promise with order list
   */
  getUserOrders: async () => {
    try {
      const response = await api.get('/orders/user');
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'خطا در دریافت سفارشات';
    }
  },
  
  /**
   * Get order details
   * @param {string} orderId - Order ID
   * @returns {Promise} Promise with order details
   */
  getOrderDetails: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'خطا در دریافت جزئیات سفارش';
    }
  },
  
  /**
   * Get order by tracking code (can be used by guests)
   * @param {string} trackingCode - Order tracking code
   * @param {string} phoneNumber - Phone number used for the order
   * @returns {Promise} Promise with order details
   */
  getOrderByTracking: async (trackingCode, phoneNumber) => {
    try {
      const response = await api.get(`/orders/tracking/${trackingCode}`, {
        params: { phone: phoneNumber }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'خطا در دریافت اطلاعات سفارش';
    }
  },
  
  /**
   * Cancel an order
   * @param {string} orderId - Order ID
   * @returns {Promise} Promise with result
   */
  cancelOrder: async (orderId) => {
    try {
      const response = await api.post(`/orders/${orderId}/cancel`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'خطا در لغو سفارش';
    }
  },

  // Admin functions
  getAllOrders: async (params = {}) => {
    if (USE_MOCK) {
      return getOrders();
    }
    const response = await api.get('/orders', { params });
    return response.data;
  },

  updateOrderStatus: async (id, status) => {
    if (USE_MOCK) {
      return updateOrderStatus(id, status);
    }
    const response = await api.put(`/orders/${id}/status`, { status });
    return response.data;
  }
};

export default orderService;
