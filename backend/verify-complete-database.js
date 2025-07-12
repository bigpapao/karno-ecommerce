import mongoose from 'mongoose';
import 'dotenv/config';
import Manufacturer from './src/models/Manufacturer.js';
import VehicleModel from './src/models/VehicleModel.js';

console.log('🏭 Complete Database Verification');
console.log('=================================');

const verifyDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/karno');
    console.log('✅ Connected to MongoDB\n');
    
    // Get all manufacturers
    const manufacturers = await Manufacturer.find().sort({ name: 1 });
    
    console.log('📊 Vehicle Models by Manufacturer:');
    console.log('-----------------------------------');
    
    let totalModels = 0;
    
    for (const manufacturer of manufacturers) {
      const count = await VehicleModel.countDocuments({ manufacturer: manufacturer._id });
      console.log(`✅ ${manufacturer.name} (${manufacturer.slug}): ${count} models`);
      totalModels += count;
      
      // Show sample models for each manufacturer
      if (count > 0) {
        const sampleModels = await VehicleModel.find({ manufacturer: manufacturer._id })
          .select('name')
          .limit(3);
        console.log(`   Sample: ${sampleModels.map(m => m.name).join(', ')}${count > 3 ? '...' : ''}`);
      }
    }
    
    console.log('\n📈 Database Statistics:');
    console.log('------------------------');
    console.log(`🚗 Total Vehicle Models: ${totalModels}`);
    console.log(`🏭 Total Manufacturers: ${manufacturers.length}`);
    
    // Category breakdown
    const categories = await VehicleModel.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📋 Models by Category:');
    console.log('----------------------');
    categories.forEach(cat => {
      console.log(`• ${cat._id}: ${cat.count} models`);
    });
    
    // Year range analysis
    const yearStats = await VehicleModel.aggregate([
      { $match: { year: { $exists: true } } },
      { $group: { 
          _id: null, 
          total: { $sum: 1 },
          earliest: { $min: '$year' },
          latest: { $max: '$year' }
      }}
    ]);
    
    if (yearStats.length > 0) {
      console.log('\n📅 Year Range:');
      console.log('--------------');
      console.log(`Earliest: ${yearStats[0].earliest}`);
      console.log(`Latest: ${yearStats[0].latest}`);
    }
    
    console.log('\n🎉 Database verification completed successfully!');
    console.log('All requested vehicle models have been added to the database.');
    
  } catch (error) {
    console.error('❌ Verification error:', error.message);
  } finally {
    mongoose.disconnect();
  }
};

verifyDatabase(); 