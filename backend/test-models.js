import mongoose from 'mongoose';
import Category from './src/models/category.model.js';
import Brand from './src/models/brand.model.js';
import { connectDB } from './src/config/database.js';

async function testModels() {
  try {
    console.log('🔗 Testing Node.js model access to MongoDB...\n');

    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');
    console.log('Database:', mongoose.connection.name);

    // Test Categories
    console.log('\n=== TESTING CATEGORY MODEL ===');
    const categoryCount = await Category.countDocuments();
    console.log(`📊 Category.countDocuments(): ${categoryCount}`);
    
    if (categoryCount > 0) {
      const categories = await Category.find().limit(3);
      console.log('📋 Sample categories via Mongoose:');
      categories.forEach((cat, index) => {
        console.log(`  ${index + 1}. ${cat.name} (ID: ${cat._id})`);
      });
    } else {
      console.log('❌ No categories found via Mongoose model');
    }

    // Test Brands
    console.log('\n=== TESTING BRAND MODEL ===');
    const brandCount = await Brand.countDocuments();
    console.log(`📊 Brand.countDocuments(): ${brandCount}`);
    
    if (brandCount > 0) {
      const brands = await Brand.find().limit(3);
      console.log('📋 Sample brands via Mongoose:');
      brands.forEach((brand, index) => {
        console.log(`  ${index + 1}. ${brand.name} (ID: ${brand._id})`);
      });
    } else {
      console.log('❌ No brands found via Mongoose model');
    }

    // Test direct MongoDB access
    console.log('\n=== TESTING DIRECT MONGODB ACCESS ===');
    const directCategoryCount = await mongoose.connection.db.collection('categories').countDocuments();
    const directBrandCount = await mongoose.connection.db.collection('brands').countDocuments();
    console.log(`📊 Direct categories count: ${directCategoryCount}`);
    console.log(`📊 Direct brands count: ${directBrandCount}`);

  } catch (error) {
    console.error('❌ Error testing models:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  }
}

testModels(); 