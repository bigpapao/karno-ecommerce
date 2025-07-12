import mongoose from 'mongoose';
import { connectDB } from './src/config/database.js';
import { getDashboardStats } from './src/controllers/dashboard.controller.js';

async function testDashboardAPI() {
  try {
    console.log('🔗 Testing Dashboard API...\n');

    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Mock request and response objects
    const mockReq = {};
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log('📊 Dashboard API Response:');
          console.log('Status Code:', code);
          console.log('Response Data:', JSON.stringify(data, null, 2));
          return data;
        }
      })
    };
    const mockNext = (error) => {
      console.error('❌ Dashboard API Error:', error);
    };

    // Call the dashboard controller
    await getDashboardStats(mockReq, mockRes, mockNext);

  } catch (error) {
    console.error('❌ Error testing dashboard API:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  }
}

testDashboardAPI(); 