import mongoose from 'mongoose';
import { connectDB } from './src/config/database.js';
import VehicleModel from './src/models/VehicleModel.js';
import Manufacturer from './src/models/Manufacturer.js';

// Vehicle Image Mapper
const vehicleImageMapper = {
  // Quick Series
  'کوییک': '/images/models/quick.jpeg',
  'quick': '/images/models/quick.jpeg',
  'کوییک R': '/images/models/quick-r.jpeg',
  'quick-r': '/images/models/quick-r.jpeg',
  'کوییک S': '/images/models/quick-s.jpeg',
  'quick-s': '/images/models/quick-s.jpeg',
  'کوییک اتوماتیک': '/images/models/quick-automatic.jpeg',
  'quick-automatic': '/images/models/quick-automatic.jpeg',
  'کوییک GX-L': '/images/models/quick-gxl.jpeg',
  'quick-gxl': '/images/models/quick-gxl.jpeg',
  'کوییک R تیپ GX-L': '/images/models/quick-r-gxl.jpeg',
  'quick-r-gxl': '/images/models/quick-r-gxl.jpeg',
  'کوییک اتوماتیک با سیستم کنترل کشش ESC': '/images/models/quick-automatic-esc.jpeg',
  'quick-automatic-esc': '/images/models/quick-automatic-esc.jpeg',

  // Pride Series
  'پراید 111': '/images/models/pride-111.jpeg',
  'pride-111': '/images/models/pride-111.jpeg',
  'پراید 131': '/images/models/pride-131.jpeg',
  'pride-131': '/images/models/pride-131.jpeg',
  'پراید 132': '/images/models/pride-132.jpeg',
  'pride-132': '/images/models/pride-132.jpeg',
  'پراید 141': '/images/models/pride-141.jpeg',
  'pride-141': '/images/models/pride-141.jpeg',
  'پراید 151': '/images/models/pride-151.jpeg',
  'pride-151': '/images/models/pride-151.jpeg',

  // Classic SAIPA Models
  'سایپا نسیم': '/images/models/saipa-nasim.jpeg',
  'saipa-nasim': '/images/models/saipa-nasim.jpeg',
  'سایپا صبا': '/images/models/saipa-saba.jpeg',
  'saipa-saba': '/images/models/saipa-saba.jpeg',

  // Tiba Series
  'تیبا': '/images/models/tiba.jpeg',
  'tiba': '/images/models/tiba.jpeg',
  'تیبا 2': '/images/models/tiba-2.jpeg',
  'tiba-2': '/images/models/tiba-2.jpeg',

  // Saina Series
  'ساینا': '/images/models/saina.jpeg',
  'saina': '/images/models/saina.jpeg',
  'ساینا S': '/images/models/saina-s.jpeg',
  'saina-s': '/images/models/saina-s.jpeg',
  'ساینا GX-L': '/images/models/saina-gxl.jpeg',
  'saina-gxl': '/images/models/saina-gxl.jpeg',
  'ساینا GX-L دوگانه سوز': '/images/models/saina-gxl-dual-fuel.jpeg',
  'saina-gxl-dual-fuel': '/images/models/saina-gxl-dual-fuel.jpeg',
  'ساینا اتوماتیک S': '/images/models/saina-automatic-s.jpeg',
  'saina-automatic-s': '/images/models/saina-automatic-s.jpeg',

  // Shahin Series
  'شاهین': '/images/models/shahin.jpeg',
  'shahin': '/images/models/shahin.jpeg',
  'شاهین G': '/images/models/shahin-g.jpeg',
  'shahin-g': '/images/models/shahin-g.jpeg',
  'شاهین GL': '/images/models/shahin-gl.jpeg',
  'shahin-gl': '/images/models/shahin-gl.jpeg',
  'شاهین CVT اتوماتیک': '/images/models/shahin-cvt.jpeg',
  'shahin-cvt': '/images/models/shahin-cvt.jpeg',
  'شاهین پلاس اتوماتیک': '/images/models/shahin-plus.jpeg',
  'shahin-plus': '/images/models/shahin-plus.jpeg',

  // Atlas Series
  'سایپا اطلس': '/images/models/saipa-atlas.jpeg',
  'saipa-atlas': '/images/models/saipa-atlas.jpeg',
  'سایپا اطلس پلاس': '/images/models/saipa-atlas-plus.jpeg',
  'saipa-atlas-plus': '/images/models/saipa-atlas-plus.jpeg',

  // Zamyad Series - Pickup Trucks
  'زامیاد وانت': '/images/models/zamyad-pickup.webp',
  'zamyad-pickup': '/images/models/zamyad-pickup.webp',
  'وانت نیسان زامیاد بنزینی': '/images/models/zamyad-pickup.webp',
  'nissan-zamyad-pickup-gasoline': '/images/models/zamyad-pickup.webp',
  'وانت نیسان زامیاد دیزلی': '/images/models/zamyad-pickup.webp',
  'nissan-zamyad-pickup-diesel': '/images/models/zamyad-pickup.webp',
  'وانت نیسان زامیاد دوگانه سوز': '/images/models/zamyad-pickup.webp',
  'nissan-zamyad-pickup-dual-fuel': '/images/models/zamyad-pickup.webp',
  'زامیاد زاگرس': '/images/models/zamyad-pickup.webp',
  'zamyad-zagros': '/images/models/zamyad-pickup.webp',

  // Zamyad Series - Vans
  'زامیاد ون': '/images/models/zamyad-van.webp',
  'zamyad-van': '/images/models/zamyad-van.webp',

  // Zamyad Series - General
  'زامیاد': '/images/models/zamyad.webp',
  'zamyad': '/images/models/zamyad.webp',

  // Other Models
  'سایپا سحند': '/images/models/sahand.jpeg',
  'sahand': '/images/models/sahand.jpeg',
};

