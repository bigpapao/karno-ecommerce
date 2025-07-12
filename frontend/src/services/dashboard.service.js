import api from './api';
import { getDashboardStats, getInventoryAlerts, getSalesReport } from './mockData';

const USE_MOCK = false; // Toggle this to switch between mock and real API

export const dashboardService = {
  getStats: async () => {
    if (USE_MOCK) {
      return getDashboardStats();
    }
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getInventoryAlerts: async () => {
    if (USE_MOCK) {
      return getInventoryAlerts();
    }
    const response = await api.get('/dashboard/inventory-alerts');
    return response.data;
  },

  getSalesReport: async (startDate, endDate) => {
    if (USE_MOCK) {
      return getSalesReport(startDate, endDate);
    }
    const response = await api.get('/dashboard/sales-report', {
      params: { startDate, endDate }
    });
    return response.data;
  }
};

export default dashboardService; 