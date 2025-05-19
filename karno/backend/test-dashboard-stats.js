import 'dotenv/config';
import fetch from 'node-fetch';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Configuration
const API_URL = 'http://localhost:5001/api';
const ADMIN_EMAIL = 'admin@karno.com';
const ADMIN_PASSWORD = 'Admin123456!';

// Helper function to delay execution (to avoid rate limiting)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Login and get token
async function login() {
  try {
    console.log('Attempting to login as admin...');

    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Login failed: ${data.message || 'Unknown error'}`);
    }

    console.log('Login successful!');
    return data.data.token;
  } catch (error) {
    console.error('Login error:', error.message);
    throw error;
  }
}

// Test dashboard statistics
async function testDashboardStats(token) {
  console.log('\n--- Testing Dashboard Statistics ---');
  try {
    console.log('Fetching dashboard statistics...');

    const response = await fetch(`${API_URL}/dashboard/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Request failed: ${data.message || 'Unknown error'}`);
    }

    console.log('Dashboard Stats Summary:');
    console.log(`- User Count: ${data.data.userCount}`);
    console.log(`- Product Count: ${data.data.productCount}`);
    console.log(`- Order Count: ${data.data.orderCount}`);
    console.log(`- Total Revenue: $${data.data.totalRevenue.toFixed(2)}`);

    if (data.data.topProducts && data.data.topProducts.length > 0) {
      console.log('\nTop Products:');
      data.data.topProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - Sold: ${product.totalQuantity || 0}, Revenue: $${product.totalRevenue?.toFixed(2) || 0}`);
      });
    } else {
      console.log('\nNo top products data available.');
    }

    if (data.data.lowStockProducts && data.data.lowStockProducts.length > 0) {
      console.log('\nLow Stock Products:');
      data.data.lowStockProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - Stock: ${product.stock}`);
      });
    } else {
      console.log('\nNo low stock products data available.');
    }

    if (data.data.monthlySales && data.data.monthlySales.length > 0) {
      console.log('\nMonthly Sales:');
      data.data.monthlySales.forEach((item) => {
        console.log(`${item.month}: $${item.sales.toFixed(2)} (${item.count} orders)`);
      });
    } else {
      console.log('\nNo monthly sales data available.');
    }

    if (data.data.orderStatusCounts) {
      console.log('\nOrder Status Counts:');
      Object.entries(data.data.orderStatusCounts).forEach(([status, count]) => {
        console.log(`- ${status}: ${count}`);
      });
    }

    return data;
  } catch (error) {
    console.error('Failed to get dashboard stats:', error.message);
  }
}

// Test sales analytics
async function testSalesAnalytics(token) {
  console.log('\n--- Testing Sales Analytics ---');
  try {
    console.log('Fetching sales analytics...');

    const response = await fetch(`${API_URL}/dashboard/sales`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Request failed: ${data.message || 'Unknown error'}`);
    }

    console.log(`Sales Analytics (${data.data.period})`);

    if (data.data.sales && data.data.sales.length > 0) {
      console.log('\nSales by Period:');
      data.data.sales.forEach((item) => {
        console.log(`${item.period}: $${item.sales.toFixed(2)} (${item.count} orders)`);
      });
    } else {
      console.log('\nNo sales data available.');
    }

    return data;
  } catch (error) {
    console.error('Failed to get sales analytics:', error.message);
  }
}

// Main function to run tests
async function runTests() {
  try {
    console.log('=== KARNO E-COMMERCE ADMIN DASHBOARD TEST ===');
    console.log(`API URL: ${API_URL}`);
    console.log(`Time: ${new Date().toLocaleString()}`);

    // Login to get token
    const token = await login();

    // Add a delay to avoid rate limiting
    console.log('\nWaiting 2 seconds before making API requests...');
    await delay(2000);

    // Test dashboard statistics
    await testDashboardStats(token);

    // Add a delay before next request
    console.log('\nWaiting 2 seconds before next request...');
    await delay(2000);

    // Test sales analytics
    await testSalesAnalytics(token);

    console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
  } catch (error) {
    console.error('\nTest failed:', error.message);
  }
}

// Run the tests
runTests();
