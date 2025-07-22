import mongoose from 'mongoose';
import 'dotenv/config';
import Manufacturer from './src/models/Manufacturer.js';
import VehicleModel from './src/models/VehicleModel.js';

console.log('🚗 Adding Iran Khodro Models');
console.log('============================');

// Helper function to create slug
const createSlug = (text, manufacturer = '') => {
  const cleanText = text
    .replace(/[()]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
  
  return manufacturer ? `${manufacturer}-${cleanText}` : cleanText;
};

// All Iran Khodro models you specified
const iranKhodroModels = [
  // Peugeot Base Models
  { name: 'پژو 206', nameEn: 'Peugeot 206', category: 'هاچبک', engine: '1400cc', year: '2006-2016' },
  { name: 'پژو 207i', nameEn: 'Peugeot 207i', category: 'هاچبک', engine: '1400cc', year: '2008-2018' },
  { name: 'پژو 405', nameEn: 'Peugeot 405', category: 'سدان', engine: '1600cc', year: '1993-2010' },
  { name: 'پژو پارس', nameEn: 'Peugeot Pars', category: 'سدان', engine: '1600cc', year: '2000-2017' },

  // Iranian Models
  { name: 'رانا', nameEn: 'Rana', category: 'هاچبک', engine: '1700cc', year: '2009-2020' },
  { name: 'رانا پلاس', nameEn: 'Rana Plus', category: 'هاچبک', engine: '1700cc', year: '2015-2020' },
  { name: 'سمند', nameEn: 'Samand', category: 'سدان', engine: '1800cc', year: '2002-2017' },
  { name: 'سمند LX', nameEn: 'Samand LX', category: 'سدان', engine: '1800cc', year: '2005-2017' },
  { name: 'سمند سورن', nameEn: 'Samand Soren', category: 'سدان', engine: '1800cc', year: '2007-2017' },
  { name: 'سمند سورن ELX', nameEn: 'Samand Soren ELX', category: 'سدان', engine: '1800cc', year: '2010-2017' },
  
  // Modern Models
  { name: 'دنا', nameEn: 'Dena', category: 'سدان', engine: '1500cc', year: '2014-2024' },
  { name: 'دنا پلاس', nameEn: 'Dena Plus', category: 'سدان', engine: '1500cc', year: '2016-2024' },
  { name: 'دنا پلاس توربو', nameEn: 'Dena Plus Turbo', category: 'سدان', engine: '1500cc Turbo', year: '2019-2024' },
  { name: 'تارا', nameEn: 'Tara', category: 'سدان', engine: '1500cc', year: '2018-2024' },
  { name: 'تارا اتوماتیک', nameEn: 'Tara Automatic', category: 'سدان', engine: '1500cc', year: '2019-2024' },
  { name: 'آریسان', nameEn: 'Arisan', category: 'کراس‌اوور', engine: '1500cc', year: '2021-2024' },
  { name: 'آریسان 2', nameEn: 'Arisan 2', category: 'کراس‌اوور', engine: '1500cc', year: '2023-2024' },

  // Classic Models
  { name: 'پیکان', nameEn: 'Paykan', category: 'سدان', engine: '1600cc', year: '1967-2005' },
  { name: 'پیکان وانت', nameEn: 'Paykan Pickup', category: 'وانت', engine: '1600cc', year: '1970-2005' },

  // Assembly Models (مونتاژ)
  { name: 'پژو 2008 (مونتاژ)', nameEn: 'Peugeot 2008 Assembly', category: 'کراس‌اوور', engine: '1600cc', year: '2014-2018' },
  { name: 'پژو 301 (مونتاژ)', nameEn: 'Peugeot 301 Assembly', category: 'سدان', engine: '1600cc', year: '2013-2016' },
  { name: 'پژو 508 (مونتاژ)', nameEn: 'Peugeot 508 Assembly', category: 'سدان', engine: '2000cc', year: '2012-2015' },
  { name: 'پژو 607 (مونتاژ)', nameEn: 'Peugeot 607 Assembly', category: 'سدان', engine: '2200cc', year: '2002-2008' },
  { name: 'پژو 807 (مونتاژ)', nameEn: 'Peugeot 807 Assembly', category: 'شاسی‌بلند', engine: '2200cc', year: '2003-2008' },
  { name: 'پژو 1007 (مونتاژ)', nameEn: 'Peugeot 1007 Assembly', category: 'هاچبک', engine: '1400cc', year: '2005-2009' },

  // Peugeot 207 Variants
  { name: 'پژو 207 SD', nameEn: 'Peugeot 207 SD', category: 'سدان', engine: '1400cc', year: '2009-2018' },
  { name: 'پژو 207 اتوماتیک', nameEn: 'Peugeot 207 Automatic', category: 'هاچبک', engine: '1400cc', year: '2010-2018' },
  { name: 'پژو 207 پانوراما', nameEn: 'Peugeot 207 Panorama', category: 'هاچبک', engine: '1400cc', year: '2011-2018' },

  // Peugeot 207i Variants
  { name: 'پژو 207i پانوراما', nameEn: 'Peugeot 207i Panorama', category: 'هاچبک', engine: '1400cc', year: '2012-2018' },
  { name: 'پژو 207i اتوماتیک', nameEn: 'Peugeot 207i Automatic', category: 'هاچبک', engine: '1400cc', year: '2013-2018' },
  { name: 'پژو 207i SD', nameEn: 'Peugeot 207i SD', category: 'سدان', engine: '1400cc', year: '2009-2018' },
  { name: 'پژو 207i SD پانوراما', nameEn: 'Peugeot 207i SD Panorama', category: 'سدان', engine: '1400cc', year: '2012-2018' },
  { name: 'پژو 207i SD اتوماتیک', nameEn: 'Peugeot 207i SD Automatic', category: 'سدان', engine: '1400cc', year: '2013-2018' },

  // Premium 207i SD Variants
  { name: 'پژو 207i SD اتوماتیک پانوراما', nameEn: 'Peugeot 207i SD Automatic Panorama', category: 'سدان', engine: '1400cc', year: '2014-2018' },
  { name: 'پژو 207i SD اتوماتیک پانوراما ELX', nameEn: 'Peugeot 207i SD Automatic Panorama ELX', category: 'سدان', engine: '1400cc', year: '2015-2018' },
  { name: 'پژو 207i SD اتوماتیک پانوراما GLX', nameEn: 'Peugeot 207i SD Automatic Panorama GLX', category: 'سدان', engine: '1400cc', year: '2015-2018' },
  { name: 'پژو 207i SD اتوماتیک پانوراما SLX', nameEn: 'Peugeot 207i SD Automatic Panorama SLX', category: 'سدان', engine: '1400cc', year: '2016-2018' },
  { name: 'پژو 207i SD اتوماتیک پانوراما ELX Plus', nameEn: 'Peugeot 207i SD Automatic Panorama ELX Plus', category: 'سدان', engine: '1400cc', year: '2016-2018' },
  { name: 'پژو 207i SD اتوماتیک پانوراما GTI', nameEn: 'Peugeot 207i SD Automatic Panorama GTI', category: 'سدان', engine: '1400cc', year: '2017-2018' },
  { name: 'پژو 207i SD اتوماتیک پانوراما GTR', nameEn: 'Peugeot 207i SD Automatic Panorama GTR', category: 'سدان', engine: '1400cc', year: '2017-2018' }
];

const addIranKhodroModels = async () => {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/karno');
    console.log('✅ Connected successfully');
    
    // Find Iran Khodro manufacturer
    const iranKhodroManufacturer = await Manufacturer.findOne({ slug: 'iran-khodro' });
    if (!iranKhodroManufacturer) {
      console.error('❌ Iran Khodro manufacturer not found!');
      return;
    }
    
    console.log(`✅ Found Iran Khodro: ${iranKhodroManufacturer.name}`);
    console.log(`📦 Processing ${iranKhodroModels.length} Iran Khodro models...\n`);
    
    let added = 0;
    let skipped = 0;
    let errors = 0;
    
    for (let i = 0; i < iranKhodroModels.length; i++) {
      const modelData = iranKhodroModels[i];
      console.log(`[${i+1}/${iranKhodroModels.length}] Processing: ${modelData.name}`);
      
      try {
        const slug = createSlug(modelData.nameEn || modelData.name, 'iran-khodro');
        
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
          manufacturer: iranKhodroManufacturer._id,
          year: modelData.year,
          engine: modelData.engine,
          category: modelData.category,
          description: `${modelData.name} - مدل تولیدی ایران‌خودرو`,
          specifications: {
            engineSize: modelData.engine,
            fuelType: modelData.engine.includes('CNG') ? 'دوگانه سوز' : 
                     modelData.engine.includes('Diesel') ? 'دیزل' : 'بنزین'
          },
          popular: ['پژو', 'سمند', 'دنا', 'پارس', 'رانا'].some(popular => modelData.name.includes(popular)),
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
    const finalCount = await VehicleModel.countDocuments({ manufacturer: iranKhodroManufacturer._id });
    console.log(`📊 Total Iran Khodro models in database: ${finalCount}`);
    
  } catch (error) {
    console.error('❌ Script error:', error.message);
  } finally {
    mongoose.disconnect();
  }
};

addIranKhodroModels(); 