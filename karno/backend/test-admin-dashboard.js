import 'dotenv/config';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Configuration
const API_URL = 'http://localhost:5001/api';
const JWT_SECRET = process.env.JWT_SECRET || 'karno_secret_key_2025';

// Generate a JWT token directly for testing (bypassing login to avoid rate limiting)
function generateAdminToken() {
  // Create a payload for an admin user
  const payload = {
    id: '000000000000000000000001', // Dummy ID for testing
    email: 'admin@karno.com',
    role: 'admin',
  };

  // Sign the token with the JWT secret
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

// Helper function to make authenticated requests
async function makeAuthenticatedRequest(endpoint, method = 'GET', body = null) {
  try {
    // Generate admin token directly instead of logging in
    const token = generateAdminToken();

    // Now make the actual request with the token
    const requestOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };

    if (body) {
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, requestOptions);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Request failed: ${data.message || 'Unknown error'}`);
    }

    return data;
  } catch (error) {
    console.error('Error making authenticated request:', error);
    throw error;
  }
}

// Test dashboard statistics
async function testDashboardStats() {
  console.log('\n--- Testing Dashboard Statistics ---');
  try {
    const stats = await makeAuthenticatedRequest('/dashboard/stats');
    console.log('Dashboard Stats Summary:');
    console.log(`- User Count: ${stats.data.userCount}`);
    console.log(`- Product Count: ${stats.data.productCount}`);
    console.log(`- Order Count: ${stats.data.orderCount}`);
    console.log(`- Total Revenue: $${stats.data.totalRevenue.toFixed(2)}`);

    if (stats.data.topProducts && stats.data.topProducts.length > 0) {
      console.log('\nTop Products:');
      stats.data.topProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - Sold: ${product.totalQuantity}, Revenue: $${product.totalRevenue?.toFixed(2) || 0}`);
      });
    }

    if (stats.data.lowStockProducts && stats.data.lowStockProducts.length > 0) {
      console.log('\nLow Stock Products:');
      stats.data.lowStockProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - Stock: ${product.stock}`);
      });
    }

    return stats;
  } catch (error) {
    console.error('Failed to get dashboard stats:', error.message);
  }
}

// Test sales analytics
async function testSalesAnalytics() {
  console.log('\n--- Testing Sales Analytics ---');
  try {
    const salesData = await makeAuthenticatedRequest('/dashboard/sales');
    console.log(`Sales Analytics (${salesData.data.period}):`);

    if (salesData.data.sales && salesData.data.sales.length > 0) {
      console.log('\nSales by Period:');
      salesData.data.sales.forEach((item) => {
        console.log(`${item.period}: $${item.sales.toFixed(2)} (${item.count} orders)`);
      });
    } else {
      console.log('No sales data available.');
    }

    return salesData;
  } catch (error) {
    console.error('Failed to get sales analytics:', error.message);
  }
}

// Test product analytics
async function testProductAnalytics() {
  console.log('\n--- Testing Product Analytics ---');
  try {
    const productAnalytics = await makeAuthenticatedRequest('/products/analytics/stats');

    if (productAnalytics.data.stockStats) {
      console.log('\nStock Statistics:');
      console.log(`- Total Products: ${productAnalytics.data.stockStats.totalProducts}`);
      console.log(`- Total Stock: ${productAnalytics.data.stockStats.totalStock}`);
      console.log(`- Average Stock per Product: ${productAnalytics.data.stockStats.avgStock?.toFixed(2) || 0}`);
      console.log(`- Low Stock Products: ${productAnalytics.data.stockStats.lowStockCount}`);
      console.log(`- Out of Stock Products: ${productAnalytics.data.stockStats.outOfStockCount}`);
    }

    if (productAnalytics.data.priceStats) {
      console.log('\nPrice Statistics:');
      console.log(`- Min Price: $${productAnalytics.data.priceStats.minPrice?.toFixed(2) || 0}`);
      console.log(`- Max Price: $${productAnalytics.data.priceStats.maxPrice?.toFixed(2) || 0}`);
      console.log(`- Average Price: $${productAnalytics.data.priceStats.avgPrice?.toFixed(2) || 0}`);
    }

    if (productAnalytics.data.categories && productAnalytics.data.categories.length > 0) {
      console.log('\nTop Categories:');
      productAnalytics.data.categories.slice(0, 5).forEach((category, index) => {
        console.log(`${index + 1}. ${category.categoryName} - Products: ${category.count}, Avg Price: $${category.avgPrice?.toFixed(2) || 0}`);
      });
    }

    return productAnalytics;
  } catch (error) {
    console.error('Failed to get product analytics:', error.message);
  }
}

// Test order statistics
async function testOrderStats() {
  console.log('\n--- Testing Order Statistics ---');
  try {
    const orderStats = await makeAuthenticatedRequest('/orders/stats');

    if (orderStats.data.statusCounts) {
      console.log('\nOrders by Status:');
      Object.entries(orderStats.data.statusCounts).forEach(([status, data]) => {
        console.log(`- ${status}: ${data.count} orders, $${data.revenue?.toFixed(2) || 0} revenue`);
      });
    }

    if (orderStats.data.paymentCounts) {
      console.log('\nOrders by Payment Status:');
      Object.entries(orderStats.data.paymentCounts).forEach(([status, data]) => {
        console.log(`- ${status}: ${data.count} orders, $${data.revenue?.toFixed(2) || 0} revenue`);
      });
    }

    return orderStats;
  } catch (error) {
    console.error('Failed to get order statistics:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  try {
    console.log('=== TESTING ADMIN DASHBOARD FUNCTIONALITY ===');
    console.log('Server URL:', API_URL);

    await testDashboardStats();
    await testSalesAnalytics();
    await testProductAnalytics();
    await testOrderStats();

    console.log('\n=== ALL TESTS COMPLETED ===');
  } catch (error) {
    console.error('Test suite failed:', error);
  }
}

// Execute the tests
runAllTests();
