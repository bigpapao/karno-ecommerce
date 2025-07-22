import mongoose from 'mongoose';
import 'dotenv/config';
import Manufacturer from './src/models/Manufacturer.js';
import VehicleModel from './src/models/VehicleModel.js';

const checkManufacturers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/karno');
    console.log('Connected to MongoDB');

    const manufacturers = await Manufacturer.find({}).select('name nameEn slug');
    console.log('Available manufacturers:');
    manufacturers.forEach(m => console.log(`  ${m.name} (slug: ${m.slug})`));

    const saipaManufacturer = await Manufacturer.findOne({ slug: 'saipa' });
    if (saipaManufacturer) {
      console.log(`\nFound SAIPA: ${saipaManufacturer.name}`);
      
      // Check existing Saipa models
      const saipaModels = await VehicleModel.find({ manufacturer: saipaManufacturer._id }).select('name yearRange engineVariants marketSegment popularity partsAvailability');
      console.log(`\nSAIPA models count: ${saipaModels.length}`);
      
      const enhancedModels = saipaModels.filter(m => m.yearRange || m.engineVariants?.length > 0);
      console.log(`Enhanced models: ${enhancedModels.length}`);
      
      if (enhancedModels.length > 0) {
        console.log('\nSample enhanced model:');
        console.log(JSON.stringify(enhancedModels[0], null, 2));
      }
    } else {
      console.log('\nSAIPA manufacturer not found!');
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    mongoose.disconnect();
  }
};

checkManufacturers(); 