import mongoose from 'mongoose';
import 'dotenv/config';
import Manufacturer from './src/models/Manufacturer.js';
import VehicleModel from './src/models/VehicleModel.js';

console.log('🚀 Starting SAIPA models script...');

// Helper function to create slug from Persian text  
const createSlug = (text, manufacturer = '') => {
  const cleanText = text
    .replace(/[()]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
  
  return manufacturer ? `${manufacturer}-${cleanText}` : cleanText;
};

// Basic SAIPA models for testing
const saipaModels = [
  { name: 'پراید 111', nameEn: 'Pride 111', category: 'هاچبک', engine: '1000cc', year: '1990-2018' },
  { name: 'پراید 131', nameEn: 'Pride 131', category: 'سدان', engine: '1300cc', year: '1993-2018' },
  { name: 'کوییک', nameEn: 'Quick', category: 'هاچبک', engine: '1500cc', year: '2010-2020' },
  { name: 'تیبا', nameEn: 'Tiba', category: 'هاچبک', engine: '1500cc', year: '2009-2018' },
  { name: 'ساینا', nameEn: 'Saina', category: 'سدان', engine: '1500cc', year: '2010-2020' }
];

const addSaipaModels = async () => {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/karno');
    console.log('✅ Connected to MongoDB');
    
    console.log('🔍 Looking for SAIPA manufacturer...');
    const saipaManufacturer = await Manufacturer.findOne({ slug: 'saipa' });
    
    if (!saipaManufacturer) {
      console.error('❌ SAIPA manufacturer not found.');
      console.log('Available manufacturers:');
      const allManufacturers = await Manufacturer.find({}).select('name slug');
      allManufacturers.forEach(m => console.log(`  - ${m.name} (${m.slug})`));
      return;
    }
    
    console.log(`✅ Found SAIPA manufacturer: ${saipaManufacturer.name} (ID: ${saipaManufacturer._id})`);
    
    let added = 0;
    let skipped = 0;
    
    console.log(`📦 Processing ${saipaModels.length} models...`);
    
    for (const modelData of saipaModels) {
      console.log(`\n🔄 Processing: ${modelData.name}`);
      
      const slug = createSlug(modelData.nameEn || modelData.name, 'saipa');
      console.log(`   Generated slug: ${slug}`);
      
      const existingModel = await VehicleModel.findOne({ slug });
      
      if (existingModel) {
        console.log(`⏭️  Skipped ${modelData.name} (already exists)`);
        skipped++;
        continue;
      }
      
      const vehicleModel = new VehicleModel({
        name: modelData.name,
        nameEn: modelData.nameEn,
        slug: slug,
        manufacturer: saipaManufacturer._id,
        year: modelData.year,
        engine: modelData.engine,
        category: modelData.category,
        description: `${modelData.name} - مدل تولیدی سایپا`,
        specifications: {
          engineSize: modelData.engine,
          fuelType: 'بنزین'
        },
        popular: ['پراید', 'کوییک', 'ساینا'].some(popular => modelData.name.includes(popular)),
        isActive: true
      });
      
      console.log(`💾 Saving ${modelData.name}...`);
      await vehicleModel.save();
      console.log(`✅ Added ${vehicleModel.name} (ID: ${vehicleModel._id})`);
      added++;
    }
    
    console.log(`\n🎉 SAIPA models import completed!`);
    console.log(`✅ Added: ${added} models`);
    console.log(`⏭️  Skipped: ${skipped} models (already existed)`);
    console.log(`📊 Total SAIPA models in database: ${added + skipped}`);
    
  } catch (error) {
    console.error('❌ Error adding SAIPA models:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    console.log('🔌 Disconnecting from MongoDB...');
    mongoose.disconnect();
  }
};

console.log('📋 Models to add:', saipaModels.map(m => m.name));
addSaipaModels(); 