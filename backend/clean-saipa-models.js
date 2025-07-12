import mongoose from 'mongoose';
import 'dotenv/config';
import Manufacturer from './src/models/Manufacturer.js';
import VehicleModel from './src/models/VehicleModel.js';

const cleanSaipaModels = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/karno');
    console.log('Connected to MongoDB');
    
    const saipa = await Manufacturer.findOne({ slug: 'saipa' });
    if (!saipa) {
      console.log('SAIPA manufacturer not found');
      return;
    }
    
    // Check current count
    const currentCount = await VehicleModel.countDocuments({ manufacturer: saipa._id });
    console.log(`Current SAIPA models: ${currentCount}`);
    
    // Remove all existing SAIPA models
    if (currentCount > 0) {
      console.log('Removing all existing SAIPA models...');
      const deleteResult = await VehicleModel.deleteMany({ manufacturer: saipa._id });
      console.log(`Deleted ${deleteResult.deletedCount} SAIPA models`);
    }
    
    // Verify cleanup
    const afterCount = await VehicleModel.countDocuments({ manufacturer: saipa._id });
    console.log(`SAIPA models after cleanup: ${afterCount}`);
    
    mongoose.disconnect();
    console.log('Ready for fresh import');
  } catch (error) {
    console.error('Error:', error.message);
  }
};

cleanSaipaModels(); 