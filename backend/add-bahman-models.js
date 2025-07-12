import mongoose from 'mongoose';
import 'dotenv/config';
import Manufacturer from './src/models/Manufacturer.js';
import VehicleModel from './src/models/VehicleModel.js';

// Helper function to create slug from Persian text  
const createSlug = (text, manufacturer = '') => {
  const cleanText = text
    .replace(/[()]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
  
  return manufacturer ? `${manufacturer}-${cleanText}` : cleanText;
};

// Bahman Motor Vehicle Models (10+ models)
const bahmanModels = [
  // Fidelity Series
  { name: 'فیدلیتی پرایم', nameEn: 'Fidelity Prime', category: 'وانت', engine: '2500cc Diesel', year: '2015-2024' },
  { name: 'فیدلیتی پرستیژ', nameEn: 'Fidelity Prestige', category: 'وانت', engine: '2500cc Diesel', year: '2016-2024' },
  { name: 'فیدلیتی XB1', nameEn: 'Fidelity XB1', category: 'وانت', engine: '2200cc Diesel', year: '2018-2024' },
  
  // Dignity Series
  { name: 'دیگنیتی پرایم', nameEn: 'Dignity Prime', category: 'وانت', engine: '2500cc Diesel', year: '2017-2024' },
  { name: 'دیگنیتی پرستیژ', nameEn: 'Dignity Prestige', category: 'وانت', engine: '2500cc Diesel', year: '2018-2024' },
  
  // Respect Series
  { name: 'ریسپکت', nameEn: 'Respect', category: 'وانت', engine: '2200cc Diesel', year: '2014-2020' },
  { name: 'ریسپکت II', nameEn: 'Respect II', category: 'وانت', engine: '2400cc Diesel', year: '2018-2024' },
  
  // Capra Series
  { name: 'کاپرا 2', nameEn: 'Capra 2', category: 'وانت', engine: '2500cc Diesel', year: '2020-2024' },
  { name: 'کاپرا 2 دو کابین', nameEn: 'Capra 2 Double Cabin', category: 'وانت', engine: '2500cc Diesel', year: '2020-2024' },
  { name: 'کاپرا 2 تک کابین', nameEn: 'Capra 2 Single Cabin', category: 'وانت', engine: '2500cc Diesel', year: '2020-2024' },
  
  // Kara Series
  { name: 'کارا', nameEn: 'Kara', category: 'وانت', engine: '1800cc', year: '2019-2024' },
  { name: 'کارا دو کابین', nameEn: 'Kara Double Cabin', category: 'وانت', engine: '1800cc', year: '2020-2024' }
];

const addBahmanModels = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/karno');
    console.log('Connected to MongoDB');
    
    // Find Bahman Motor manufacturer
    const bahmanManufacturer = await Manufacturer.findOne({ slug: 'bahman-motor' });
    if (!bahmanManufacturer) {
      console.error('Bahman Motor manufacturer not found. Please run add-iranian-manufacturers.js first.');
      return;
    }
    
    console.log(`Found Bahman Motor manufacturer: ${bahmanManufacturer.name}`);
    
    let added = 0;
    let skipped = 0;
    
    for (const modelData of bahmanModels) {
      const slug = createSlug(modelData.nameEn || modelData.name, 'bahman');
      
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
        manufacturer: bahmanManufacturer._id,
        year: modelData.year,
        engine: modelData.engine,
        category: modelData.category,
        description: `${modelData.name} - مدل تولیدی گروه بهمن`,
        specifications: {
          engineSize: modelData.engine,
          fuelType: modelData.engine.includes('Diesel') ? 'دیزل' : 'بنزین'
        },
        popular: ['کاپرا', 'فیدلیتی', 'ریسپکت'].some(popular => modelData.name.includes(popular)),
        isActive: true
      });
      
      await vehicleModel.save();
      console.log(`✅ Added ${vehicleModel.name}`);
      added++;
    }
    
    console.log(`\n🎉 Bahman Motor models import completed!`);
    console.log(`✅ Added: ${added} models`);
    console.log(`⏭️  Skipped: ${skipped} models (already existed)`);
    console.log(`📊 Total Bahman Motor models in database: ${added + skipped}`);
    
  } catch (error) {
    console.error('❌ Error adding Bahman Motor models:', error.message);
  } finally {
    mongoose.disconnect();
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addBahmanModels();
}

export default addBahmanModels; 