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

// MVM (Chery) Vehicle Models (40+ models)
const mvmModels = [
  // Core MVM Models
  { name: 'MVM 110', nameEn: 'MVM 110', category: 'هاچبک', engine: '1000cc', year: '2008-2015' },
  { name: 'MVM 110s', nameEn: 'MVM 110s', category: 'هاچبک', engine: '1000cc', year: '2010-2016' },
  { name: 'MVM 315', nameEn: 'MVM 315', category: 'سدان', engine: '1500cc', year: '2009-2018' },
  { name: 'MVM 315 جدید', nameEn: 'MVM 315 New', category: 'سدان', engine: '1500cc', year: '2015-2020' },
  { name: 'MVM 530', nameEn: 'MVM 530', category: 'سدان', engine: '1800cc', year: '2011-2018' },
  { name: 'MVM 550', nameEn: 'MVM 550', category: 'سدان', engine: '2000cc', year: '2012-2019' },
  
  // X Series Crossovers
  { name: 'MVM X22', nameEn: 'MVM X22', category: 'کراس‌اوور', engine: '1500cc', year: '2018-2022' },
  { name: 'MVM X22 Pro', nameEn: 'MVM X22 Pro', category: 'کراس‌اوور', engine: '1500cc', year: '2020-2024' },
  { name: 'MVM X33', nameEn: 'MVM X33', category: 'کراس‌اوور', engine: '1600cc', year: '2019-2024' },
  { name: 'MVM X33s', nameEn: 'MVM X33s', category: 'کراس‌اوور', engine: '1600cc', year: '2020-2024' },
  { name: 'MVM X33s Sport', nameEn: 'MVM X33s Sport', category: 'کراس‌اوور', engine: '1600cc Turbo', year: '2021-2024' },
  { name: 'MVM X55', nameEn: 'MVM X55', category: 'شاسی‌بلند', engine: '1800cc', year: '2020-2024' },
  { name: 'MVM X55 Pro', nameEn: 'MVM X55 Pro', category: 'شاسی‌بلند', engine: '1800cc', year: '2021-2024' },
  { name: 'MVM X77', nameEn: 'MVM X77', category: 'شاسی‌بلند', engine: '2000cc', year: '2022-2024' },
  
  // X5 Series (Premium Line)
  { name: 'MVM X5', nameEn: 'MVM X5', category: 'کراس‌اوور', engine: '1600cc', year: '2019-2024' },
  { name: 'MVM X5 Pro', nameEn: 'MVM X5 Pro', category: 'کراس‌اوور', engine: '1600cc', year: '2020-2024' },
  { name: 'MVM X5 Plus', nameEn: 'MVM X5 Plus', category: 'کراس‌اوور', engine: '1600cc', year: '2020-2024' },
  { name: 'MVM X5 Max', nameEn: 'MVM X5 Max', category: 'کراس‌اوور', engine: '1600cc Turbo', year: '2021-2024' },
  { name: 'MVM X5 Ultra', nameEn: 'MVM X5 Ultra', category: 'کراس‌اوور', engine: '1600cc Turbo', year: '2022-2024' },
  { name: 'MVM X5 GT', nameEn: 'MVM X5 GT', category: 'کراس‌اوور', engine: '1600cc Turbo', year: '2021-2024' },
  { name: 'MVM X5 GTR', nameEn: 'MVM X5 GTR', category: 'کراس‌اوور', engine: '1600cc Turbo', year: '2022-2024' },
  
  // Trim Levels
  { name: 'MVM X5 ELX', nameEn: 'MVM X5 ELX', category: 'کراس‌اوور', engine: '1600cc', year: '2020-2024' },
  { name: 'MVM X5 SLX', nameEn: 'MVM X5 SLX', category: 'کراس‌اوور', engine: '1600cc', year: '2020-2024' },
  { name: 'MVM X5 GLX', nameEn: 'MVM X5 GLX', category: 'کراس‌اوور', engine: '1600cc', year: '2020-2024' },
  { name: 'MVM X5 SE', nameEn: 'MVM X5 SE', category: 'کراس‌اوور', engine: '1600cc', year: '2021-2024' },
  { name: 'MVM X5 LE', nameEn: 'MVM X5 LE', category: 'کراس‌اوور', engine: '1600cc', year: '2021-2024' },
  { name: 'MVM X5 EX', nameEn: 'MVM X5 EX', category: 'کراس‌اوور', engine: '1600cc', year: '2020-2024' },
  { name: 'MVM X5 LX', nameEn: 'MVM X5 LX', category: 'کراس‌اوور', engine: '1600cc', year: '2020-2024' },
  { name: 'MVM X5 TX', nameEn: 'MVM X5 TX', category: 'کراس‌اوور', engine: '1600cc', year: '2021-2024' },
  { name: 'MVM X5 VX', nameEn: 'MVM X5 VX', category: 'کراس‌اوور', engine: '1600cc', year: '2021-2024' },
  { name: 'MVM X5 GTI', nameEn: 'MVM X5 GTI', category: 'کراس‌اوور', engine: '1600cc Turbo', year: '2022-2024' },
  
  // Plus Variants
  { name: 'MVM X5 GTR Plus', nameEn: 'MVM X5 GTR Plus', category: 'کراس‌اوور', engine: '1600cc Turbo', year: '2022-2024' },
  { name: 'MVM X5 ELX Plus', nameEn: 'MVM X5 ELX Plus', category: 'کراس‌اوور', engine: '1600cc', year: '2021-2024' },
  { name: 'MVM X5 SLX Plus', nameEn: 'MVM X5 SLX Plus', category: 'کراس‌اوور', engine: '1600cc', year: '2021-2024' },
  { name: 'MVM X5 GLX Plus', nameEn: 'MVM X5 GLX Plus', category: 'کراس‌اوور', engine: '1600cc', year: '2021-2024' },
  { name: 'MVM X5 SE Plus', nameEn: 'MVM X5 SE Plus', category: 'کراس‌اوور', engine: '1600cc', year: '2022-2024' },
  { name: 'MVM X5 LE Plus', nameEn: 'MVM X5 LE Plus', category: 'کراس‌اوور', engine: '1600cc', year: '2022-2024' },
  { name: 'MVM X5 EX Plus', nameEn: 'MVM X5 EX Plus', category: 'کراس‌اوور', engine: '1600cc', year: '2021-2024' },
  { name: 'MVM X5 LX Plus', nameEn: 'MVM X5 LX Plus', category: 'کراس‌اوور', engine: '1600cc', year: '2021-2024' },
  { name: 'MVM X5 TX Plus', nameEn: 'MVM X5 TX Plus', category: 'کراس‌اوور', engine: '1600cc', year: '2022-2024' }
];