/**
 * Get vehicle image by model name
 */
const getVehicleImage = (modelName) => {
  if (!modelName) {
    return '/images/models/default-car.jpg';
  }

  // Try exact match first
  if (vehicleImageMapper[modelName]) {
    return vehicleImageMapper[modelName];
  }

  // Try case-insensitive match
  const lowerModelName = modelName.toLowerCase();
  for (const [key, value] of Object.entries(vehicleImageMapper)) {
    if (key.toLowerCase() === lowerModelName) {
      return value;
    }
  }

  // Try partial match for similar models
  for (const [key, value] of Object.entries(vehicleImageMapper)) {
    if (key.toLowerCase().includes(lowerModelName) || lowerModelName.includes(key.toLowerCase())) {
      return value;
    }
  }

  // Return default image if no match found
  return '/images/models/default-car.jpg';
};

const updateVehicleImages = async () => {
  try {
    console.log('🚀 Starting vehicle image update process...');
    
    // Connect to database
    await connectDB();
    
    // Get all vehicle models
    const models = await VehicleModel.find({}).populate('manufacturer');
    console.log(`📊 Found ${models.length} vehicle models in database`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    const updateResults = [];
    
    for (const model of models) {
      const currentImage = model.image;
      const newImage = getVehicleImage(model.name);
      
      if (newImage !== '/images/models/default-car.jpg' && newImage !== currentImage) {
        try {
          await VehicleModel.findByIdAndUpdate(model._id, {
            image: newImage
          });
          
          updateResults.push({
            model: model.name,
            oldImage: currentImage,
            newImage: newImage,
            status: 'updated'
          });
          
          updatedCount++;
          console.log(`✅ Updated ${model.name}: ${currentImage} → ${newImage}`);
        } catch (error) {
          console.error(`❌ Error updating ${model.name}:`, error.message);
          updateResults.push({
            model: model.name,
            oldImage: currentImage,
            newImage: newImage,
            status: 'error',
            error: error.message
          });
        }
      } else {
        skippedCount++;
        console.log(`⏭️  Skipped ${model.name}: ${currentImage} (no change needed)`);
      }
    }
    
    // Print summary
    console.log('\n📋 Update Summary:');
    console.log(`• Total models: ${models.length}`);
    console.log(`• Updated: ${updatedCount}`);
    console.log(`• Skipped: ${skippedCount}`);
    console.log(`• Errors: ${updateResults.filter(r => r.status === 'error').length}`);
    
    // Print detailed results
    console.log('\n📝 Detailed Results:');
    updateResults.forEach(result => {
      if (result.status === 'updated') {
        console.log(`✅ ${result.model}: ${result.oldImage} → ${result.newImage}`);
      } else if (result.status === 'error') {
        console.log(`❌ ${result.model}: ${result.error}`);
      }
    });
    
    console.log('\n🎉 Vehicle image update completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error updating vehicle images:', error);
    process.exit(1);
  }
};

// Run the update
updateVehicleImages(); 