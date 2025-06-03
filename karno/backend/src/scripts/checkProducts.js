import { connectDB } from '../config/database.js';
import Product from '../models/product.model.js';
import mongoose from 'mongoose';

const checkProducts = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    const products = await Product.find({}).lean();
    console.log(`Total products: ${products.length}`);
    
    let issueCount = 0;
    
    for (const product of products) {
      const issues = [];
      
      // Check brand
      if (product.brand) {
        if (typeof product.brand === 'string' && !mongoose.Types.ObjectId.isValid(product.brand)) {
          issues.push(`Invalid brand: ${product.brand}`);
        }
      }
      
      // Check category
      if (product.category) {
        if (typeof product.category === 'string' && !mongoose.Types.ObjectId.isValid(product.category)) {
          issues.push(`Invalid category: ${product.category}`);
        }
      }
      
      if (issues.length > 0) {
        console.log(`Product "${product.name}" has issues:`, issues);
        issueCount++;
      }
    }
    
    console.log(`Found ${issueCount} products with issues`);
    
    // Now try to populate and see what fails
    try {
      const populatedProducts = await Product.find({})
        .populate('category', 'name slug')
        .populate('brand', 'name slug logo')
        .lean();
      console.log(`Successfully populated ${populatedProducts.length} products`);
    } catch (error) {
      console.error('Error populating products:', error.message);
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkProducts(); 