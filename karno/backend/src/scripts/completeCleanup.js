import { connectDB } from '../config/database.js';
import mongoose from 'mongoose';
import fs from 'fs';

async function completeCleanup() {
  const results = [];
  const log = (message) => {
    console.log(message);
    results.push(message);
  };

  try {
    await connectDB();
    log('=== DATABASE CLEANUP STARTED ===');
    log('Timestamp: ' + new Date().toISOString());
    log('');

    const db = mongoose.connection.db;

    // 1. Get all collection stats
    log('1. COLLECTION ANALYSIS:');
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      try {
        const stats = await db.collection(collection.name).stats();
        log(`   ${collection.name}: ${stats.count} documents, ${Math.round(stats.storageSize/1024)}KB storage`);
      } catch (error) {
        log(`   ${collection.name}: Error getting stats - ${error.message}`);
      }
    }
    log('');

    // 2. Check indexes
    log('2. INDEX ANALYSIS:');
    let totalIndexes = 0;
    for (const collection of collections) {
      try {
        const indexes = await db.collection(collection.name).listIndexes().toArray();
        totalIndexes += indexes.length;
        log(`   ${collection.name}: ${indexes.length} indexes`);
        
        // Check for duplicate indexes
        const indexKeys = new Map();
        const duplicates = [];
        
        indexes.forEach(index => {
          if (index.name === '_id_') return;
          const keyString = JSON.stringify(index.key);
          if (indexKeys.has(keyString)) {
            duplicates.push(index.name);
          } else {
            indexKeys.set(keyString, index.name);
          }
        });

        if (duplicates.length > 0) {
          log(`      WARNING: ${duplicates.length} duplicate indexes found`);
          duplicates.forEach(dup => log(`         - ${dup}`));
        }
      } catch (error) {
        log(`   ${collection.name}: Error getting indexes - ${error.message}`);
      }
    }
    log(`   TOTAL INDEXES: ${totalIndexes}`);
    log('');

    // 3. Clean up old carts
    log('3. CLEANING OLD CARTS:');
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const oldCartCount = await db.collection('carts').countDocuments({ 
        updatedAt: { $lt: thirtyDaysAgo } 
      });
      
      if (oldCartCount > 0) {
        const deleteResult = await db.collection('carts').deleteMany({ 
          updatedAt: { $lt: thirtyDaysAgo } 
        });
        log(`   ✅ Deleted ${deleteResult.deletedCount} old cart records`);
      } else {
        log('   ✅ No old cart records found');
      }
    } catch (error) {
      log(`   ❌ Error cleaning carts: ${error.message}`);
    }
    log('');

    // 4. Clean up products
    log('4. CLEANING PRODUCT DATA:');
    try {
      const totalProducts = await db.collection('products').countDocuments();
      log(`   Total products: ${totalProducts}`);

      // Count problems
      const noName = await db.collection('products').countDocuments({ 
        $or: [{ name: null }, { name: "" }, { name: { $exists: false } }]
      });
      
      const noSKU = await db.collection('products').countDocuments({ 
        $or: [{ sku: null }, { sku: "" }, { sku: { $exists: false } }]
      });
      
      const badPrice = await db.collection('products').countDocuments({ 
        $or: [{ price: { $lte: 0 } }, { price: null }, { price: { $exists: false } }]
      });

      log(`   Products without name: ${noName}`);
      log(`   Products without SKU: ${noSKU}`);
      log(`   Products with bad price: ${badPrice}`);

      // Clean up bad products
      if (noName > 0 || noSKU > 0) {
        const deleteResult = await db.collection('products').deleteMany({
          $or: [
            { name: null }, { name: "" }, { name: { $exists: false } },
            { sku: null }, { sku: "" }, { sku: { $exists: false } }
          ]
        });
        log(`   ✅ Deleted ${deleteResult.deletedCount} invalid products`);
      }

      // Fix prices
      if (badPrice > 0) {
        const updateResult = await db.collection('products').updateMany(
          { $or: [{ price: { $lte: 0 } }, { price: null }, { price: { $exists: false } }] },
          { $set: { price: 10000 } }
        );
        log(`   ✅ Fixed ${updateResult.modifiedCount} products with bad prices`);
      }

      // Remove duplicate SKUs
      const duplicates = await db.collection('products').aggregate([
        { $group: { _id: "$sku", count: { $sum: 1 }, ids: { $push: "$_id" } } },
        { $match: { count: { $gt: 1 } } }
      ]).toArray();

      if (duplicates.length > 0) {
        let duplicatesRemoved = 0;
        for (const dup of duplicates) {
          // Keep the first, delete the rest
          const toDelete = dup.ids.slice(1);
          const delResult = await db.collection('products').deleteMany({ 
            _id: { $in: toDelete } 
          });
          duplicatesRemoved += delResult.deletedCount;
        }
        log(`   ✅ Removed ${duplicatesRemoved} duplicate products`);
      } else {
        log('   ✅ No duplicate products found');
      }

    } catch (error) {
      log(`   ❌ Error cleaning products: ${error.message}`);
    }
    log('');

    // 5. Storage analysis
    log('5. STORAGE ANALYSIS:');
    try {
      const dbStats = await db.stats();
      log(`   Database size: ${Math.round(dbStats.dataSize / 1024)}KB data, ${Math.round(dbStats.indexSize / 1024)}KB indexes`);
      log(`   Total storage: ${Math.round(dbStats.storageSize / 1024)}KB`);
      log(`   Collections: ${dbStats.collections}`);
      log(`   Objects: ${dbStats.objects}`);
    } catch (error) {
      log(`   ❌ Error getting storage stats: ${error.message}`);
    }
    log('');

    // 6. Recommendations
    log('6. RECOMMENDATIONS:');
    log('   - Consider running db.runCommand({compact: "collection_name"}) to reclaim disk space');
    log('   - Remove unused indexes to improve write performance');
    log('   - Set up regular cleanup of old cart records');
    log('   - Monitor for duplicate data creation');
    log('');

    log('=== DATABASE CLEANUP COMPLETED ===');
    log('Timestamp: ' + new Date().toISOString());

    // Write results to file
    const outputFile = 'database_cleanup_report.txt';
    fs.writeFileSync(outputFile, results.join('\n'));
    log(`\n📄 Full report saved to: ${outputFile}`);

  } catch (error) {
    log(`❌ CLEANUP ERROR: ${error.message}`);
  } finally {
    await mongoose.connection.close();
  }
}

completeCleanup(); 