import Product from './src/models/product.model.js';
import mongoose from 'mongoose';

async function checkAllProducts() {
  try {
    await mongoose.connect('mongodb://localhost:27017/karno');
    
    const products = await Product.find({}, '_id name').sort({ createdAt: 1 });
    console.log(`Total products found: ${products.length}`);
    console.log('All products:');
    
    products.forEach((p, i) => {
      console.log(`${i+1}. ID: ${p._id.toString()} | Name: ${p.name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAllProducts(); 