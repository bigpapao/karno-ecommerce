import mongoose from 'mongoose';
import 'dotenv/config';
import Manufacturer from './src/models/Manufacturer.js';
import VehicleModel from './src/models/VehicleModel.js';

const createSlug = (text, manufacturer = '') => {
  const cleanText = text
    .replace(/[()]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
  
  return manufacturer ? `${manufacturer}-${cleanText}` : cleanText;
};

const fixSaipaSluts = async () => {
  try {
    console.log('🔧 Fixing SAIPA model slugs and re-importing...\n');
    
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/karno');
    console.log('🔗 Connected to MongoDB');
    
    const saipa = await Manufacturer.findOne({ slug: 'saipa' });
    if (!saipa) {
      console.error('❌ SAIPA manufacturer not found');
      return;
    }
    
    // Delete all existing SAIPA models to start fresh
    console.log('🗑️  Removing all existing SAIPA models...');
    const deleteResult = await VehicleModel.deleteMany({ manufacturer: saipa._id });
    console.log(`✅ Deleted ${deleteResult.deletedCount} existing SAIPA models\n`);
    
    // Now add all SAIPA models with correct slugs
    const saipaModels = [
      // Pride Series
      { name: 'پراید 111', nameEn: 'Pride 111', category: 'هاچبک', engine: '1000cc', year: '1990-2018' },
      { name: 'پراید 131', nameEn: 'Pride 131', category: 'سدان', engine: '1300cc', year: '1993-2018' },
      { name: 'پراید 132', nameEn: 'Pride 132', category: 'هاچبک', engine: '1300cc', year: '1995-2018' },
      { name: 'پراید 141', nameEn: 'Pride 141', category: 'وانت', engine: '1300cc', year: '1995-2018' },
      { name: 'پراید 151', nameEn: 'Pride 151 Pickup', category: 'وانت', engine: '1500cc', year: '1998-2018' },
      
      // SAIPA Classic Models
      { name: 'سایپا نسیم', nameEn: 'SAIPA Nasim', category: 'سدان', engine: '1600cc', year: '1995-2010' },
      { name: 'سایپا صبا', nameEn: 'SAIPA Saba', category: 'سدان', engine: '1600cc', year: '1998-2010' },
      
      // Modern SAIPA Models
      { name: 'تیبا', nameEn: 'Tiba', category: 'هاچبک', engine: '1500cc', year: '2009-2018' },
      { name: 'تیبا 2', nameEn: 'Tiba 2', category: 'هاچبک', engine: '1500cc', year: '2014-2020' },
      { name: 'ساینا', nameEn: 'Saina', category: 'سدان', engine: '1500cc', year: '2010-2020' },
      { name: 'ساینا S', nameEn: 'Saina S', category: 'سدان', engine: '1500cc', year: '2015-2020' },
      
      // Quick Series
      { name: 'کوییک', nameEn: 'Quick', category: 'هاچبک', engine: '1500cc', year: '2010-2020' },
      { name: 'کوییک R', nameEn: 'Quick R', category: 'هاچبک', engine: '1500cc', year: '2012-2020' },
      { name: 'کوییک S', nameEn: 'Quick S', category: 'هاچبک', engine: '1500cc', year: '2014-2020' },
      { name: 'کوییک اتوماتیک', nameEn: 'Quick Automatic', category: 'هاچبک', engine: '1500cc', year: '2015-2020' },
      
      // New Generation
      { name: 'شاهین', nameEn: 'Shahin', category: 'سدان', engine: '1500cc', year: '2020-2024' },
      { name: 'آریا', nameEn: 'Arya', category: 'کراس‌اوور', engine: '1500cc', year: '2021-2024' },
      { name: 'رهام', nameEn: 'Raham', category: 'سدان', engine: '1600cc', year: '2022-2024' },
      
      // Atlas Series (sample - 10 most important)
      { name: 'سایپا اطلس', nameEn: 'SAIPA Atlas', category: 'کراس‌اوور', engine: '1600cc', year: '2019-2024' },
      { name: 'سایپا اطلس پلاس', nameEn: 'SAIPA Atlas Plus', category: 'کراس‌اوور', engine: '1600cc', year: '2020-2024' },
      { name: 'سایپا اطلس GT', nameEn: 'SAIPA Atlas GT', category: 'کراس‌اوور', engine: '1600cc', year: '2021-2024' },
      { name: 'سایپا اطلس S', nameEn: 'SAIPA Atlas S', category: 'کراس‌اوور', engine: '1600cc', year: '2020-2024' },
      { name: 'سایپا اطلس ELX', nameEn: 'SAIPA Atlas ELX', category: 'کراس‌اوور', engine: '1600cc', year: '2021-2024' },
      
      // Commercial Vehicles
      { name: 'وانت نیسان زامیاد', nameEn: 'Nissan Zamyad Pickup', category: 'وانت', engine: '2400cc', year: '2005-2020' },
      { name: 'پادرا', nameEn: 'Padra', category: 'وانت', engine: '1600cc', year: '2015-2020' },
      { name: 'وانت شوکا', nameEn: 'Shoka Pickup', category: 'وانت', engine: '1600cc', year: '2018-2024' }
    ];
    
    console.log(`📋 Adding ${saipaModels.length} SAIPA models...\n`);
    
    let added = 0;
    for (const [index, modelData] of saipaModels.entries()) {
      try {
        const slug = createSlug(modelData.nameEn, 'saipa');
        
        const vehicleModel = new VehicleModel({
          name: modelData.name,
          nameEn: modelData.nameEn,
          slug: slug,
          manufacturer: saipa._id,
          year: modelData.year,
          engine: modelData.engine,
          category: modelData.category,
          description: `${modelData.name} - مدل تولیدی سایپا`,
          specifications: {
            engineSize: modelData.engine,
            fuelType: modelData.engine.includes('CNG') ? 'دوگانه سوز' : 
                     modelData.engine.includes('Diesel') ? 'دیزل' : 
                     modelData.engine.includes('Turbo') ? 'بنزین توربو' : 'بنزین'
          },
          popular: ['پراید', 'تیبا', 'ساینا', 'کوییک', 'شاهین', 'اطلس'].some(popular => modelData.name.includes(popular)),
          isActive: true
        });
        
        await vehicleModel.save();
        console.log(`${(index + 1).toString().padStart(2)}. ✅ ${vehicleModel.name}`);
        added++;
        
      } catch (error) {
        console.log(`${(index + 1).toString().padStart(2)}. ❌ Failed: ${modelData.name} - ${error.message}`);
      }
    }
    
    console.log('\n' + '═'.repeat(50));
    console.log('🎉 SAIPA MODELS FIXED AND IMPORTED! 🎉');
    console.log('═'.repeat(50));
    console.log(`✅ Successfully added: ${added} models`);
    
    // Verify final count
    const finalCount = await VehicleModel.countDocuments({ manufacturer: saipa._id });
    console.log(`🔍 Total SAIPA models in database: ${finalCount}`);
    
    if (finalCount >= 25) {
      console.log('🎯 EXCELLENT! SAIPA database is now ready!');
      console.log('✅ Ready to proceed to next manufacturer!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
    console.log('🔚 Database connection closed.');
  }
};

fixSaipaSluts(); 