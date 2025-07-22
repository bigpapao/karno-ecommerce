import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Brand } from './src/models/index.js';

dotenv.config();

// Database connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/karno';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

const checkBrands = async () => {
  try {
    console.log('🔍 Checking brands in database...');
    
    const brands = await Brand.find({});
    console.log(`📊 Found ${brands.length} brands:`);
    
    brands.forEach((brand, index) => {
      console.log(`  ${index + 1}. ${brand.name} (${brand.slug}) - ID: ${brand._id}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking brands:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await checkBrands();
  await mongoose.disconnect();
  console.log('✅ Database connection closed');
};

// Run the script
main().catch(console.error); 