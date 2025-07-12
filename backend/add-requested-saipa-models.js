import mongoose from 'mongoose';
import 'dotenv/config';
import Manufacturer from './src/models/Manufacturer.js';
import VehicleModel from './src/models/VehicleModel.js';

console.log('🚗 Adding Requested SAIPA Models');
console.log('=================================');

// Helper function to create slug
const createSlug = (text, manufacturer = '') => {
  const cleanText = text
    .replace(/[()]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
  
  return manufacturer ? `${manufacturer}-${cleanText}` : cleanText;
};

// The exact 47 models you requested
const requestedSaipaModels = [
  // Quick Series
  { name: 'کوییک', nameEn: 'Quick', category: 'هاچبک', engine: '1500cc', year: '2010-2020' },
  { name: 'کوییک R', nameEn: 'Quick R', category: 'هاچبک', engine: '1500cc', year: '2012-2020' },
  { name: 'کوییک S', nameEn: 'Quick S', category: 'هاچبک', engine: '1500cc', year: '2014-2020' },
  { name: 'کوییک اتوماتیک', nameEn: 'Quick Automatic', category: 'هاچبک', engine: '1500cc', year: '2015-2020' },
  { name: 'کوییک GX-L', nameEn: 'Quick GX-L', category: 'هاچبک', engine: '1500cc', year: '2018-2020' },
  { name: 'کوییک R تیپ GX-L', nameEn: 'Quick R GX-L', category: 'هاچبک', engine: '1500cc', year: '2018-2020' },
  { name: 'کوییک اتوماتیک با سیستم کنترل کشش ESC', nameEn: 'Quick Automatic ESC', category: 'هاچبک', engine: '1500cc', year: '2019-2020' },
  
  // Pride Series
  { name: 'پراید 111', nameEn: 'Pride 111', category: 'هاچبک', engine: '1000cc', year: '1990-2018' },
  { name: 'پراید 131', nameEn: 'Pride 131', category: 'سدان', engine: '1300cc', year: '1993-2018' },
  { name: 'پراید 132', nameEn: 'Pride 132', category: 'هاچبک', engine: '1300cc', year: '1995-2018' },
  { name: 'پراید 141', nameEn: 'Pride 141', category: 'وانت', engine: '1300cc', year: '1995-2018' },
  { name: 'پراید 151 (وانت)', nameEn: 'Pride 151 Pickup', category: 'وانت', engine: '1500cc', year: '1998-2018' },
  
  // Classic SAIPA Models
  { name: 'سایپا نسیم', nameEn: 'SAIPA Nasim', category: 'سدان', engine: '1600cc', year: '1995-2010' },
  { name: 'سایپا صبا', nameEn: 'SAIPA Saba', category: 'سدان', engine: '1600cc', year: '1998-2010' },
  
  // Tiba Series
  { name: 'تیبا', nameEn: 'Tiba', category: 'هاچبک', engine: '1500cc', year: '2009-2018' },
  { name: 'تیبا 2', nameEn: 'Tiba 2', category: 'هاچبک', engine: '1500cc', year: '2014-2020' },
  
  // Saina Series
  { name: 'ساینا', nameEn: 'Saina', category: 'سدان', engine: '1500cc', year: '2010-2020' },
  { name: 'ساینا S', nameEn: 'Saina S', category: 'سدان', engine: '1500cc', year: '2015-2020' },
  { name: 'ساینا GX-L', nameEn: 'Saina GX-L', category: 'سدان', engine: '1500cc', year: '2018-2020' },
  { name: 'ساینا GX-L دوگانه سوز', nameEn: 'Saina GX-L Dual Fuel', category: 'سدان', engine: '1500cc CNG', year: '2018-2020' },
  { name: 'ساینا اتوماتیک S', nameEn: 'Saina Automatic S', category: 'سدان', engine: '1500cc', year: '2019-2020' },
  
  // Shahin Series
  { name: 'شاهین', nameEn: 'Shahin', category: 'سدان', engine: '1500cc', year: '2020-2024' },
  { name: 'شاهین G', nameEn: 'Shahin G', category: 'سدان', engine: '1500cc', year: '2020-2024' },
  { name: 'شاهین GL', nameEn: 'Shahin GL', category: 'سدان', engine: '1500cc', year: '2020-2024' },
  { name: 'شاهین CVT اتوماتیک', nameEn: 'Shahin CVT Automatic', category: 'سدان', engine: '1500cc', year: '2021-2024' },
  { name: 'شاهین پلاس اتوماتیک', nameEn: 'Shahin Plus Automatic', category: 'سدان', engine: '1500cc', year: '2022-2024' },
  
  // Atlas Series
  { name: 'سایپا اطلس', nameEn: 'SAIPA Atlas', category: 'کراس‌اوور', engine: '1600cc', year: '2019-2024' },
  { name: 'سایپا اطلس پلاس', nameEn: 'SAIPA Atlas Plus', category: 'کراس‌اوور', engine: '1600cc', year: '2020-2024' },
  { name: 'سایپا اطلس GT', nameEn: 'SAIPA Atlas GT', category: 'کراس‌اوور', engine: '1600cc', year: '2021-2024' },
  { name: 'سایپا اطلس S', nameEn: 'SAIPA Atlas S', category: 'کراس‌اوور', engine: '1600cc', year: '2020-2024' },
  { name: 'سایپا اطلس R', nameEn: 'SAIPA Atlas R', category: 'کراس‌اوور', engine: '1600cc', year: '2021-2024' },
  { name: 'سایپا اطلس X', nameEn: 'SAIPA Atlas X', category: 'کراس‌اوور', engine: '1600cc', year: '2021-2024' },
  { name: 'سایپا اطلس LX', nameEn: 'SAIPA Atlas LX', category: 'کراس‌اوور', engine: '1600cc', year: '2020-2024' },
  { name: 'سایپا اطلس EX', nameEn: 'SAIPA Atlas EX', category: 'کراس‌اوور', engine: '1600cc', year: '2020-2024' },
  { name: 'سایپا اطلس SE', nameEn: 'SAIPA Atlas SE', category: 'کراس‌اوور', engine: '1600cc', year: '2021-2024' },
  { name: 'سایپا اطلس LE', nameEn: 'SAIPA Atlas LE', category: 'کراس‌اوور', engine: '1600cc', year: '2021-2024' },
  { name: 'سایپا اطلس GLX', nameEn: 'SAIPA Atlas GLX', category: 'کراس‌اوور', engine: '1600cc', year: '2020-2024' },
  { name: 'سایپا اطلس SLX', nameEn: 'SAIPA Atlas SLX', category: 'کراس‌اوور', engine: '1600cc', year: '2021-2024' },
  { name: 'سایپا اطلس ELX', nameEn: 'SAIPA Atlas ELX', category: 'کراس‌اوور', engine: '1600cc', year: '2021-2024' },
  { name: 'سایپا اطلس GTI', nameEn: 'SAIPA Atlas GTI', category: 'کراس‌اوور', engine: '1600cc Turbo', year: '2022-2024' },
  { name: 'سایپا اطلس GTR', nameEn: 'SAIPA Atlas GTR', category: 'کراس‌اوور', engine: '1600cc Turbo', year: '2022-2024' },
  
  // Commercial Vehicles
  { name: 'وانت نیسان زامیاد بنزینی', nameEn: 'Nissan Zamyad Pickup Gasoline', category: 'وانت', engine: '2400cc', year: '2005-2020' },
  { name: 'وانت نیسان زامیاد دیزلی', nameEn: 'Nissan Zamyad Pickup Diesel', category: 'وانت', engine: '2500cc Diesel', year: '2008-2020' },
  { name: 'وانت نیسان زامیاد دوگانه سوز', nameEn: 'Nissan Zamyad Pickup Dual Fuel', category: 'وانت', engine: '2400cc CNG', year: '2010-2020' },
  { name: 'وانت شوکا بنزینی', nameEn: 'Shoka Pickup Gasoline', category: 'وانت', engine: '1600cc', year: '2018-2024' },
  { name: 'وانت شوکا دوگانه سوز', nameEn: 'Shoka Pickup Dual Fuel', category: 'وانت', engine: '1600cc CNG', year: '2019-2024' },
  { name: 'زامیاد زاگرس', nameEn: 'Zamyad Zagros', category: 'وانت', engine: '1600cc', year: '2022-2024' }
];

const addRequestedSaipaModels = async () => {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/karno');
    console.log('✅ Connected successfully');
    
    // Find SAIPA manufacturer
    const saipaManufacturer = await Manufacturer.findOne({ slug: 'saipa' });
    if (!saipaManufacturer) {
      console.error('❌ SAIPA manufacturer not found!');
      return;
    }
    
    console.log(`✅ Found SAIPA: ${saipaManufacturer.name}`);
    console.log(`📦 Processing ${requestedSaipaModels.length} requested models...\n`);
    
    let added = 0;
    let skipped = 0;
    let errors = 0;
    
    for (let i = 0; i < requestedSaipaModels.length; i++) {
      const modelData = requestedSaipaModels[i];
      console.log(`[${i+1}/${requestedSaipaModels.length}] Processing: ${modelData.name}`);
      
      try {
        const slug = createSlug(modelData.nameEn || modelData.name, 'saipa');
        
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
          manufacturer: saipaManufacturer._id,
          year: modelData.year,
          engine: modelData.engine,
          category: modelData.category,
          description: `${modelData.name} - مدل تولیدی سایپا`,
          specifications: {
            engineSize: modelData.engine,
            fuelType: modelData.engine.includes('CNG') ? 'دوگانه سوز' : 
                     modelData.engine.includes('Diesel') ? 'دیزل' : 'بنزین'
          },
          popular: ['پراید', 'کوییک', 'ساینا', 'شاهین'].some(popular => modelData.name.includes(popular)),
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
    const finalCount = await VehicleModel.countDocuments({ manufacturer: saipaManufacturer._id });
    console.log(`📊 Total SAIPA models in database: ${finalCount}`);
    
  } catch (error) {
    console.error('❌ Script error:', error.message);
  } finally {
    mongoose.disconnect();
  }
};

addRequestedSaipaModels(); 