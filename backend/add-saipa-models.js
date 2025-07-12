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

// SAIPA Vehicle Models (80+ models)
const saipaModels = [
  // Pride Series
  { name: 'پراید 111', nameEn: 'Pride 111', category: 'هاچبک', engine: '1000cc', year: '1990-2018' },
  { name: 'پراید 131', nameEn: 'Pride 131', category: 'سدان', engine: '1300cc', year: '1993-2018' },
  { name: 'پراید 132', nameEn: 'Pride 132', category: 'هاچبک', engine: '1300cc', year: '1995-2018' },
  { name: 'پراید 141', nameEn: 'Pride 141', category: 'وانت', engine: '1300cc', year: '1995-2018' },
  { name: 'پراید 151', nameEn: 'Pride 151', category: 'وانت', engine: '1500cc', year: '1998-2018' },
  
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
  
  // International Collaborations
  { name: 'آریو', nameEn: 'Aryo (Zotye Z300)', category: 'سدان', engine: '1500cc', year: '2018-2020' },
  { name: 'سیتروئن ژیان', nameEn: 'Citroen Xyan', category: 'سدان', engine: '1600cc', year: '2005-2010' },
  { name: 'سیتروئن زانتیا', nameEn: 'Citroen Xantia', category: 'سدان', engine: '1800cc', year: '1998-2005' },
  { name: 'رنو 5', nameEn: 'Renault 5', category: 'هاچبک', engine: '1400cc', year: '1985-1995' },
  { name: 'رنو 21', nameEn: 'Renault 21', category: 'سدان', engine: '1700cc', year: '1990-2000' },
  
  // KIA Assembly
  { name: 'کیا پراید', nameEn: 'KIA Pride', category: 'هاچبک', engine: '1300cc', year: '1993-2005' },
  { name: 'کیا ریو', nameEn: 'KIA Rio', category: 'هاچبک', engine: '1500cc', year: '2005-2010' },
  
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
  
  // Advanced Trims
  { name: 'ساینا GX-L', nameEn: 'Saina GX-L', category: 'سدان', engine: '1500cc', year: '2018-2020' },
  { name: 'ساینا GX-L دوگانه سوز', nameEn: 'Saina GX-L Dual Fuel', category: 'سدان', engine: '1500cc CNG', year: '2018-2020' },
  { name: 'ساینا اتوماتیک S', nameEn: 'Saina Automatic S', category: 'سدان', engine: '1500cc', year: '2019-2020' },
  { name: 'کوییک GX-L', nameEn: 'Quick GX-L', category: 'هاچبک', engine: '1500cc', year: '2018-2020' },
  { name: 'کوییک R تیپ GX-L', nameEn: 'Quick R GX-L', category: 'هاچبک', engine: '1500cc', year: '2018-2020' },
  { name: 'کوییک اتوماتیک با سیستم کنترل کشش ESC', nameEn: 'Quick Automatic ESC', category: 'هاچبک', engine: '1500cc', year: '2019-2020' },
  
  // Shahin Variants
  { name: 'شاهین G', nameEn: 'Shahin G', category: 'سدان', engine: '1500cc', year: '2020-2024' },
  { name: 'شاهین GL', nameEn: 'Shahin GL', category: 'سدان', engine: '1500cc', year: '2020-2024' },
  { name: 'شاهین CVT اتوماتیک', nameEn: 'Shahin CVT Automatic', category: 'سدان', engine: '1500cc', year: '2021-2024' },
  { name: 'شاهین پلاس اتوماتیک', nameEn: 'Shahin Plus Automatic', category: 'سدان', engine: '1500cc', year: '2022-2024' },
  { name: 'آریا اتوماتیک', nameEn: 'Arya Automatic', category: 'کراس‌اوور', engine: '1500cc', year: '2022-2024' },
  
  // Special Models
  { name: 'پارس نوآ دستی', nameEn: 'Pars Nova Manual', category: 'سدان', engine: '1600cc', year: '2015-2020' },
  
  // Changan Models
  { name: 'چانگان CS35', nameEn: 'Changan CS35', category: 'کراس‌اوور', engine: '1600cc', year: '2018-2022' },
  { name: 'چانگان CS35 پلاس', nameEn: 'Changan CS35 Plus', category: 'کراس‌اوور', engine: '1600cc', year: '2020-2024' },
  { name: 'چانگان CS55 پلاس', nameEn: 'Changan CS55 Plus', category: 'کراس‌اوور', engine: '1500cc Turbo', year: '2021-2024' },
  { name: 'چانگان Uni-T', nameEn: 'Changan Uni-T', category: 'کراس‌اوور', engine: '1500cc Turbo', year: '2022-2024' },
  { name: 'چانگان Uni-K', nameEn: 'Changan Uni-K', category: 'شاسی‌بلند', engine: '2000cc Turbo', year: '2023-2024' },
  { name: 'چانگان CS15', nameEn: 'Changan CS15', category: 'کراس‌اوور', engine: '1500cc', year: '2019-2022' },
  
  // Citroen Models
  { name: 'سیتروئن C3', nameEn: 'Citroen C3', category: 'هاچبک', engine: '1600cc', year: '2010-2015' },
  { name: 'سیتروئن C5', nameEn: 'Citroen C5', category: 'سدان', engine: '2000cc', year: '2008-2012' },
  
  // KIA Advanced Models
  { name: 'کیا سراتو 1600 مونتاژ', nameEn: 'KIA Cerato 1600 Assembly', category: 'سدان', engine: '1600cc', year: '2010-2014' },
  { name: 'کیا سراتو 1600 آپشنال', nameEn: 'KIA Cerato 1600 Optional', category: 'سدان', engine: '1600cc', year: '2012-2016' },
  { name: 'کیا سراتو 2000', nameEn: 'KIA Cerato 2000', category: 'سدان', engine: '2000cc', year: '2013-2017' },
  { name: 'کیا سراتو 2000 آپشنال', nameEn: 'KIA Cerato 2000 Optional', category: 'سدان', engine: '2000cc', year: '2014-2018' },
  { name: 'کیا سراتو 1600 فیس قدیم', nameEn: 'KIA Cerato 1600 Old Face', category: 'سدان', engine: '1600cc', year: '2009-2013' },
  { name: 'کیا سراتو YD 2.0', nameEn: 'KIA Cerato YD 2.0', category: 'سدان', engine: '2000cc', year: '2013-2017' },
  { name: 'کیا سراتو 2000 نیوفیس', nameEn: 'KIA Cerato 2000 New Face', category: 'سدان', engine: '2000cc', year: '2016-2020' },
  { name: 'کیا سراتو 2023', nameEn: 'KIA Cerato 2023', category: 'سدان', engine: '2000cc', year: '2023-2024' },
  
  // Commercial Vehicles
  { name: 'وانت نیسان زامیاد بنزینی', nameEn: 'Nissan Zamyad Pickup Gasoline', category: 'وانت', engine: '2400cc', year: '2005-2020' },
  { name: 'وانت نیسان زامیاد دیزلی', nameEn: 'Nissan Zamyad Pickup Diesel', category: 'وانت', engine: '2500cc Diesel', year: '2008-2020' },
  { name: 'وانت نیسان زامیاد دوگانه سوز', nameEn: 'Nissan Zamyad Pickup Dual Fuel', category: 'وانت', engine: '2400cc CNG', year: '2010-2020' },
  { name: 'پادرا', nameEn: 'Padra', category: 'وانت', engine: '1600cc', year: '2015-2020' },
  { name: 'پادرا پلاس', nameEn: 'Padra Plus', category: 'وانت', engine: '1600cc', year: '2018-2022' },
  { name: 'وانت شوکا بنزینی', nameEn: 'Shoka Pickup Gasoline', category: 'وانت', engine: '1600cc', year: '2018-2024' },
  { name: 'وانت شوکا دوگانه سوز', nameEn: 'Shoka Pickup Dual Fuel', category: 'وانت', engine: '1600cc CNG', year: '2019-2024' },
  
  // Recent Models
  { name: 'کارون', nameEn: 'Karoon', category: 'کراس‌اوور', engine: '1600cc', year: '2021-2024' },
  { name: 'سهند S', nameEn: 'Sahand S', category: 'سدان', engine: '1500cc', year: '2022-2024' },
  { name: 'سایپا SP0 هاچبک', nameEn: 'SAIPA SP0 Hatchback', category: 'هاچبک', engine: '1000cc', year: '2023-2024' },
  { name: 'کادیلا', nameEn: 'Cadila', category: 'سدان', engine: '1500cc', year: '2023-2024' },
  { name: 'زامیاد زاگرس', nameEn: 'Zamyad Zagros', category: 'وانت', engine: '1600cc', year: '2022-2024' }
];

