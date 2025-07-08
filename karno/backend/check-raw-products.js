import mongoose from 'mongoose';

async function checkRawProducts() {
  try {
    await mongoose.connect('mongodb://localhost:27017/karno');
    const db = mongoose.connection.db;
    
    const products = await db.collection('products').find({}).toArray();
    console.log('Total products in database:', products.length);
    console.log('Product IDs:');
    
    products.forEach((p, i) => {
      console.log(`${i+1}. ${p._id} | ${p.name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkRawProducts(); 