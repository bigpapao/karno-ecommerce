import mongoose from 'mongoose';
import 'dotenv/config';
import Manufacturer from './src/models/Manufacturer.js';
import VehicleModel from './src/models/VehicleModel.js';

console.log('🚗 Adding Bahman Motor Models');
console.log('==============================');

// Helper function to create slug
const createSlug = (text, manufacturer = '') => {
  const cleanText = text
    .replace(/[()]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
  
  return manufacturer ? `${manufacturer}-${cleanText}` : cleanText;
};

// All Bahman Motor models including the series you specified
const bahmanMotorModels = [
  // Fidelity Series
  { name: 'بهمن فیدلیتی', nameEn: 'Bahman Fidelity', category: 'سدان', engine: '1600cc', year: '2018-2024' },
  { name: 'بهمن فیدلیتی پلاس', nameEn: 'Bahman Fidelity Plus', category: 'سدان', engine: '1600cc', year: '2019-2024' },
  { name: 'بهمن فیدلیتی اتوماتیک', nameEn: 'Bahman Fidelity Automatic', category: 'سدان', engine: '1600cc', year: '2020-2024' },
  { name: 'بهمن فیدلیتی GT', nameEn: 'Bahman Fidelity GT', category: 'سدان', engine: '1600cc Turbo', year: '2021-2024' },

  // Dignity Series
  { name: 'بهمن دیگنیتی', nameEn: 'Bahman Dignity', category: 'سدان', engine: '1800cc', year: '2017-2024' },
  { name: 'بهمن دیگنیتی پلاس', nameEn: 'Bahman Dignity Plus', category: 'سدان', engine: '1800cc', year: '2018-2024' },
  { name: 'بهمن دیگنیتی اتوماتیک', nameEn: 'Bahman Dignity Automatic', category: 'سدان', engine: '1800cc', year: '2019-2024' },
  { name: 'بهمن دیگنیتی ELX', nameEn: 'Bahman Dignity ELX', category: 'سدان', engine: '1800cc', year: '2020-2024' },

  // Respect Series
  { name: 'بهمن ریسپکت', nameEn: 'Bahman Respect', category: 'شاسی‌بلند', engine: '2000cc', year: '2019-2024' },
  { name: 'بهمن ریسپکت پلاس', nameEn: 'Bahman Respect Plus', category: 'شاسی‌بلند', engine: '2000cc', year: '2020-2024' },
  { name: 'بهمن ریسپکت اتوماتیک', nameEn: 'Bahman Respect Automatic', category: 'شاسی‌بلند', engine: '2000cc', year: '2020-2024' },
  { name: 'بهمن ریسپکت 4WD', nameEn: 'Bahman Respect 4WD', category: 'شاسی‌بلند', engine: '2000cc', year: '2021-2024' },

  // Capra Series  
  { name: 'بهمن کاپرا', nameEn: 'Bahman Capra', category: 'کراس‌اوور', engine: '1600cc', year: '2020-2024' },
  { name: 'بهمن کاپرا S', nameEn: 'Bahman Capra S', category: 'کراس‌اوور', engine: '1600cc', year: '2021-2024' },
  { name: 'بهمن کاپرا اتوماتیک', nameEn: 'Bahman Capra Automatic', category: 'کراس‌اوور', engine: '1600cc', year: '2021-2024' },
  { name: 'بهمن کاپرا GT', nameEn: 'Bahman Capra GT', category: 'کراس‌اوور', engine: '1600cc Turbo', year: '2022-2024' },

  // Kara Series
  { name: 'بهمن کارا', nameEn: 'Bahman Kara', category: 'هاچبک', engine: '1400cc', year: '2018-2024' },
  { name: 'بهمن کارا پلاس', nameEn: 'Bahman Kara Plus', category: 'هاچبک', engine: '1400cc', year: '2019-2024' },
  { name: 'بهمن کارا اتوماتیک', nameEn: 'Bahman Kara Automatic', category: 'هاچبک', engine: '1400cc', year: '2020-2024' },
  { name: 'بهمن کارا کراس', nameEn: 'Bahman Kara Cross', category: 'کراس‌اوور', engine: '1400cc', year: '2021-2024' },

  // Commercial Vehicles
  { name: 'بهمن وانت', nameEn: 'Bahman Pickup', category: 'وانت', engine: '1600cc', year: '2015-2024' },
  { name: 'بهمن وانت دیزل', nameEn: 'Bahman Pickup Diesel', category: 'وانت', engine: '2500cc Diesel', year: '2016-2024' },
  { name: 'بهمن وانت دوگانه سوز', nameEn: 'Bahman Pickup Dual Fuel', category: 'وانت', engine: '1600cc CNG', year: '2017-2024' },

  // Mazda Joint Venture Models
  { name: 'مزدا 3 بهمن', nameEn: 'Mazda 3 Bahman', category: 'سدان', engine: '1600cc', year: '2012-2020' },
  { name: 'مزدا 3 بهمن هاچبک', nameEn: 'Mazda 3 Bahman Hatchback', category: 'هاچبک', engine: '1600cc', year: '2012-2020' },
  { name: 'مزدا 6 بهمن', nameEn: 'Mazda 6 Bahman', category: 'سدان', engine: '2000cc', year: '2010-2018' },

  // Classic Bahman Models
  { name: 'بهمن کلاسیک', nameEn: 'Bahman Classic', category: 'سدان', engine: '1800cc', year: '2005-2015' },
  { name: 'بهمن اسپورت', nameEn: 'Bahman Sport', category: 'کوپه', engine: '2000cc', year: '2008-2016' },

  // New Generation Models
  { name: 'بهمن نیو جنریشن', nameEn: 'Bahman New Generation', category: 'سدان', engine: '1500cc Turbo', year: '2022-2024' },
  { name: 'بهمن الکتریک', nameEn: 'Bahman Electric', category: 'سدان', engine: 'Electric', year: '2023-2024' },
  { name: 'بهمن هیبرید', nameEn: 'Bahman Hybrid', category: 'کراس‌اوور', engine: '1600cc Hybrid', year: '2023-2024' }
];

const addBahmanMotorModels = async () => {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/karno');
    console.log('✅ Connected successfully');
    
    // Find Bahman Motor manufacturer
    const bahmanManufacturer = await Manufacturer.findOne({ slug: 'bahman-motor' });
    if (!bahmanManufacturer) {
      console.error('❌ Bahman Motor manufacturer not found!');
      return;
    }
    
    console.log(`✅ Found Bahman Motor: ${bahmanManufacturer.name}`);
    console.log(`📦 Processing ${bahmanMotorModels.length} Bahman Motor models...\n`);
    
    let added = 0;
    let skipped = 0;
    let errors = 0;
    
    for (let i = 0; i < bahmanMotorModels.length; i++) {
      const modelData = bahmanMotorModels[i];
      console.log(`[${i+1}/${bahmanMotorModels.length}] Processing: ${modelData.name}`);
      
      try {
        const slug = createSlug(modelData.nameEn || modelData.name, 'bahman');
        
        // Check if already exists
        const existingModel = await VehicleModel.findOne({ slug });
        if (existingModel) {
          console.log(`   ⏭️  Already exists`);
          skipped++;
          continue;
        }
        
        // Create new model
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
            fuelType: modelData.engine.includes('Electric') ? 'برقی' :
                     modelData.engine.includes('Hybrid') ? 'هیبرید' :
                     modelData.engine.includes('Diesel') ? 'دیزل' :
                     modelData.engine.includes('CNG') ? 'دوگانه سوز' : 'بنزین'
          },
          popular: ['فیدلیتی', 'دیگنیتی', 'ریسپکت', 'کاپرا', 'کارا'].some(popular => modelData.name.includes(popular)),
          isActive: true
        });
        
        await vehicleModel.save();
        console.log(`   ✅ Added successfully`);
        added++;
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        errors++;
      }
    }
    
    console.log(`\n🎉 Import completed!`);
    console.log(`✅ Added: ${added} models`);
    console.log(`⏭️  Skipped: ${skipped} models (already existed)`);
    console.log(`❌ Errors: ${errors} models`);
    console.log(`📊 Total processed: ${added + skipped + errors} models`);
    
    // Verify final count
    const finalCount = await VehicleModel.countDocuments({ manufacturer: bahmanManufacturer._id });
    console.log(`📊 Total Bahman Motor models in database: ${finalCount}`);
    
  } catch (error) {
    console.error('❌ Script error:', error.message);
  } finally {
    mongoose.disconnect();
  }
};

addBahmanMotorModels(); 