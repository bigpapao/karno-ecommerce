import { connectDB } from '../config/database.js';
import mongoose from 'mongoose';
import Product from '../models/product.model.js';
import Category from '../models/category.model.js';
import Brand from '../models/brand.model.js';
import Cart from '../models/cart.model.js';

const performCleanup = async () => {
  try {
    await connectDB();
    console.log('🧹 Starting immediate database cleanup...\n');
    
    let cleanupActions = [];

    // 1. Remove old cart records (older than 30 days)
    console.log('1. Cleaning up old cart records...');
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const oldCartsResult = await Cart.deleteMany({
      updatedAt: { $lt: thirtyDaysAgo }
    });
    console.log(`   ✅ Deleted ${oldCartsResult.deletedCount} old cart records`);
    cleanupActions.push(`Deleted ${oldCartsResult.deletedCount} old cart records`);

    // 2. Clean up products with missing essential data
    console.log('\n2. Cleaning up incomplete products...');
    const incompleteProducts = await Product.find({
      $or: [
        { name: { $in: [null, "", undefined] } },
        { sku: { $in: [null, "", undefined] } }
      ]
    });
    
    if (incompleteProducts.length > 0) {
      console.log(`   Found ${incompleteProducts.length} incomplete products - will delete them`);
      const result = await Product.deleteMany({
        $or: [
          { name: { $in: [null, "", undefined] } },
          { sku: { $in: [null, "", undefined] } }
        ]
      });
      console.log(`   ✅ Deleted ${result.deletedCount} incomplete products`);
      cleanupActions.push(`Deleted ${result.deletedCount} incomplete products`);
    } else {
      console.log('   ✅ No incomplete products found');
    }

    // 3. Fix products with zero/negative prices
    console.log('\n3. Fixing products with invalid prices...');
    const invalidPriceProducts = await Product.find({
      $or: [
        { price: { $lte: 0 } },
        { price: null },
        { price: undefined }
      ]
    });
    
    if (invalidPriceProducts.length > 0) {
      console.log(`   Found ${invalidPriceProducts.length} products with invalid prices`);
      
      // Set a default price for products with invalid prices
      const fixPriceResult = await Product.updateMany(
        {
          $or: [
            { price: { $lte: 0 } },
            { price: null },
            { price: undefined }
          ]
        },
        { $set: { price: 10000 } } // Default 10,000 toman
      );
      console.log(`   ✅ Fixed ${fixPriceResult.modifiedCount} products with default price`);
      cleanupActions.push(`Fixed ${fixPriceResult.modifiedCount} products with invalid prices`);
    } else {
      console.log('   ✅ All products have valid prices');
    }

    // 4. Remove duplicate products by SKU (keep the latest one)
    console.log('\n4. Removing duplicate products by SKU...');
    const duplicateSKUs = await Product.aggregate([
      {
        $group: {
          _id: "$sku",
          count: { $sum: 1 },
          ids: { $push: "$_id" },
          names: { $push: "$name" },
          dates: { $push: "$createdAt" }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]);

    let totalDuplicatesRemoved = 0;
    for (const duplicate of duplicateSKUs) {
      // Sort by creation date and keep the newest
      const sortedProducts = await Product.find({ 
        _id: { $in: duplicate.ids } 
      }).sort({ createdAt: -1 });
      
      // Delete all except the first (newest)
      const toDelete = sortedProducts.slice(1).map(p => p._id);
      if (toDelete.length > 0) {
        await Product.deleteMany({ _id: { $in: toDelete } });
        totalDuplicatesRemoved += toDelete.length;
        console.log(`   Removed ${toDelete.length} duplicates of SKU: ${duplicate._id}`);
      }
    }
    
    if (totalDuplicatesRemoved > 0) {
      console.log(`   ✅ Removed ${totalDuplicatesRemoved} duplicate products`);
      cleanupActions.push(`Removed ${totalDuplicatesRemoved} duplicate products`);
    } else {
      console.log('   ✅ No duplicate products found');
    }

    // 5. Clean up orphaned references
    console.log('\n5. Cleaning up orphaned references...');
    const categories = await Category.find({}).lean();
    const brands = await Brand.find({}).lean();
    
    const categoryIds = new Set(categories.map(c => c._id.toString()));
    const brandIds = new Set(brands.map(b => b._id.toString()));
    
    // Fix products with invalid category references
    const invalidCategoryResult = await Product.updateMany(
      { 
        category: { 
          $exists: true, 
          $ne: null,
          $nin: Array.from(categoryIds).map(id => new mongoose.Types.ObjectId(id))
        }
      },
      { $unset: { category: 1 } }
    );
    
    // Fix products with invalid brand references
    const invalidBrandResult = await Product.updateMany(
      { 
        brand: { 
          $exists: true, 
          $ne: null,
          $nin: Array.from(brandIds).map(id => new mongoose.Types.ObjectId(id))
        }
      },
      { $unset: { brand: 1 } }
    );
    
    console.log(`   ✅ Fixed ${invalidCategoryResult.modifiedCount} products with invalid category references`);
    console.log(`   ✅ Fixed ${invalidBrandResult.modifiedCount} products with invalid brand references`);
    if (invalidCategoryResult.modifiedCount > 0 || invalidBrandResult.modifiedCount > 0) {
      cleanupActions.push(`Fixed ${invalidCategoryResult.modifiedCount + invalidBrandResult.modifiedCount} orphaned references`);
    }

    // 6. Remove empty/broken image references
    console.log('\n6. Cleaning up broken image references...');
    const brokenImageResult = await Product.updateMany(
      {},
      {
        $pull: {
          images: {
            $or: [
              { url: { $in: [null, "", undefined] } },
              { url: { $regex: "^(?!(/uploads/|http))" } }
            ]
          }
        }
      }
    );
    
    if (brokenImageResult.modifiedCount > 0) {
      console.log(`   ✅ Cleaned up broken image references in ${brokenImageResult.modifiedCount} products`);
      cleanupActions.push(`Cleaned up broken image references in ${brokenImageResult.modifiedCount} products`);
    } else {
      console.log('   ✅ No broken image references found');
    }

    // 7. Compact collections to reclaim disk space
    console.log('\n7. Compacting collections to reclaim disk space...');
    try {
      // Note: compact command requires admin privileges and might not work in all setups
      await mongoose.connection.db.command({ compact: 'products' });
      console.log('   ✅ Compacted products collection');
      
      await mongoose.connection.db.command({ compact: 'carts' });
      console.log('   ✅ Compacted carts collection');
      
      cleanupActions.push('Compacted collections to reclaim disk space');
    } catch (error) {
      console.log('   ⚠️  Could not compact collections (admin privileges required)');
    }

    // Summary
    console.log('\n📊 Cleanup Summary:');
    if (cleanupActions.length > 0) {
      cleanupActions.forEach((action, index) => {
        console.log(`   ${index + 1}. ${action}`);
      });
    } else {
      console.log('   ✅ Database was already clean - no actions needed');
    }

    console.log('\n✅ Database cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.connection.close();
  }
};

// If running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  performCleanup();
}

export default performCleanup; 