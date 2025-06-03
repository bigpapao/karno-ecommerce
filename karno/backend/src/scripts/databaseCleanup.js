import { connectDB } from '../config/database.js';
import mongoose from 'mongoose';
import Product from '../models/product.model.js';
import Category from '../models/category.model.js';
import Brand from '../models/brand.model.js';
import User from '../models/user.model.js';
import Order from '../models/order.model.js';
import Cart from '../models/cart.model.js';
import VehicleModel from '../models/VehicleModel.js';
import Manufacturer from '../models/Manufacturer.js';

const cleanup = async () => {
  try {
    await connectDB();
    console.log('🔍 Starting database cleanup analysis...\n');

    // 1. Check for orphaned references
    await checkOrphanedReferences();
    
    // 2. Check for duplicate data
    await checkDuplicateData();
    
    // 3. Check for unused/empty records
    await checkEmptyRecords();
    
    // 4. Analyze indexes
    await analyzeIndexes();
    
    // 5. Check file references
    await checkFileReferences();
    
    // 6. Suggest optimizations
    await suggestOptimizations();

    console.log('\n✅ Database cleanup analysis complete!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.connection.close();
  }
};

const checkOrphanedReferences = async () => {
  console.log('🔍 Checking for orphaned references...');
  
  // Check products with invalid category/brand references
  const products = await Product.find({}).lean();
  const categories = await Category.find({}).lean();
  const brands = await Brand.find({}).lean();
  
  const categoryIds = new Set(categories.map(c => c._id.toString()));
  const brandIds = new Set(brands.map(b => b._id.toString()));
  
  let orphanedProducts = [];
  
  for (const product of products) {
    const issues = [];
    
    if (product.category && !categoryIds.has(product.category.toString())) {
      issues.push(`Invalid category: ${product.category}`);
    }
    
    if (product.brand && !brandIds.has(product.brand.toString())) {
      issues.push(`Invalid brand: ${product.brand}`);
    }
    
    if (issues.length > 0) {
      orphanedProducts.push({
        productId: product._id,
        name: product.name,
        issues
      });
    }
  }
  
  if (orphanedProducts.length > 0) {
    console.log(`   ⚠️  Found ${orphanedProducts.length} products with orphaned references:`);
    orphanedProducts.forEach(p => {
      console.log(`      - ${p.name} (${p.productId}): ${p.issues.join(', ')}`);
    });
  } else {
    console.log('   ✅ No orphaned product references found');
  }
  
  // Check vehicle model references
  const vehicleModels = await VehicleModel.find({}).lean();
  const manufacturers = await Manufacturer.find({}).lean();
  const manufacturerIds = new Set(manufacturers.map(m => m._id.toString()));
  
  let orphanedModels = [];
  for (const model of vehicleModels) {
    if (model.manufacturer && !manufacturerIds.has(model.manufacturer.toString())) {
      orphanedModels.push({
        modelId: model._id,
        name: model.name,
        manufacturerId: model.manufacturer
      });
    }
  }
  
  if (orphanedModels.length > 0) {
    console.log(`   ⚠️  Found ${orphanedModels.length} vehicle models with orphaned manufacturer references`);
    orphanedModels.forEach(m => {
      console.log(`      - ${m.name} (${m.modelId}): Invalid manufacturer ${m.manufacturerId}`);
    });
  } else {
    console.log('   ✅ No orphaned vehicle model references found');
  }
};

const checkDuplicateData = async () => {
  console.log('\n🔍 Checking for duplicate data...');
  
  // Check duplicate categories
  const duplicateCategories = await Category.aggregate([
    {
      $group: {
        _id: { name: "$name", slug: "$slug" },
        count: { $sum: 1 },
        ids: { $push: "$_id" }
      }
    },
    { $match: { count: { $gt: 1 } } }
  ]);
  
  if (duplicateCategories.length > 0) {
    console.log(`   ⚠️  Found ${duplicateCategories.length} duplicate category groups:`);
    duplicateCategories.forEach(dup => {
      console.log(`      - "${dup._id.name}" appears ${dup.count} times`);
    });
  } else {
    console.log('   ✅ No duplicate categories found');
  }
  
  // Check duplicate brands
  const duplicateBrands = await Brand.aggregate([
    {
      $group: {
        _id: { name: "$name", slug: "$slug" },
        count: { $sum: 1 },
        ids: { $push: "$_id" }
      }
    },
    { $match: { count: { $gt: 1 } } }
  ]);
  
  if (duplicateBrands.length > 0) {
    console.log(`   ⚠️  Found ${duplicateBrands.length} duplicate brand groups:`);
    duplicateBrands.forEach(dup => {
      console.log(`      - "${dup._id.name}" appears ${dup.count} times`);
    });
  } else {
    console.log('   ✅ No duplicate brands found');
  }
  
  // Check duplicate products by SKU
  const duplicateProducts = await Product.aggregate([
    {
      $group: {
        _id: "$sku",
        count: { $sum: 1 },
        ids: { $push: "$_id" },
        names: { $push: "$name" }
      }
    },
    { $match: { count: { $gt: 1 } } }
  ]);
  
  if (duplicateProducts.length > 0) {
    console.log(`   ⚠️  Found ${duplicateProducts.length} duplicate product SKUs:`);
    duplicateProducts.forEach(dup => {
      console.log(`      - SKU "${dup._id}" appears ${dup.count} times: ${dup.names.join(', ')}`);
    });
  } else {
    console.log('   ✅ No duplicate product SKUs found');
  }
};

const checkEmptyRecords = async () => {
  console.log('\n🔍 Checking for empty/incomplete records...');
  
  // Check products with missing essential fields
  const incompleteProducts = await Product.find({
    $or: [
      { name: { $in: [null, "", undefined] } },
      { price: { $in: [null, 0, undefined] } },
      { sku: { $in: [null, "", undefined] } }
    ]
  }).lean();
  
  if (incompleteProducts.length > 0) {
    console.log(`   ⚠️  Found ${incompleteProducts.length} incomplete products:`);
    incompleteProducts.forEach(p => {
      const issues = [];
      if (!p.name) issues.push('missing name');
      if (!p.price || p.price === 0) issues.push('missing/zero price');
      if (!p.sku) issues.push('missing SKU');
      console.log(`      - Product ${p._id}: ${issues.join(', ')}`);
    });
  } else {
    console.log('   ✅ No incomplete products found');
  }
  
  // Check categories with no products
  const categoriesWithProducts = await Product.distinct('category');
  const allCategories = await Category.find({}).lean();
  const unusedCategories = allCategories.filter(cat => 
    !categoriesWithProducts.some(usedId => usedId && usedId.toString() === cat._id.toString())
  );
  
  if (unusedCategories.length > 0) {
    console.log(`   ⚠️  Found ${unusedCategories.length} unused categories:`);
    unusedCategories.forEach(cat => {
      console.log(`      - "${cat.name}" (${cat._id})`);
    });
  } else {
    console.log('   ✅ All categories are being used');
  }
  
  // Check brands with no products
  const brandsWithProducts = await Product.distinct('brand');
  const allBrands = await Brand.find({}).lean();
  const unusedBrands = allBrands.filter(brand => 
    !brandsWithProducts.some(usedId => usedId && usedId.toString() === brand._id.toString())
  );
  
  if (unusedBrands.length > 0) {
    console.log(`   ⚠️  Found ${unusedBrands.length} unused brands:`);
    unusedBrands.forEach(brand => {
      console.log(`      - "${brand.name}" (${brand._id})`);
    });
  } else {
    console.log('   ✅ All brands are being used');
  }
  
  // Check empty carts
  const oldCarts = await Cart.find({
    updatedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // 30 days old
  }).lean();
  
  if (oldCarts.length > 0) {
    console.log(`   ⚠️  Found ${oldCarts.length} old cart records (>30 days)`);
  } else {
    console.log('   ✅ No old cart records found');
  }
};

const analyzeIndexes = async () => {
  console.log('\n🔍 Analyzing database indexes...');
  
  const collections = [
    { name: 'products', model: Product },
    { name: 'categories', model: Category },
    { name: 'brands', model: Brand },
    { name: 'users', model: User },
    { name: 'orders', model: Order },
    { name: 'carts', model: Cart }
  ];
  
  for (const collection of collections) {
    try {
      const indexes = await collection.model.collection.listIndexes().toArray();
      console.log(`   📊 ${collection.name}: ${indexes.length} indexes`);
      
      // Check for unused indexes (this would require query analysis)
      const stats = await collection.model.collection.stats();
      if (stats.count === 0) {
        console.log(`      ⚠️  Collection is empty but has ${indexes.length} indexes`);
      }
      
      // List all indexes
      indexes.forEach(index => {
        const keys = Object.keys(index.key).join(', ');
        console.log(`      - ${index.name}: {${keys}}`);
      });
      
    } catch (error) {
      console.log(`   ❌ Error analyzing ${collection.name} indexes: ${error.message}`);
    }
  }
};

const checkFileReferences = async () => {
  console.log('\n🔍 Checking file references...');
  
  // Check product images
  const productsWithImages = await Product.find({ 
    images: { $exists: true, $ne: [] } 
  }).lean();
  
  let totalImages = 0;
  let missingImages = [];
  
  for (const product of productsWithImages) {
    if (product.images && product.images.length > 0) {
      totalImages += product.images.length;
      
      for (const image of product.images) {
        // This would require actual file system check
        // For now, just check if URL looks valid
        if (!image.url || (!image.url.startsWith('/uploads/') && !image.url.startsWith('http'))) {
          missingImages.push({
            productId: product._id,
            productName: product.name,
            imageUrl: image.url
          });
        }
      }
    }
  }
  
  console.log(`   📊 Total product images in database: ${totalImages}`);
  if (missingImages.length > 0) {
    console.log(`   ⚠️  Found ${missingImages.length} invalid image references:`);
    missingImages.forEach(img => {
      console.log(`      - Product "${img.productName}": ${img.imageUrl}`);
    });
  } else {
    console.log('   ✅ All image references look valid');
  }
};

const suggestOptimizations = async () => {
  console.log('\n💡 Optimization suggestions:');
  
  // Database size analysis
  const collections = await mongoose.connection.db.listCollections().toArray();
  
  for (const collection of collections) {
    try {
      const stats = await mongoose.connection.db.collection(collection.name).stats();
      if (stats.size > 1024 * 1024) { // > 1MB
        console.log(`   📊 ${collection.name}: ${(stats.size / 1024 / 1024).toFixed(2)}MB (${stats.count} documents)`);
      }
    } catch (error) {
      // Collection might be empty or inaccessible
    }
  }
  
  console.log('\n   💡 Recommendations:');
  console.log('   1. Run db.runCommand({compact: "collection_name"}) to reclaim disk space after deletions');
  console.log('   2. Consider removing old cart records (>30 days)');
  console.log('   3. Optimize indexes - remove unused ones, add compound indexes for common queries');
  console.log('   4. Consider archiving old order data if not needed for active operations');
  console.log('   5. Validate and clean up any orphaned file references');
};

// If running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanup();
}

export default cleanup; 