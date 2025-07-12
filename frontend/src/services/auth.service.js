import api from './api';
import { getUserByEmail, getUserById } from './mockData';
import { getSessionId } from '../utils/sessionUtils';

const USE_MOCK = false; // Set to false to use the real API instead of mock data

export const authService = {
  requestPhoneVerification: async (phone, purpose = 'login') => {
    if (USE_MOCK) {
      // In mock mode, we just simulate a successful verification code request
      return Promise.resolve({
        status: 'success',
        message: 'Verification code sent successfully',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
      });
    }
    
    try {
      const response = await api.post('/auth/request-verification', { phone, purpose });
      return response.data;
    } catch (error) {
      if (error.response?.status === 429) {
        // Rate limiting error
        throw {
          message: 'محدودیت ارسال کد تأیید. لطفا کمی صبر کنید و دوباره تلاش کنید.',
          rateLimited: true,
          rateLimitSeconds: error.response?.data?.rateLimitSeconds || 60,
          attemptsRemaining: error.response?.data?.attemptsRemaining || 0
        };
      }
      throw error.response?.data?.message || 'خطا در ارسال کد تأیید';
    }
  },

  verifyPhone: async (data) => {
    if (USE_MOCK) {
      // In mock mode, we simulate a successful verification
      const mockUser = {
        _id: 'mock-user-123',
        firstName: data.firstName || 'کاربر',
        lastName: data.lastName || 'تست',
        phone: data.phone,
        email: 'user@example.com',
        isPhoneVerified: true,
        createdAt: new Date().toISOString()
      };
      
      return Promise.resolve({
        status: 'success',
        message: 'شماره موبایل با موفقیت تأیید شد',
        data: {
          user: mockUser,
          token: 'mock-token-123',
          isNewUser: !data.firstName // If firstName is provided, assume existing user
        }
      });
    }
    
    try {
      const response = await api.post('/auth/verify-phone', data);
      return response.data;
    } catch (error) {
      if (error.response?.data?.attemptsRemaining !== undefined) {
        throw {
          message: error.response.data.message || 'کد تأیید نامعتبر است',
          attemptsRemaining: error.response.data.attemptsRemaining
        };
      }
      throw error.response?.data?.message || 'خطا در تأیید کد';
    }
  },
  
  login: async (data) => {
    if (USE_MOCK) {
      // In mock mode, we simulate a successful login
      const mockUser = getUserByEmail(data.email) || {
        _id: 'mock-user-123',
        firstName: 'کاربر',
        lastName: 'تست',
        phone: data.phone,
        email: 'user@example.com',
        createdAt: new Date().toISOString()
      };
      
      // If rememberMe is true, we'd set a longer expiry on the token
      if (data.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }
      
      return Promise.resolve({
        status: 'success',
        message: 'ورود با موفقیت انجام شد',
        user: mockUser,
        token: 'mock-token-123'
      });
    }
    
    try {
      // Include the session ID to facilitate merging guest cart data
      const sessionId = getSessionId();
      const loginData = { ...data };
      
      // Add sessionId to request if available
      if (sessionId) {
        loginData.sessionId = sessionId;
      }
      console.log("🔍 Sending login payload:", loginData);
      
      const response = await api.post('/auth/login', loginData);
      
      // Handle remember me - only store preference, not tokens
      if (data.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'خطا در ورود';
    }
  },
  
  register: async (data) => {
    if (USE_MOCK) {
      // In mock mode, we simulate a successful registration
      const mockUser = {
        _id: 'mock-user-' + Date.now(),
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        createdAt: new Date().toISOString()
      };
      
      return Promise.resolve({
        status: 'success',
        message: 'ثبت نام با موفقیت انجام شد',
        user: mockUser,
        token: 'mock-token-123'
      });
    }
    
    try {
      // Map legacy "mobile" field to "phone" and remove disallowed fields
      const registerData = { ...data };
      if (registerData.mobile) {
        registerData.phone = registerData.mobile;
        delete registerData.mobile;
      }

      // The new backend registration flow does NOT accept sessionId
      delete registerData.sessionId;

      console.log('Sending registration data (sanitized):', registerData);
      const response = await api.post('/auth/register', registerData);
      
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      
      // If we have a response from the server
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle CSRF token errors
        if (error.response.status === 403 && errorData.message?.includes('CSRF')) {
          throw {
            message: 'خطای امنیتی. لطفاً صفحه را رفرش کنید و دوباره تلاش کنید.',
            statusCode: error.response.status
          };
        }
        
        // Handle validation errors (400 and 422 status codes)
        if ((error.response.status === 400 || error.response.status === 422) && errorData.errors && Array.isArray(errorData.errors)) {
          const fieldErrors = {};
          
          // Convert array of errors to object with field keys
          errorData.errors.forEach(err => {
            fieldErrors[err.field] = err.msg;
          });
          
          throw {
            message: errorData.message || 'خطا در اعتبارسنجی اطلاعات',
            fieldErrors,
            validationError: true,
            statusCode: error.response.status
          };
        }
        
        // Handle duplicate user errors (409 status code)
        if (error.response.status === 409 && errorData.errors && Array.isArray(errorData.errors)) {
          const fieldErrors = {};
          
          // Convert array of errors to object with field keys
          errorData.errors.forEach(err => {
            fieldErrors[err.field] = err.msg;
          });
          
          throw {
            message: errorData.message || 'کاربری با این مشخصات قبلاً ثبت نام کرده است',
            fieldErrors,
            validationError: true,
            statusCode: error.response.status
          };
        }
        
        // For other server errors with data
        throw {
          message: errorData.message || errorData.error?.message || 'خطا در ثبت نام',
          statusCode: error.response.status,
          data: errorData
        };
      }
      
      // For network errors or other issues without a response
      throw {
        message: error.message || 'خطا در ارتباط با سرور',
        statusCode: error.status || 500
      };
    }
  },

  verifyEmail: async (token) => {
    try {
    const response = await api.get(`/auth/verify-email/${token}`);
    return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Email verification failed.';
    }
  },

  getProfile: async () => {
    if (USE_MOCK) {
      // In mock mode, we return the user from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return Promise.resolve({
        status: 'success',
        data: { user }
      });
    }
    
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch profile.';
    }
  },

  updateProfile: async (userData) => {
    if (USE_MOCK) {
      // In mock mode, we update the user in localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...currentUser,
        ...userData
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return Promise.resolve({
        status: 'success',
        message: 'Profile updated successfully',
        data: { user: updatedUser }
      });
    }
    
    try {
      const response = await api.put('/auth/profile', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to update profile.';
    }
  },

  forgotPassword: async (email) => {
    try {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to process password reset request.';
    }
  },

  resetPassword: async (token, password) => {
    try {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to reset password.';
    }
  },

  logout: async () => {
    // Only remove remember me preference
    localStorage.removeItem('rememberMe');
    
    if (USE_MOCK) {
      return Promise.resolve({ status: 'success', message: 'Logged out successfully' });
    }
    
    try {
      // Try to logout on server, but don't fail if it doesn't work
      await api.post('/auth/logout');
      return { status: 'success', message: 'Logged out successfully' };
    } catch (error) {
      // If logout fails (e.g., already logged out), just return success
      // The important thing is that we clear the client-side state
      console.log('Logout API call failed, but continuing with client-side logout');
      return { status: 'success', message: 'Logged out successfully' };
    }
  },

  isAuthenticated: () => {
    // Can't determine from localStorage since we use HTTP-only cookies
    // Need to check with server or rely on Redux state
    return false;
  },

  getToken: () => {
    // No longer store tokens in localStorage
    return null;
  },

  getProfileStatus: async () => {
    const response = await api.get('/user/profile-status');
    return response.data;
  },

  sendOTP: async () => {
    const response = await api.post('/user/send-otp');
    return response.data;
  },

  verifyOTP: async (code) => {
    const response = await api.post('/user/verify-otp', { code });
    return response.data;
  }
};

export default authService;
