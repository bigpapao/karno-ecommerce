import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Brand, Product } from './src/models/index.js';

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

// New Iranian car manufacturer brands
const newBrands = [
  {
    name: 'ایرانخودرو',
    slug: 'iran-khodro',
    description: 'ایران خودرو - بزرگترین خودروساز ایران',
    featured: true,
    country: 'ایران',
    order: 1
  },
  {
    name: 'سایپا',
    slug: 'saipa',
    description: 'شرکت خودروسازی سایپا',
    featured: true,
    country: 'ایران',
    order: 2
  },
  {
    name: 'mvm',
    slug: 'mvm',
    description: 'شرکت خودروسازی MVM',
    featured: true,
    country: 'ایران',
    order: 3
  },
  {
    name: 'بهمن موتور',
    slug: 'bahman-motor',
    description: 'شرکت بهمن موتور',
    featured: true,
    country: 'ایران',
    order: 4
  }
];

// Brand mapping for products update
const brandMapping = {
  '683dfb566fbad9a693c7cc14': 'ایرانخودرو', // ایرانی -> ایرانخودرو
  '683dfb566fbad9a693c7cc15': 'ایرانخودرو', // بوش -> ایرانخودرو
  '683dfb566fbad9a693c7cc16': 'سایپا',      // وارتا -> سایپا
  '683dfb566fbad9a693c7cc17': 'mvm',        // NGK -> mvm
  '683dfb566fbad9a693c7cc18': 'بهمن موتور'  // کایابا -> بهمن موتور
};

const updateBrandsAndProducts = async () => {
  try {
    console.log('🔄 Starting brands and products update...');
    
    // Store old brand IDs for mapping
    const oldBrands = await Brand.find({});
    console.log('📋 Found old brands:', oldBrands.map(b => b.name));
    
    // Clear existing brands
    const deleteResult = await Brand.deleteMany({});
    console.log(`🗑️ Cleared ${deleteResult.deletedCount} old brands`);
    
    // Insert new brands
    const insertedBrands = await Brand.insertMany(newBrands);
    console.log('✅ Inserted new brands:', insertedBrands.map(b => b.name));
    
    // Create brand mapping for updates
    const newBrandMap = {};
    insertedBrands.forEach(brand => {
      newBrandMap[brand.name] = brand._id;
    });
    
    console.log('🔄 Updating products with new brand references...');
    
    // Update products with new brand references
    for (const oldBrandId of Object.keys(brandMapping)) {
      const newBrandName = brandMapping[oldBrandId];
      const newBrandId = newBrandMap[newBrandName];
      
      if (newBrandId) {
        const updateResult = await Product.updateMany(
          { brand: oldBrandId },
          { 
            $set: { 
              brand: newBrandId
            }
          }
        );
        console.log(`🔄 Updated ${updateResult.modifiedCount} products from old brand to ${newBrandName}`);
      }
    }
    
    // Verify the update safely
    console.log('📊 Verifying updated products...');
    const updatedProducts = await Product.find({});
    
    for (const product of updatedProducts) {
      try {
        await product.populate('brand');
        const brandName = product.brand ? product.brand.name : 'No Brand';
        console.log(`  - ${product.name} -> ${brandName}`);
      } catch (error) {
        console.log(`  - ${product.name} -> Error populating brand: ${error.message}`);
      }
    }
    
    console.log('🎉 Brands and products update completed successfully!');
    
  } catch (error) {
    console.error('❌ Error updating brands and products:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await updateBrandsAndProducts();
  await mongoose.disconnect();
  console.log('✅ Database connection closed');
};

// Run the script
main().catch(console.error); 