import mongoose from 'mongoose';
import 'dotenv/config';
import Product from './src/models/product.model.js';

const verifyProducts = async () => {
  try {
    console.log('🔗 Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/karno');
    
    const products = await Product.find().select('name sku price stock');
    
    console.log('\n📦 Current Products in Database:');
    console.log('================================');
    
    if (products.length === 0) {
      console.log('⚠️ No products found in database');
    } else {
      products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   SKU: ${product.sku || 'N/A'}`);
        console.log(`   Price: ${product.price?.toLocaleString() || 'N/A'} ریال`);
        console.log(`   Stock: ${product.stock || 'N/A'}`);
        console.log('');
      });
    }
    
    console.log(`📊 Total Products: ${products.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
};

verifyProducts(); 