const addSaipaModels = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/karno');
    console.log('Connected to MongoDB');
    
    // Find SAIPA manufacturer
    const saipaManufacturer = await Manufacturer.findOne({ slug: 'saipa' });
    if (!saipaManufacturer) {
      console.error('SAIPA manufacturer not found. Please run add-iranian-manufacturers.js first.');
      return;
    }
    
    console.log(`Found SAIPA manufacturer: ${saipaManufacturer.name}`);
    
    let added = 0;
    let skipped = 0;
    
    for (const modelData of saipaModels) {
      const slug = createSlug(modelData.nameEn || modelData.name, 'saipa');
      
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
          fuelType: modelData.engine.includes('CNG') ? 'دوگانه سوز' : 
                   modelData.engine.includes('Diesel') ? 'دیزل' : 'بنزین'
        },
        popular: ['پراید', 'تیبا', 'ساینا', 'کوییک', 'شاهین'].some(popular => modelData.name.includes(popular)),
        isActive: true
      });
      
      await vehicleModel.save();
      console.log(`✅ Added ${vehicleModel.name}`);
      added++;
    }
    
    console.log(`\n🎉 SAIPA models import completed!`);
    console.log(`✅ Added: ${added} models`);
    console.log(`⏭️  Skipped: ${skipped} models (already existed)`);
    console.log(`📊 Total SAIPA models in database: ${added + skipped}`);
    
  } catch (error) {
    console.error('❌ Error adding SAIPA models:', error.message);
  } finally {
    mongoose.disconnect();
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addSaipaModels();
}

export default addSaipaModels; 