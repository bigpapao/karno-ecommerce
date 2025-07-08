import Product from './src/models/product.model.js';
import mongoose from 'mongoose';

async function checkProductIds() {
  try {
    await mongoose.connect('mongodb://localhost:27017/karno');
    
    const products = await Product.find({}).limit(3);
    console.log('Products structure:');
    
    products.forEach((p, i) => {
      console.log(`Product ${i+1}:`);
      console.log('  _id:', p._id.toString());
      console.log('  name:', p.name);
      console.log('  id field:', p.id);
      console.log('---');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkProductIds(); 