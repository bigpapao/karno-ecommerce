import axios from 'axios';
import store from '../store';
import { logoutUser } from '../store/slices/authSlice';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

// Flag to prevent multiple logout attempts
let isLoggingOut = false;

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Debug logging removed for production
    return config;
  },
  (error) => {
    // Debug logging removed for production 
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response) {
      // Handle 401 Unauthorized response
      if (error.response.status === 401 && !originalRequest._retry) {
        // Don't try to refresh if this was already a refresh token request, auth check, login, or logout
        if (originalRequest.url.includes('/auth/refresh-token') || 
            originalRequest.url.includes('/auth/profile') ||
            originalRequest.url.includes('/auth/login') ||
            originalRequest.url.includes('/auth/logout')) {
          // For auth check failures, don't logout - this is normal when not authenticated
          if (originalRequest.url.includes('/auth/profile')) {
            return Promise.reject(error);
          }
          // For login failures, don't logout
          if (originalRequest.url.includes('/auth/login')) {
            return Promise.reject(error);
          }
          // For logout failures, don't try to refresh or logout again - just fail silently
          if (originalRequest.url.includes('/auth/logout')) {
            return Promise.reject(error);
          }
          // For refresh token failures, logout (but only if not already logging out)
          if (!isLoggingOut) {
            isLoggingOut = true;
            store.dispatch(logoutUser()).finally(() => {
              isLoggingOut = false;
            });
          }
          return Promise.reject(error);
        }
        
        if (isRefreshing) {
          // If we're already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(() => {
            // Retrying queued request
            return api(originalRequest);
          }).catch(err => {
            return Promise.reject(err);
          });
        }
        
        originalRequest._retry = true;
        isRefreshing = true;
        
        try {
          // Attempt to refresh the token
          await api.post('/auth/refresh-token');
          
          // Token refresh successful, process the queue
          processQueue(null);
          isRefreshing = false;
          
          // Retry the original request after token refresh
          return api(originalRequest);
        } catch (refreshError) {
          // Token refresh failed, logout user
          processQueue(refreshError);
          isRefreshing = false;
          if (!isLoggingOut) {
            isLoggingOut = true;
            store.dispatch(logoutUser()).finally(() => {
              isLoggingOut = false;
            });
          }
          return Promise.reject(refreshError);
        }
      }
      
      // Handle 403 Forbidden response
      if (error.response.status === 403) {
        // Access forbidden - insufficient permissions
      }
      
      // Return error message from the server if available
      const message = error.response.data?.message || error.message;
      return Promise.reject(new Error(message));
    }
    return Promise.reject(error);
  },
);

export default api;

// Category API methods
export const categoryAPI = {
  // Get all categories
  getCategories: (params = {}) => api.get('/categories', { params }),
  
  // Get featured categories
  getFeaturedCategories: (limit = 6) => api.get(`/categories?featured=true&limit=${limit}`),
  
  // Get category by ID
  getCategoryById: (id) => api.get(`/categories/${id}`),
  
  // Create category (admin only)
  createCategory: (data) => api.post('/categories', data),
  
  // Update category (admin only)
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  
  // Delete category (admin only)
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};

// Brand API methods
export const brandAPI = {
  // Get all brands
  getBrands: (params = {}) => api.get('/brands', { params }),
  
  // Get featured brands
  getFeaturedBrands: (limit = 10) => api.get(`/brands/featured?limit=${limit}`),
  
  // Get brand by ID
  getBrandById: (id) => api.get(`/brands/${id}`),
  
  // Create brand (admin only)
  createBrand: (data) => api.post('/brands', data),
  
  // Update brand (admin only)
  updateBrand: (id, data) => api.put(`/brands/${id}`, data),
  
  // Delete brand (admin only)
  deleteBrand: (id) => api.delete(`/brands/${id}`),
};

// Product API methods
export const productAPI = {
  // Get all products
  getProducts: (params = {}) => api.get('/products', { params }),
  
  // Get product by ID
  getProductById: (id) => api.get(`/products/${id}`),
  
  // Get featured products
  getFeaturedProducts: (limit = 8) => api.get(`/products/featured?limit=${limit}`),
  
  // Search products
  searchProducts: (query, params = {}) => api.get(`/products/search?q=${query}`, { params }),
  
  // Get products by category
  getProductsByCategory: (categorySlug, params = {}) => api.get(`/products?category=${categorySlug}`, { params }),
  
  // Get products by brand
  getProductsByBrand: (brandSlug, params = {}) => api.get(`/products?brand=${brandSlug}`, { params }),
  
  // Get products by vehicle
  getProductsByVehicle: (vehicleId, params = {}) => api.get(`/products/vehicle/${vehicleId}`, { params }),
  
  // Create product (admin only)
  createProduct: (data) => api.post('/products', data),
  
  // Update product (admin only)
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  
  // Delete product (admin only)
  deleteProduct: (id) => api.delete(`/products/${id}`),
};

