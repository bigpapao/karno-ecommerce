import api from './api';
import { getUsers, getUserById, getUserByEmail, createUser, updateUser, updateUserStatus, addUserAddress } from './mockData';

const USE_MOCK = false; // Toggle this to switch between mock and real API

export const userService = {
  getUsers: async (params = {}) => {
    if (USE_MOCK) {
      return getUsers();
    }
    const response = await api.get('/users', { params });
    return response.data;
  },

  getUserById: async (id) => {
    if (USE_MOCK) {
      return getUserById(id);
    }
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  getUserByEmail: async (email) => {
    if (USE_MOCK) {
      return getUserByEmail(email);
    }
    const response = await api.get(`/users/email/${email}`);
    return response.data;
  },

  createUser: async (userData) => {
    if (USE_MOCK) {
      return createUser(userData);
    }
    const response = await api.post('/users', userData);
    return response.data;
  },

  updateUser: async (id, userData) => {
    if (USE_MOCK) {
      return updateUser(id, userData);
    }
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  updateUserStatus: async (id, status) => {
    if (USE_MOCK) {
      return updateUserStatus(id, status);
    }
    const response = await api.put(`/users/${id}/status`, { status });
    return response.data;
  },

  addUserAddress: async (userId, addressData) => {
    if (USE_MOCK) {
      return addUserAddress(userId, addressData);
    }
    const response = await api.post(`/users/${userId}/addresses`, addressData);
    return response.data;
  },

  // Auth functions
  login: async (credentials) => {
    if (USE_MOCK) {
      const { email, password } = credentials;
      const user = await getUserByEmail(email);
      
      if (!user) {
        return Promise.reject(new Error('Invalid credentials'));
      }
      
      // In mock mode, we accept any password for testing
      return Promise.resolve({
        user,
        token: 'mock-jwt-token'
      });
    }
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData) => {
    if (USE_MOCK) {
      const existingUser = await getUserByEmail(userData.email);
      if (existingUser) {
        return Promise.reject(new Error('Email already exists'));
      }
      
      const newUser = await createUser({
        ...userData,
        role: 'user',
        status: 'active'
      });
      
      return Promise.resolve({
        user: newUser,
        token: 'mock-jwt-token'
      });
    }
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  logout: async () => {
    if (USE_MOCK) {
      return Promise.resolve({ success: true });
    }
    const response = await api.post('/auth/logout');
    return response.data;
  },

  forgotPassword: async (email) => {
    if (USE_MOCK) {
      const user = await getUserByEmail(email);
      if (!user) {
        return Promise.reject(new Error('User not found'));
      }
      return Promise.resolve({
        success: true,
        message: 'Password reset instructions sent to your email'
      });
    }
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token, newPassword) => {
    if (USE_MOCK) {
      // In mock mode, we just acknowledge the password reset
      return Promise.resolve({
        success: true,
        message: 'Password reset successfully'
      });
    }
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  changePassword: async (oldPassword, newPassword) => {
    if (USE_MOCK) {
      // In mock mode, we just acknowledge the password change
      return Promise.resolve({
        success: true,
        message: 'Password changed successfully'
      });
    }
    const response = await api.post('/auth/change-password', { oldPassword, newPassword });
    return response.data;
  }
};

export default userService; 