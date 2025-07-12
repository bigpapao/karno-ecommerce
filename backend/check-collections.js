import mongoose from 'mongoose';
import Category from './src/models/category.model.js';
import Brand from './src/models/brand.model.js';
import './src/config/database.js';

async function checkCollections() {
  try {
    console.log('🔍 Checking MongoDB Collections...\n');

    // Check Categories
    console.log('=== CATEGORIES ===');
    const categoryCount = await Category.countDocuments();
    console.log(`📊 Total Categories: ${categoryCount}`);
    
    if (categoryCount > 0) {
      const categories = await Category.find().limit(5).select('name slug description');
      console.log('📋 Sample Categories:');
      categories.forEach((cat, index) => {
        console.log(`  ${index + 1}. ${cat.name} (slug: ${cat.slug})`);
      });
    } else {
      console.log('❌ No categories found in database');
    }

    console.log('\n=== BRANDS ===');
    const brandCount = await Brand.countDocuments();
    console.log(`📊 Total Brands: ${brandCount}`);
    
    if (brandCount > 0) {
      const brands = await Brand.find().limit(5).select('name slug description');
      console.log('📋 Sample Brands:');
      brands.forEach((brand, index) => {
        console.log(`  ${index + 1}. ${brand.name} (slug: ${brand.slug})`);
      });
    } else {
      console.log('❌ No brands found in database');
    }

    // Check collection names in database
    console.log('\n=== DATABASE COLLECTIONS ===');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📂 Available Collections:');
    collections.forEach((collection, index) => {
      console.log(`  ${index + 1}. ${collection.name}`);
    });

  } catch (error) {
    console.error('❌ Error checking collections:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

checkCollections(); 