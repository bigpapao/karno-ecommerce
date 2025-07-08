import mongoose from 'mongoose';

async function debugProducts() {
  try {
    await mongoose.connect('mongodb://localhost:27017/karno');
    const db = mongoose.connection.db;
    
    const allProducts = await db.collection('products').find({}).toArray();
    console.log('TOTAL products found:', allProducts.length);
    
    // Group by ID prefix
    const groups = {};
    allProducts.forEach(p => {
      const prefix = p._id.toString().substring(0, 8);
      if (!groups[prefix]) groups[prefix] = [];
      groups[prefix].push(p);
    });
    
    console.log('\nProducts grouped by ID prefix:');
    Object.keys(groups).forEach(prefix => {
      console.log(`${prefix}*: ${groups[prefix].length} products`);
      groups[prefix].slice(0, 2).forEach(p => {
        console.log(`  - ${p._id} | ${p.name}`);
      });
    });
    
    // Check if there are any products with the API's expected IDs
    console.log('\nLooking for products with ID starting with 683dfb57...');
    const apiProducts = allProducts.filter(p => p._id.toString().startsWith('683dfb57'));
    console.log('Found', apiProducts.length, 'products matching API pattern');
    
    if (apiProducts.length > 0) {
      console.log('API-pattern products:');
      apiProducts.forEach(p => {
        console.log(`  - ${p._id} | ${p.name}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugProducts(); 