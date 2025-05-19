import 'dotenv/config';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

// ES Module __dirname setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MongoDB connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/karno';

// Connect to MongoDB
async function connectDB() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    return false;
  }
}

// Import models
async function importModels() {
  try {
    // Import models dynamically
    const User = (await import('./src/models/user.model.js')).default;
    const Product = (await import('./src/models/product.model.js')).default;
    const Order = (await import('./src/models/order.model.js')).default;
    const Category = (await import('./src/models/category.model.js')).default;
    const Brand = (await import('./src/models/brand.model.js')).default;

    return {
      User, Product, Order, Category, Brand,
    };
  } catch (error) {
    console.error('Error importing models:', error);
    throw error;
  }
}

// Test dashboard statistics
async function testDashboardStats(models) {
  const {
    User, Product, Order, Category, Brand,
  } = models;

  console.log('\n--- Testing Dashboard Statistics ---');

  try {
    // Basic stats
    const userCount = await User.countDocuments();
    const productCount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();

    // Get total revenue
    const orders = await Order.find({ status: { $ne: 'cancelled' } });
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

    // Calculate order status counts
    const orderStatusCounts = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    orders.forEach((order) => {
      if (orderStatusCounts.hasOwnProperty(order.status)) {
        orderStatusCounts[order.status]++;
      }
    });

    // Get recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'firstName lastName email');

    // Calculate monthly sales for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyOrdersData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          totalSales: { $sum: '$totalPrice' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Format monthly sales data
    const monthlySales = monthlyOrdersData.map((item) => ({
      month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
      sales: item.totalSales,
      count: item.count,
    }));

    // Get low stock products
    const lowStockProducts = await Product.find({ stock: { $lt: 10 } })
      .select('name slug stock images price')
      .sort({ stock: 1 })
      .limit(5);

    // Print results
    console.log('Dashboard Stats Summary:');
    console.log(`- User Count: ${userCount}`);
    console.log(`- Product Count: ${productCount}`);
    console.log(`- Order Count: ${orderCount}`);
    console.log(`- Total Revenue: $${totalRevenue.toFixed(2)}`);

    console.log('\nOrder Status Counts:');
    Object.entries(orderStatusCounts).forEach(([status, count]) => {
      console.log(`- ${status}: ${count}`);
    });

    if (recentOrders.length > 0) {
      console.log('\nRecent Orders:');
      recentOrders.forEach((order, index) => {
        console.log(`${index + 1}. Order ID: ${order._id}, Total: $${order.totalPrice.toFixed(2)}, Status: ${order.status}`);
      });
    } else {
      console.log('\nNo recent orders available.');
    }

    if (monthlySales.length > 0) {
      console.log('\nMonthly Sales:');
      monthlySales.forEach((item) => {
        console.log(`${item.month}: $${item.sales.toFixed(2)} (${item.count} orders)`);
      });
    } else {
      console.log('\nNo monthly sales data available.');
    }

    if (lowStockProducts.length > 0) {
      console.log('\nLow Stock Products:');
      lowStockProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - Stock: ${product.stock}`);
      });
    } else {
      console.log('\nNo low stock products available.');
    }

    return {
      userCount,
      productCount,
      orderCount,
      totalRevenue,
      orderStatusCounts,
      recentOrders,
      monthlySales,
      lowStockProducts,
    };
  } catch (error) {
    console.error('Error testing dashboard stats:', error);
  }
}

// Test product analytics
async function testProductAnalytics(models) {
  const { Product, Category, Brand } = models;

  console.log('\n--- Testing Product Analytics ---');

  try {
    // Get stock statistics
    const stockStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          avgStock: { $avg: '$stock' },
          lowStockCount: {
            $sum: { $cond: [{ $lt: ['$stock', 10] }, 1, 0] },
          },
          outOfStockCount: {
            $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] },
          },
        },
      },
    ]);

    // Get price range statistics
    const priceStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          avgPrice: { $avg: '$price' },
        },
      },
    ]);

    // Print results
    if (stockStats.length > 0) {
      console.log('\nStock Statistics:');
      console.log(`- Total Products: ${stockStats[0].totalProducts}`);
      console.log(`- Total Stock: ${stockStats[0].totalStock}`);
      console.log(`- Average Stock per Product: ${stockStats[0].avgStock.toFixed(2)}`);
      console.log(`- Low Stock Products: ${stockStats[0].lowStockCount}`);
      console.log(`- Out of Stock Products: ${stockStats[0].outOfStockCount}`);
    }

    if (priceStats.length > 0) {
      console.log('\nPrice Statistics:');
      console.log(`- Min Price: $${priceStats[0].minPrice.toFixed(2)}`);
      console.log(`- Max Price: $${priceStats[0].maxPrice.toFixed(2)}`);
      console.log(`- Average Price: $${priceStats[0].avgPrice.toFixed(2)}`);
    }

    return {
      stockStats: stockStats[0] || {},
      priceStats: priceStats[0] || {},
    };
  } catch (error) {
    console.error('Error testing product analytics:', error);
  }
}

// Main function to run tests
async function runTests() {
  try {
    console.log('=== KARNO E-COMMERCE ADMIN DASHBOARD TEST (DB DIRECT) ===');
    console.log(`MongoDB URI: ${MONGO_URI}`);
    console.log(`Time: ${new Date().toLocaleString()}`);

    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      throw new Error('Failed to connect to MongoDB');
    }

    // Import models
    const models = await importModels();

    // Test dashboard statistics
    await testDashboardStats(models);

    // Test product analytics
    await testProductAnalytics(models);

    console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');

    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('\nTest failed:', error.message);

    // Ensure MongoDB connection is closed even if test fails
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the tests
runTests();