const addMvmModels = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/karno');
    console.log('Connected to MongoDB');
    
    // Find MVM manufacturer
    const mvmManufacturer = await Manufacturer.findOne({ slug: 'mvm' });
    if (!mvmManufacturer) {
      console.error('MVM manufacturer not found. Please run add-iranian-manufacturers.js first.');
      return;
    }
    
    console.log(`Found MVM manufacturer: ${mvmManufacturer.name}`);
    
    let added = 0;
    let skipped = 0;
    
    for (const modelData of mvmModels) {
      const slug = createSlug(modelData.nameEn || modelData.name, 'mvm');
      
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
        manufacturer: mvmManufacturer._id,
        year: modelData.year,
        engine: modelData.engine,
        category: modelData.category,
        description: `${modelData.name} - مدل تولیدی مدیران‌خودرو با همکاری چری`,
        specifications: {
          engineSize: modelData.engine,
          fuelType: modelData.engine.includes('Turbo') ? 'بنزین توربو' : 'بنزین'
        },
        popular: ['X22', 'X33', 'X5', '315', '530'].some(popular => modelData.name.includes(popular)),
        isActive: true
      });
      
      await vehicleModel.save();
      console.log(`✅ Added ${vehicleModel.name}`);
      added++;
    }
    
    console.log(`\n🎉 MVM models import completed!`);
    console.log(`✅ Added: ${added} models`);
    console.log(`⏭️  Skipped: ${skipped} models (already existed)`);
    console.log(`📊 Total MVM models in database: ${added + skipped}`);
    
  } catch (error) {
    console.error('❌ Error adding MVM models:', error.message);
  } finally {
    mongoose.disconnect();
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addMvmModels();
}

export default addMvmModels; 