import { connectDB } from '../config/database.js';
import mongoose from 'mongoose';

// Import models to ensure they are registered
import VehicleModel from '../models/VehicleModel.js';
import Product from '../models/product.model.js';

const initializeModelCounts = async () => {
  try {
    console.log('🚀 Initializing vehicle model product counts...\n');
    
    await connectDB();
    console.log('✅ Connected to database\n');

    // Get all active vehicle models without population
    const models = await mongoose.connection.db.collection('vehiclemodels').find({ isActive: true }).toArray();
    console.log(`Found ${models.length} active vehicle models\n`);

    let updatedCount = 0;
    
    for (const model of models) {
      try {
        // Count products for this model
        const productCount = await Product.countDocuments({
          'compatibleVehicles.modelId': model._id,
          $or: [
            { status: { $exists: false } },
            { status: 'active' }
          ]
        });

        // Update the model's product count
        await mongoose.connection.db.collection('vehiclemodels').updateOne(
          { _id: model._id },
          { $set: { productsCount: productCount } }
        );

        console.log(`✅ ${model.name}: ${productCount} products`);
        updatedCount++;
      } catch (error) {
        console.error(`❌ Error updating ${model.name}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Successfully updated ${updatedCount} vehicle models!`);
    
  } catch (error) {
    console.error('❌ Error initializing model counts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔚 Database connection closed');
  }
};

initializeModelCounts(); 