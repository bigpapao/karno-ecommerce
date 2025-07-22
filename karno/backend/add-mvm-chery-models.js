import mongoose from 'mongoose';
import 'dotenv/config';
import Manufacturer from './src/models/Manufacturer.js';
import VehicleModel from './src/models/VehicleModel.js';

console.log('🚗 Adding MVM (Chery) Models');
console.log('============================');

// Helper function to create slug
const createSlug = (text, manufacturer = '') => {
  const cleanText = text
    .replace(/[()]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
  
  return manufacturer ? `${manufacturer}-${cleanText}` : cleanText;
};

// All MVM/Chery models available in Iran
const mvmCheryModels = [
  // X-Series Crossovers
  { name: 'ام‌وی‌ام X22', nameEn: 'MVM X22', category: 'کراس‌اوور', engine: '1500cc', year: '2010-2018' },
  { name: 'ام‌وی‌ام X33', nameEn: 'MVM X33', category: 'کراس‌اوور', engine: '1800cc', year: '2012-2020' },
  { name: 'ام‌وی‌ام X33S', nameEn: 'MVM X33S', category: 'کراس‌اوور', engine: '1800cc', year: '2015-2020' },
  { name: 'چری تیگو', nameEn: 'Chery Tiggo', category: 'کراس‌اوور', engine: '1600cc', year: '2008-2016' },
  { name: 'چری تیگو 2', nameEn: 'Chery Tiggo 2', category: 'کراس‌اوور', engine: '1500cc', year: '2018-2024' },
  { name: 'چری تیگو 3', nameEn: 'Chery Tiggo 3', category: 'کراس‌اوور', engine: '1600cc', year: '2016-2024' },
  { name: 'چری تیگو 5', nameEn: 'Chery Tiggo 5', category: 'کراس‌اوور', engine: '2000cc', year: '2014-2024' },
  { name: 'چری تیگو 7', nameEn: 'Chery Tiggo 7', category: 'کراس‌اوور', engine: '1500cc Turbo', year: '2019-2024' },
  { name: 'چری تیگو 8', nameEn: 'Chery Tiggo 8', category: 'شاسی‌بلند', engine: '1600cc Turbo', year: '2020-2024' },

  // 315 Series
  { name: 'ام‌وی‌ام 315', nameEn: 'MVM 315', category: 'هاچبک', engine: '1500cc', year: '2008-2016' },
  { name: 'ام‌وی‌ام 315 سدان', nameEn: 'MVM 315 Sedan', category: 'سدان', engine: '1500cc', year: '2009-2016' },
  { name: 'چری A1', nameEn: 'Chery A1', category: 'هاچبک', engine: '1100cc', year: '2007-2014' },
  { name: 'چری A3', nameEn: 'Chery A3', category: 'سدان', engine: '1600cc', year: '2009-2018' },
  { name: 'چری A5', nameEn: 'Chery A5', category: 'سدان', engine: '1500cc', year: '2006-2014' },

  // 530 Series  
  { name: 'ام‌وی‌ام 530', nameEn: 'MVM 530', category: 'سدان', engine: '1800cc', year: '2010-2020' },
  { name: 'ام‌وی‌ام 530 اتوماتیک', nameEn: 'MVM 530 Automatic', category: 'سدان', engine: '1800cc', year: '2012-2020' },
  { name: 'چری G5', nameEn: 'Chery G5', category: 'سدان', engine: '1500cc', year: '2012-2018' },
  { name: 'چری G6', nameEn: 'Chery G6', category: 'سدان', engine: '2000cc', year: '2013-2019' },

  // 550 Series
  { name: 'ام‌وی‌ام 550', nameEn: 'MVM 550', category: 'سدان', engine: '1800cc', year: '2011-2021' },
  { name: 'ام‌وی‌ام 550 اتوماتیک', nameEn: 'MVM 550 Automatic', category: 'سدان', engine: '1800cc', year: '2013-2021' },
  { name: 'ام‌وی‌ام 550 پلاس', nameEn: 'MVM 550 Plus', category: 'سدان', engine: '1800cc', year: '2016-2021' },
  { name: 'چری آریزو 5', nameEn: 'Chery Arrizo 5', category: 'سدان', engine: '1500cc', year: '2016-2024' },
  { name: 'چری آریزو 6', nameEn: 'Chery Arrizo 6', category: 'سدان', engine: '1500cc Turbo', year: '2018-2024' },

  // Commercial and Pickup
  { name: 'ام‌وی‌ام وانت', nameEn: 'MVM Pickup', category: 'وانت', engine: '1500cc', year: '2012-2020' },
  { name: 'چری V5', nameEn: 'Chery V5', category: 'شاسی‌بلند', engine: '2000cc', year: '2011-2017' },

  // Newer Models
  { name: 'چری تیگو 4 پرو', nameEn: 'Chery Tiggo 4 Pro', category: 'کراس‌اوور', engine: '1500cc Turbo', year: '2021-2024' },
  { name: 'چری تیگو 7 پرو', nameEn: 'Chery Tiggo 7 Pro', category: 'کراس‌اوور', engine: '1500cc Turbo', year: '2020-2024' },
  { name: 'چری آریزو 6 پرو', nameEn: 'Chery Arrizo 6 Pro', category: 'سدان', engine: '1500cc Turbo', year: '2020-2024' },

  // Electric/Hybrid Models
  { name: 'چری eQ1', nameEn: 'Chery eQ1', category: 'هاچبک', engine: 'Electric', year: '2022-2024' },
  { name: 'چری تیگو 8 پرو هیبرید', nameEn: 'Chery Tiggo 8 Pro Hybrid', category: 'شاسی‌بلند', engine: '1500cc Hybrid', year: '2023-2024' },

  // Luxury Models
  { name: 'چری اکسید TXL', nameEn: 'Chery Exeed TXL', category: 'شاسی‌بلند', engine: '1600cc Turbo', year: '2019-2024' },
  { name: 'چری اکسید TX', nameEn: 'Chery Exeed TX', category: 'کراس‌اوور', engine: '1600cc Turbo', year: '2018-2024' }
];

const addMvmCheryModels = async () => {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/karno');
    console.log('✅ Connected successfully');
    
    // Find MVM manufacturer
    const mvmManufacturer = await Manufacturer.findOne({ slug: 'mvm' });
    if (!mvmManufacturer) {
      console.error('❌ MVM manufacturer not found!');
      return;
    }
    
    console.log(`✅ Found MVM: ${mvmManufacturer.name}`);
    console.log(`📦 Processing ${mvmCheryModels.length} MVM/Chery models...\n`);
    
    let added = 0;
    let skipped = 0;
    let errors = 0;
    
    for (let i = 0; i < mvmCheryModels.length; i++) {
      const modelData = mvmCheryModels[i];
      console.log(`[${i+1}/${mvmCheryModels.length}] Processing: ${modelData.name}`);
      
      try {
        const slug = createSlug(modelData.nameEn || modelData.name, 'mvm');
        
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
          manufacturer: mvmManufacturer._id,
          year: modelData.year,
          engine: modelData.engine,
          category: modelData.category,
          description: `${modelData.name} - مدل تولیدی مدیران‌خودرو (چری)`,
          specifications: {
            engineSize: modelData.engine,
            fuelType: modelData.engine.includes('Electric') ? 'برقی' :
                     modelData.engine.includes('Hybrid') ? 'هیبرید' :
                     modelData.engine.includes('CNG') ? 'دوگانه سوز' : 'بنزین'
          },
          popular: ['تیگو', 'X33', '530', '550'].some(popular => modelData.name.includes(popular)),
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
    const finalCount = await VehicleModel.countDocuments({ manufacturer: mvmManufacturer._id });
    console.log(`📊 Total MVM models in database: ${finalCount}`);
    
  } catch (error) {
    console.error('❌ Script error:', error.message);
  } finally {
    mongoose.disconnect();
  }
};

addMvmCheryModels(); 