import mongoose from 'mongoose';
import Product from './src/models/product.model.js';
import Category from './src/models/category.model.js';
import Brand from './src/models/brand.model.js';
import User from './src/models/user.model.js';
import Cart from './src/models/cart.model.js';
import Order from './src/models/order.model.js';

async function optimizeDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/karno');
    console.log('✅ Connected to MongoDB');

    console.log('\n🔍 Creating optimized indexes...');

    // Products Collection Indexes
    console.log('📦 Optimizing Products collection...');
    
    // Text search index for product search
    try {
      await Product.collection.createIndex(
        { 
          name: "text", 
          description: "text", 
          searchKeywords: "text",
          "specifications.material": "text",
          oem: "text"
        },
        { 
          name: "product_text_search",
          weights: {
            name: 10,
            searchKeywords: 8,
            description: 5,
            oem: 7,
            "specifications.material": 3
          }
        }
      );
      console.log('✅ Text search index created');
    } catch (error) {
      console.log('⚠️ Text search index already exists or error:', error.message);
    }

    // Product filtering indexes
    const productIndexes = [
      { category: 1, brand: 1, price: 1 },
      { category: 1, inStock: 1, price: 1 },
      { brand: 1, inStock: 1 },
      { compatibleVehicles: 1 },
      { price: 1, discountPrice: 1 },
      { isFeatured: 1, isActive: 1 },
      { stockQuantity: 1 },
      { slug: 1 },
      { sku: 1 },
      { oem: 1 },
      { createdAt: -1 },
      { updatedAt: -1 }
    ];

    for (const index of productIndexes) {
      try {
        await Product.collection.createIndex(index);
        console.log(`✅ Product index created: ${JSON.stringify(index)}`);
      } catch (error) {
        console.log(`⚠️ Product index exists: ${JSON.stringify(index)}`);
      }
    }

    // Users Collection Indexes
    console.log('\n👥 Optimizing Users collection...');
    const userIndexes = [
      { phone: 1 },
      { email: 1 },
      { role: 1 },
      { isActive: 1 },
      { verificationStatus: 1 },
      { lastLogin: -1 },
      { createdAt: -1 }
    ];

    for (const index of userIndexes) {
      try {
        await User.collection.createIndex(index);
        console.log(`✅ User index created: ${JSON.stringify(index)}`);
      } catch (error) {
        console.log(`⚠️ User index exists: ${JSON.stringify(index)}`);
      }
    }

    // Categories Collection Indexes
    console.log('\n📂 Optimizing Categories collection...');
    const categoryIndexes = [
      { slug: 1 },
      { name: 1 },
      { isActive: 1 },
      { parentCategory: 1 },
      { order: 1 }
    ];

    for (const index of categoryIndexes) {
      try {
        await Category.collection.createIndex(index);
        console.log(`✅ Category index created: ${JSON.stringify(index)}`);
      } catch (error) {
        console.log(`⚠️ Category index exists: ${JSON.stringify(index)}`);
      }
    }

    // Brands Collection Indexes
    console.log('\n🏷️ Optimizing Brands collection...');
    const brandIndexes = [
      { slug: 1 },
      { name: 1 },
      { isActive: 1 },
      { country: 1 }
    ];

    for (const index of brandIndexes) {
      try {
        await Brand.collection.createIndex(index);
        console.log(`✅ Brand index created: ${JSON.stringify(index)}`);
      } catch (error) {
        console.log(`⚠️ Brand index exists: ${JSON.stringify(index)}`);
      }
    }

    // Carts Collection Indexes
    console.log('\n🛒 Optimizing Carts collection...');
    const cartIndexes = [
      { userId: 1 },
      { sessionId: 1 },
      { updatedAt: -1 },
      { "items.productId": 1 }
    ];

    for (const index of cartIndexes) {
      try {
        await Cart.collection.createIndex(index);
        console.log(`✅ Cart index created: ${JSON.stringify(index)}`);
      } catch (error) {
        console.log(`⚠️ Cart index exists: ${JSON.stringify(index)}`);
      }
    }

    // Orders Collection Indexes
    console.log('\n📋 Optimizing Orders collection...');
    const orderIndexes = [
      { userId: 1 },
      { status: 1 },
      { paymentStatus: 1 },
      { createdAt: -1 },
      { updatedAt: -1 },
      { trackingNumber: 1 },
      { orderNumber: 1 }
    ];

    for (const index of orderIndexes) {
      try {
        await Order.collection.createIndex(index);
        console.log(`✅ Order index created: ${JSON.stringify(index)}`);
      } catch (error) {
        console.log(`⚠️ Order index exists: ${JSON.stringify(index)}`);
      }
    }

    // Compound indexes for complex queries
    console.log('\n🔗 Creating compound indexes...');
    
    const compoundIndexes = [
      // Product search and filtering
      { collection: Product, index: { category: 1, brand: 1, inStock: 1, price: 1 } },
      { collection: Product, index: { compatibleVehicles: 1, category: 1, inStock: 1 } },
      { collection: Product, index: { isActive: 1, isFeatured: 1, createdAt: -1 } },
      
      // User management
      { collection: User, index: { role: 1, isActive: 1, lastLogin: -1 } },
      { collection: User, index: { verificationStatus: 1, createdAt: -1 } },
      
      // Order management
      { collection: Order, index: { userId: 1, status: 1, createdAt: -1 } },
      { collection: Order, index: { status: 1, paymentStatus: 1, updatedAt: -1 } }
    ];

    for (const { collection, index } of compoundIndexes) {
      try {
        await collection.collection.createIndex(index);
        console.log(`✅ Compound index created: ${JSON.stringify(index)}`);
      } catch (error) {
        console.log(`⚠️ Compound index exists: ${JSON.stringify(index)}`);
      }
    }

    // Analyze collection statistics
    console.log('\n📊 Analyzing collection statistics...');
    
    const collections = [
      { name: 'Products', model: Product },
      { name: 'Users', model: User },
      { name: 'Categories', model: Category },
      { name: 'Brands', model: Brand },
      { name: 'Carts', model: Cart },
      { name: 'Orders', model: Order }
    ];

    for (const { name, model } of collections) {
      try {
        const stats = await model.collection.stats();
        const indexes = await model.collection.getIndexes();
        
        console.log(`\n📈 ${name} Collection:`);
        console.log(`   Documents: ${stats.count}`);
        console.log(`   Storage Size: ${(stats.storageSize / 1024).toFixed(2)} KB`);
        console.log(`   Indexes: ${Object.keys(indexes).length}`);
        console.log(`   Average Document Size: ${(stats.avgObjSize || 0).toFixed(2)} bytes`);
      } catch (error) {
        console.log(`⚠️ Could not get stats for ${name}:`, error.message);
      }
    }

    // Performance recommendations
    console.log('\n💡 Performance Recommendations:');
    console.log('   ✅ Text search indexes created for product search');
    console.log('   ✅ Compound indexes created for complex queries');
    console.log('   ✅ Single field indexes created for filtering');
    console.log('   ⚠️ Consider implementing database connection pooling');
    console.log('   ⚠️ Consider implementing query result caching');
    console.log('   ⚠️ Monitor slow queries and optimize as needed');

    console.log('\n🎉 Database optimization completed successfully!');

  } catch (error) {
    console.error('❌ Database optimization failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the optimization
optimizeDatabase(); 