// Vehicle API methods
export const vehicleAPI = {
  // Get all manufacturers
  getManufacturers: (params = {}) => api.get('/vehicles/manufacturers', { params }),
  
  // Get models for a specific manufacturer
  getModelsByManufacturer: (manufacturerId, params = {}) => api.get(`/vehicles/manufacturers/${manufacturerId}/models`, { params }),
  
  // Get all vehicle models
  getVehicleModels: (params = {}) => api.get('/vehicles/models', { params }),
  
  // Get vehicle model by ID
  getVehicleModelById: (id) => api.get(`/vehicles/models/${id}`),
  
  // Get vehicle statistics
  getVehicleStats: () => api.get('/vehicles/stats'),
  
  // Search vehicles
  searchVehicles: (query) => api.get(`/vehicles/search?q=${query}`),
  
  // Get vehicle makes from products (for compatibility search)
  getVehicleMakes: () => api.get('/products/vehicle-makes'),
  
  // Get vehicle models for a specific make (from products)
  getVehicleModelsForMake: (make) => api.get(`/products/vehicle-models?make=${make}`),
  
  // Get vehicle years for make and model (from products)
  getVehicleYears: (make, model) => api.get(`/products/vehicle-years?make=${make}&model=${model}`),
  
  // Search products by vehicle compatibility
  searchProductsByVehicle: (params = {}) => api.get('/products/vehicle-search', { params }),
  
  // Create manufacturer (admin only)
  createManufacturer: (data) => api.post('/vehicles/manufacturers', data),
  
  // Create vehicle model (admin only)
  createVehicleModel: (data) => api.post('/vehicles/models', data),
  
  // Update manufacturer (admin only)
  updateManufacturer: (id, data) => api.put(`/vehicles/manufacturers/${id}`, data),
  
  // Update vehicle model (admin only)
  updateVehicleModel: (id, data) => api.put(`/vehicles/models/${id}`, data),
  
  // Delete manufacturer (admin only)
  deleteManufacturer: (id) => api.delete(`/vehicles/manufacturers/${id}`),
  
  // Delete vehicle model (admin only)
  deleteVehicleModel: (id) => api.delete(`/vehicles/models/${id}`),
};

// Recommendation API methods - Enhanced with content-based filtering
export const recommendationAPI = {
  // Get personalized recommendations using enhanced content-based filtering
  getPersonalizedRecommendations: (params = {}) => {
    const defaultParams = {
      limit: 10,
      excludeViewed: true,
      excludeInCart: true,
      excludePurchased: true,
      includeVehicleCompatibility: true,
      includeCrossCategory: true,
    };
    return api.get('/recommendations/personal', { params: { ...defaultParams, ...params } });
  },

  // Get content-based recommendations with enhanced algorithms
  getContentBasedRecommendations: (params = {}) => {
    const defaultParams = {
      limit: 10,
      excludeViewed: true,
      excludeInCart: true,
      excludePurchased: true,
      categories: [],
      includeVehicleCompatibility: true,
      includeCrossCategory: true,
    };
    return api.get('/recommendations/content-based', { params: { ...defaultParams, ...params } });
  },

  // Get enhanced similar products with category and brand relationships
  getSimilarProducts: (productId, params = {}) => {
    const defaultParams = {
      limit: 5,
      includeVehicleCompatibility: true,
      includeCrossCategory: true,
      includeParentChildCategories: true,
    };
    return api.get(`/recommendations/similar/${productId}`, { params: { ...defaultParams, ...params } });
  },

  // Get intelligent category-based recommendations
  getIntelligentCategoryRecommendations: (params = {}) => {
    const defaultParams = {
      limit: 10,
      includeVehicleCompatibility: true,
      categories: [],
    };
    return api.get('/recommendations/intelligent-category', { params: { ...defaultParams, ...params } });
  },

  // Get cross-category complementary product recommendations
  getComplementaryProducts: (categorySlug, params = {}) => {
    const defaultParams = {
      limit: 8,
      includeVehicleCompatibility: true,
    };
    return api.get(`/recommendations/complementary/${categorySlug}`, { params: { ...defaultParams, ...params } });
  },

  // Get vehicle-specific recommendations
  getVehicleCompatibleRecommendations: (vehicleId, params = {}) => {
    const defaultParams = {
      limit: 10,
      categories: [],
    };
    return api.get(`/recommendations/vehicle/${vehicleId}`, { params: { ...defaultParams, ...params } });
  },

  // Get hybrid recommendations (collaborative + content-based)
  getHybridRecommendations: (params = {}) => {
    const defaultParams = {
      limit: 10,
      excludeViewed: true,
      excludeInCart: true,
      excludePurchased: true,
      weights: { collaborative: 0.6, contentBased: 0.4 },
    };
    return api.get('/recommendations/hybrid', { params: { ...defaultParams, ...params } });
  },

  // Record user interaction events for recommendation improvement
  recordEvent: (eventData) => {
    const event = {
      eventType: 'view', // view, add_to_cart, purchase, remove_from_cart
      productId: null,
      sessionId: null,
      metadata: {},
      ...eventData,
      timestamp: new Date(),
    };
    return api.post('/recommendations/events', event);
  },

  // Get recommendation performance insights (for admin)
  getRecommendationInsights: (params = {}) => {
    const defaultParams = {
      timeRange: '30d', // 7d, 30d, 90d
      metrics: ['clickThroughRate', 'conversionRate', 'coverage'],
    };
    return api.get('/recommendations/insights', { params: { ...defaultParams, ...params } });
  },

  // Get trending products based on recent user interactions
  getTrendingProducts: (params = {}) => {
    const defaultParams = {
      limit: 10,
      timeRange: '7d',
      categories: [],
    };
    return api.get('/recommendations/trending', { params: { ...defaultParams, ...params } });
  },
};

