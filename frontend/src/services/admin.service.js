import api from './api';
import { getDashboardStats, getInventoryAlerts, getSalesReport } from './mockData/dashboard.mock';
import { getUsers, updateUserStatus } from './mockData/users.mock';
import { getOrders, updateOrderStatus } from './mockData/orders.mock';

const USE_MOCK = false; // Toggle this to switch between mock and real API

export const adminService = {
  // Dashboard
  getDashboardStats: async () => {
    if (USE_MOCK) {
      return getDashboardStats();
    }
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },

  getInventoryAlerts: async () => {
    if (USE_MOCK) {
      return getInventoryAlerts();
    }
    const response = await api.get('/admin/dashboard/inventory-alerts');
    return response.data;
  },

  getSalesReport: async (startDate, endDate) => {
    if (USE_MOCK) {
      return getSalesReport(startDate, endDate);
    }
    const response = await api.get('/admin/dashboard/sales-report', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // User Management
  getUsers: async (params = {}) => {
    if (USE_MOCK) {
      return getUsers();
    }
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  updateUserStatus: async (userId, status) => {
    if (USE_MOCK) {
      return updateUserStatus(userId, status);
    }
    const response = await api.put(`/admin/users/${userId}/status`, { status });
    return response.data;
  },

  // Order Management
  getOrders: async (params = {}) => {
    if (USE_MOCK) {
      return getOrders();
    }
    const response = await api.get('/admin/orders', { params });
    return response.data;
  },

  updateOrderStatus: async (orderId, status) => {
    if (USE_MOCK) {
      return updateOrderStatus(orderId, status);
    }
    const response = await api.put(`/admin/orders/${orderId}/status`, { status });
    return response.data;
  },

  // Security Monitoring
  getSecurityEvents: async (params = {}) => {
    if (USE_MOCK) {
      return Promise.resolve({
        events: [],
        total: 0
      });
    }
    const response = await api.get('/admin/security/events', { params });
    return response.data;
  },

  getSuspiciousIPs: async () => {
    if (USE_MOCK) {
      return Promise.resolve({
        ips: [],
        total: 0
      });
    }
    const response = await api.get('/admin/security/suspicious-ips');
    return response.data;
  },

  blockIP: async (ip) => {
    if (USE_MOCK) {
      return Promise.resolve({ success: true });
    }
    const response = await api.post('/admin/security/block-ip', { ip });
    return response.data;
  },

  // Performance Monitoring
  getApiPerformance: async (params = {}) => {
    if (USE_MOCK) {
      return Promise.resolve({
        metrics: {
          responseTime: 150,
          errorRate: 0.5,
          requestCount: 1000
        }
      });
    }
    const response = await api.get('/admin/performance/api', { params });
    return response.data;
  },

  getSystemMetrics: async () => {
    if (USE_MOCK) {
      return Promise.resolve({
        cpu: 45,
        memory: 60,
        disk: 55
      });
    }
    const response = await api.get('/admin/performance/system');
    return response.data;
  },

  // Enhanced Database Performance Monitoring
  getDatabaseMetrics: async () => {
    if (USE_MOCK) {
      return Promise.resolve({
        status: 'success',
        data: {
          totalQueries: 1250,
          avgQueryTime: 45,
          slowQueries: 12,
          cacheHitRate: 85.2,
          connectionsActive: 8,
          connectionsAvailable: 12
        }
      });
    }
    const response = await api.get('/admin/performance/metrics');
    return response.data;
  },

  // Bulk Operations for Categories
  bulkImportCategories: async (data, options = {}) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
      return Promise.resolve({
        status: 'success',
        message: 'Bulk import completed',
        data: {
          total: data.length,
          successful: data.length - 1,
          failed: 1,
          errors: [{
            row: 2,
            error: 'Category with this name already exists'
          }],
          created: data.slice(0, -1),
          skipped: []
        }
      });
    }
    const response = await api.post('/categories/bulk-import', {
      data,
      format: options.format || 'csv',
      validateOnly: options.validateOnly || false
    });
    return response.data;
  },

  exportCategories: async (format = 'csv', includeIds = false) => {
    if (USE_MOCK) {
      const mockData = [
        { name: 'Electronics', slug: 'electronics', description: 'Electronic devices', featured: true },
        { name: 'Automotive', slug: 'automotive', description: 'Car parts and accessories', featured: false }
      ];
      return Promise.resolve({
        status: 'success',
        data: mockData,
        exportInfo: {
          totalRecords: mockData.length,
          exportedAt: new Date().toISOString(),
          format
        }
      });
    }
    const response = await api.get(`/categories/bulk-export?format=${format}&includeIds=${includeIds}`);
    return response.data;
  },

  downloadCategoryTemplate: async (format = 'csv') => {
    if (USE_MOCK) {
      const templateData = [
        { name: 'Example Category', slug: 'example-category', description: 'Example description', featured: false }
      ];
      return Promise.resolve({
        template: templateData,
        instructions: {
          requiredFields: ['name', 'description'],
          optionalFields: ['slug', 'featured', 'order', 'imageUrl', 'imageAlt', 'parentName']
        }
      });
    }
    const response = await api.get(`/categories/import-template?format=${format}`);
    return response.data;
  },

  // Bulk Operations for Brands
  bulkImportBrands: async (data, options = {}) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return Promise.resolve({
        status: 'success',
        message: 'Bulk import completed',
        data: {
          successful: Math.floor(data.length * 0.8),
          failed: Math.floor(data.length * 0.1),
          skipped: Math.floor(data.length * 0.1),
          total: data.length,
          errors: [
            { row: 2, error: 'نام برند الزامی است', data: { name: '' } },
            { row: 5, error: 'کشور نامعتبر است', data: { name: 'Test Brand', country: 'XYZ' } }
          ]
        }
      });
    }
    const response = await api.post('/brands/bulk-import', { data, ...options });
    return response.data;
  },

  exportBrands: async (format = 'csv', includeIds = false) => {
    if (USE_MOCK) {
      return Promise.resolve({
        data: [
          { id: 1, name: 'پژو', country: 'فرانسه', featured: true },
          { id: 2, name: 'رنو', country: 'فرانسه', featured: false },
          { id: 3, name: 'کیا', country: 'کره جنوبی', featured: true }
        ]
      });
    }
    const response = await api.get('/brands/bulk-export', {
      params: { format, includeIds }
    });
    return response.data;
  },

  downloadBrandTemplate: async (format = 'csv') => {
    if (USE_MOCK) {
      return Promise.resolve({
        template: [
          { name: '', country: '', description: '', website: '', featured: false }
        ]
      });
    }
    const response = await api.get('/brands/import-template', {
      params: { format }
    });
    return response.data;
  },

  // Analytics API Methods
  getAnalyticsOverview: async (params = {}) => {
    if (USE_MOCK) {
      return Promise.resolve({
        status: 'success',
        data: {
          topPerforming: {
            categories: [
              { name: 'لوازم یدکی موتور', totalViews: 1250, totalClicks: 324, totalUsers: 156, combinedScore: 2847 },
              { name: 'لوازم بدنه', totalViews: 980, totalClicks: 267, totalUsers: 134, combinedScore: 2234 },
              { name: 'سیستم ترمز', totalViews: 756, totalClicks: 189, totalUsers: 98, combinedScore: 1876 },
              { name: 'باتری', totalViews: 634, totalClicks: 156, totalUsers: 87, combinedScore: 1543 },
              { name: 'روغن موتور', totalViews: 567, totalClicks: 134, totalUsers: 76, combinedScore: 1398 }
            ],
            brands: [
              { name: 'پژو', totalViews: 2340, totalClicks: 567, totalUsers: 234, combinedScore: 4567 },
              { name: 'رنو', totalViews: 1890, totalClicks: 445, totalUsers: 198, combinedScore: 3678 },
              { name: 'کیا', totalViews: 1567, totalClicks: 378, totalUsers: 167, combinedScore: 3045 },
              { name: 'هیوندای', totalViews: 1234, totalClicks: 298, totalUsers: 134, combinedScore: 2398 },
              { name: 'نیسان', totalViews: 1098, totalClicks: 267, totalUsers: 123, combinedScore: 2134 }
            ]
          },
          trending: {
            categories: [
              { name: 'لوازم هوشمند خودرو', avgTrendScore: 85.6, recentViews: 234 },
              { name: 'سیستم صوتی', avgTrendScore: 72.3, recentViews: 189 },
              { name: 'چراغ LED', avgTrendScore: 68.9, recentViews: 156 }
            ],
            brands: [
              { name: 'تسلا', avgTrendScore: 92.4, recentViews: 345 },
              { name: 'BMW', avgTrendScore: 78.9, recentViews: 267 },
              { name: 'مرسدس', avgTrendScore: 74.2, recentViews: 234 }
            ]
          },
          summary: {
            totalTopCategories: 5,
            totalTopBrands: 5,
            totalTrendingCategories: 3,
            totalTrendingBrands: 3
          }
        }
      });
    }
    const response = await api.get('/analytics/overview', { params });
    return response.data;
  },

  getCategoriesAnalyticsSummary: async (params = {}) => {
    if (USE_MOCK) {
      return Promise.resolve({
        status: 'success',
        data: {
          topPerforming: [
            { categoryId: '1', name: 'لوازم یدکی موتور', totalViews: 1250, totalClicks: 324, totalUsers: 156, combinedScore: 2847 },
            { categoryId: '2', name: 'لوازم بدنه', totalViews: 980, totalClicks: 267, totalUsers: 134, combinedScore: 2234 },
            { categoryId: '3', name: 'سیستم ترمز', totalViews: 756, totalClicks: 189, totalUsers: 98, combinedScore: 1876 },
            { categoryId: '4', name: 'باتری', totalViews: 634, totalClicks: 156, totalUsers: 87, combinedScore: 1543 },
            { categoryId: '5', name: 'روغن موتور', totalViews: 567, totalClicks: 134, totalUsers: 76, combinedScore: 1398 }
          ],
          trending: [
            { name: 'لوازم هوشمند خودرو', avgTrendScore: 85.6, recentViews: 234 },
            { name: 'سیستم صوتی', avgTrendScore: 72.3, recentViews: 189 },
            { name: 'چراغ LED', avgTrendScore: 68.9, recentViews: 156 }
          ],
          metrics: {
            totalCategories: 25,
            totalViews: 15840,
            totalClicks: 4230,
            totalUsers: 2140,
            avgEngagementRate: 26.7
          },
          period: {
            days: 30,
            type: 'daily'
          }
        }
      });
    }
    const response = await api.get('/analytics/categories/summary', { params });
    return response.data;
  },

  getBrandsAnalyticsSummary: async (params = {}) => {
    if (USE_MOCK) {
      return Promise.resolve({
        status: 'success',
        data: {
          topPerforming: [
            { brandId: '1', name: 'پژو', totalViews: 2340, totalClicks: 567, totalUsers: 234, combinedScore: 4567 },
            { brandId: '2', name: 'رنو', totalViews: 1890, totalClicks: 445, totalUsers: 198, combinedScore: 3678 },
            { brandId: '3', name: 'کیا', totalViews: 1567, totalClicks: 378, totalUsers: 167, combinedScore: 3045 },
            { brandId: '4', name: 'هیوندای', totalViews: 1234, totalClicks: 298, totalUsers: 134, combinedScore: 2398 },
            { brandId: '5', name: 'نیسان', totalViews: 1098, totalClicks: 267, totalUsers: 123, combinedScore: 2134 }
          ],
          trending: [
            { name: 'تسلا', avgTrendScore: 92.4, recentViews: 345 },
            { name: 'BMW', avgTrendScore: 78.9, recentViews: 267 },
            { name: 'مرسدس', avgTrendScore: 74.2, recentViews: 234 }
          ],
          metrics: {
            totalBrands: 18,
            totalViews: 12450,
            totalClicks: 3240,
            totalUsers: 1890,
            avgEngagementRate: 26.0
          },
          period: {
            days: 30,
            type: 'daily'
          }
        }
      });
    }
    const response = await api.get('/analytics/brands/summary', { params });
    return response.data;
  },

  getRealtimeAnalytics: async (params = {}) => {
    if (USE_MOCK) {
      return Promise.resolve({
        status: 'success',
        data: {
          currentActiveUsers: Math.floor(Math.random() * 50) + 15,
          eventsLastHour: Math.floor(Math.random() * 200) + 50,
          topActiveResources: [
            { name: 'پژو 206', type: 'product', users: 12 },
            { name: 'لوازم یدکی', type: 'category', users: 8 },
            { name: 'رنو', type: 'brand', users: 6 }
          ],
          timestamp: new Date().toISOString()
        }
      });
    }
    const response = await api.get('/analytics/realtime', { params });
    return response.data;
  },

  getAnalyticsInsights: async (resourceType, resourceId, params = {}) => {
    if (USE_MOCK) {
      const mockData = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        views: Math.floor(Math.random() * 100) + 20,
        clicks: Math.floor(Math.random() * 30) + 5,
        users: Math.floor(Math.random() * 50) + 10
      }));

      return Promise.resolve({
        status: 'success',
        data: {
          stats: [
            { eventType: 'category_view', count: 1250, uniqueUsers: 156, uniqueSessions: 234 },
            { eventType: 'category_click', count: 324, uniqueUsers: 89, uniqueSessions: 124 },
            { eventType: 'category_product_view', count: 567, uniqueUsers: 123, uniqueSessions: 189 }
          ],
          timeSeriesData: mockData,
          performanceScore: 2847
        }
      });
    }
    const response = await api.get(`/analytics/insights/${resourceType}/${resourceId}`, { params });
    return response.data;
  },

  getTopPerformingAnalytics: async (resourceType, params = {}) => {
    if (USE_MOCK) {
      const mockItems = resourceType === 'category' ? [
        { name: 'لوازم یدکی موتور', totalViews: 1250, totalClicks: 324, totalUsers: 156 },
        { name: 'لوازم بدنه', totalViews: 980, totalClicks: 267, totalUsers: 134 },
        { name: 'سیستم ترمز', totalViews: 756, totalClicks: 189, totalUsers: 98 }
      ] : [
        { name: 'پژو', totalViews: 2340, totalClicks: 567, totalUsers: 234 },
        { name: 'رنو', totalViews: 1890, totalClicks: 445, totalUsers: 198 },
        { name: 'کیا', totalViews: 1567, totalClicks: 378, totalUsers: 167 }
      ];

      return Promise.resolve({
        status: 'success',
        data: mockItems
      });
    }
    const response = await api.get(`/analytics/top/${resourceType}`, { params });
    return response.data;
  },

  getTrendingAnalytics: async (resourceType, params = {}) => {
    if (USE_MOCK) {
      const mockItems = resourceType === 'category' ? [
        { name: 'لوازم هوشمند خودرو', avgTrendScore: 85.6, recentViews: 234 },
        { name: 'سیستم صوتی', avgTrendScore: 72.3, recentViews: 189 },
        { name: 'چراغ LED', avgTrendScore: 68.9, recentViews: 156 }
      ] : [
        { name: 'تسلا', avgTrendScore: 92.4, recentViews: 345 },
        { name: 'BMW', avgTrendScore: 78.9, recentViews: 267 },
        { name: 'مرسدس', avgTrendScore: 74.2, recentViews: 234 }
      ];

      return Promise.resolve({
        status: 'success',
        data: mockItems
      });
    }
    const response = await api.get(`/analytics/trending/${resourceType}`, { params });
    return response.data;
  },

  getAnalyticsChartData: async (resourceType, resourceId, params = {}) => {
    if (USE_MOCK) {
      const mockData = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        views: Math.floor(Math.random() * 100) + 20,
        clicks: Math.floor(Math.random() * 30) + 5,
        users: Math.floor(Math.random() * 50) + 10
      }));

      return Promise.resolve({
        status: 'success',
        data: mockData
      });
    }
    const response = await api.get(`/analytics/charts/${resourceType}/${resourceId}`, { params });
    return response.data;
  },

  exportAnalyticsData: async (resourceType, params = {}) => {
    if (USE_MOCK) {
      const mockData = [
        { name: 'Test Item 1', views: 1250, clicks: 324, users: 156 },
        { name: 'Test Item 2', views: 980, clicks: 267, users: 134 },
        { name: 'Test Item 3', views: 756, clicks: 189, users: 98 }
      ];

      return Promise.resolve({
        status: 'success',
        data: mockData
      });
    }
    const response = await api.get(`/analytics/export/${resourceType}`, { params });
    return response.data;
  },

  processAnalyticsEvents: async (date) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return Promise.resolve({
        status: 'success',
        data: {
          processedDate: date || new Date().toISOString().split('T')[0],
          processedEvents: Math.floor(Math.random() * 1000) + 100
        }
      });
    }
    const response = await api.post('/analytics/process-events', { date });
    return response.data;
  },

  getDatabaseHealth: async () => {
    if (USE_MOCK) {
      return Promise.resolve({
        status: 'success',
        data: {
          database: { state: 'connected', ping: '2ms' },
          uptime: 86400,
          performance: { operationsTracked: 1000, avgMemoryUsage: 512 }
        }
      });
    }
    const response = await api.get('/admin/performance/health');
    return response.data;
  },

  getCacheMetrics: async () => {
    if (USE_MOCK) {
      return Promise.resolve({
        status: 'success',
        data: {
          redis: { status: 'connected', memory: '256MB' },
          cache: { totalKeys: 150, monitoringKeys: 25 }
        }
      });
    }
    const response = await api.get('/admin/performance/cache');
    return response.data;
  },

  getCollectionStats: async () => {
    if (USE_MOCK) {
      return Promise.resolve({
        status: 'success',
        data: {
          collections: [
            { name: 'products', documents: 1250, size: 1024000, indexes: 5 },
            { name: 'users', documents: 450, size: 256000, indexes: 3 },
            { name: 'orders', documents: 890, size: 512000, indexes: 4 }
          ]
        }
      });
    }
    const response = await api.get('/admin/performance/collections');
    return response.data;
  },

  getSlowQueries: async () => {
    if (USE_MOCK) {
      return Promise.resolve({
        status: 'success',
        data: {
          groupedQueries: {
            'products:find': { collection: 'products', operation: 'find', count: 5, avgTime: 120, maxTime: 300 },
            'orders:aggregate': { collection: 'orders', operation: 'aggregate', count: 3, avgTime: 250, maxTime: 450 }
          }
        }
      });
    }
    const response = await api.get('/admin/performance/slow-queries');
    return response.data;
  },

  // Database Optimization
  optimizeDatabase: async () => {
    if (USE_MOCK) {
      return Promise.resolve({
        status: 'success',
        message: 'Database optimization completed'
      });
    }
    const response = await api.post('/admin/performance/optimize');
    return response.data;
  },

  clearCache: async () => {
    if (USE_MOCK) {
      return Promise.resolve({
        status: 'success',
        message: 'Cache cleared successfully'
      });
    }
    const response = await api.post('/admin/performance/clear-cache');
    return response.data;
  }
};

export default adminService; 