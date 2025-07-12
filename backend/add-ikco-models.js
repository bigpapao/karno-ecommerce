node add-ikco-models.jsimport mongoose from 'mongoose';
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

// Iran Khodro (IKCO) Vehicle Models (40+ models)
const ikcoModels = [
  // Peugeot Series
  { name: 'پژو 206', nameEn: 'Peugeot 206', category: 'هاچبک', engine: '1600cc', year: '2003-2018' },
  { name: 'پژو 207i', nameEn: 'Peugeot 207i', category: 'هاچبک', engine: '1600cc', year: '2008-2018' },
  { name: 'پژو 405', nameEn: 'Peugeot 405', category: 'سدان', engine: '1800cc', year: '1993-2014' },
  { name: 'پژو پارس', nameEn: 'Peugeot Pars', category: 'سدان', engine: '1600cc', year: '2002-2017' },
  
  // Runna Series
  { name: 'رانا', nameEn: 'Runna', category: 'هاچبک', engine: '1700cc', year: '2005-2015' },
  { name: 'رانا پلاس', nameEn: 'Runna Plus', category: 'هاچبک', engine: '1700cc', year: '2010-2016' },
  
  // Samand Series
  { name: 'سمند', nameEn: 'Samand', category: 'سدان', engine: '1600cc', year: '2002-2018' },
  { name: 'سمند LX', nameEn: 'Samand LX', category: 'سدان', engine: '1600cc', year: '2005-2018' },
  { name: 'سمند سورن', nameEn: 'Samand Soren', category: 'شاسی‌بلند', engine: '1700cc', year: '2007-2018' },
  { name: 'سمند سورن ELX', nameEn: 'Samand Soren ELX', category: 'شاسی‌بلند', engine: '1700cc', year: '2010-2018' },
  
  // Dena Series
  { name: 'دنا', nameEn: 'Dena', category: 'سدان', engine: '1600cc', year: '2011-2020' },
  { name: 'دنا پلاس', nameEn: 'Dena Plus', category: 'سدان', engine: '1600cc', year: '2016-2022' },
  { name: 'دنا پلاس توربو', nameEn: 'Dena Plus Turbo', category: 'سدان', engine: '1600cc Turbo', year: '2019-2022' },
  
  // Tara Series
  { name: 'تارا', nameEn: 'Tara', category: 'سدان', engine: '1500cc', year: '2018-2024' },
  { name: 'تارا اتوماتیک', nameEn: 'Tara Automatic', category: 'سدان', engine: '1500cc', year: '2020-2024' },
  
  // Arisan Series
  { name: 'آریسان', nameEn: 'Arisan', category: 'کراس‌اوور', engine: '1600cc', year: '2021-2024' },
  { name: 'آریسان 2', nameEn: 'Arisan 2', category: 'کراس‌اوور', engine: '1600cc', year: '2023-2024' },
  
  // Classic Models
  { name: 'پیکان', nameEn: 'Peykan', category: 'سدان', engine: '1600cc', year: '1967-2005' },
  { name: 'پیکان وانت', nameEn: 'Peykan Pickup', category: 'وانت', engine: '1600cc', year: '1975-2010' },
  
  // International Peugeot Models
  { name: 'پژو 2008', nameEn: 'Peugeot 2008', category: 'کراس‌اوور', engine: '1600cc', year: '2014-2018' },
  { name: 'پژو 301', nameEn: 'Peugeot 301', category: 'سدان', engine: '1600cc', year: '2013-2017' },
  { name: 'پژو 508', nameEn: 'Peugeot 508', category: 'سدان', engine: '2000cc', year: '2012-2016' },
  { name: 'پژو 607', nameEn: 'Peugeot 607', category: 'سدان', engine: '2200cc', year: '2005-2010' },
  { name: 'پژو 807', nameEn: 'Peugeot 807', category: 'شاسی‌بلند', engine: '2200cc', year: '2008-2012' },
  { name: 'پژو 1007', nameEn: 'Peugeot 1007', category: 'هاچبک', engine: '1400cc', year: '2006-2009' },
  
  // Advanced Peugeot 207 Series
  { name: 'پژو 207 SD', nameEn: 'Peugeot 207 SD', category: 'سدان', engine: '1600cc', year: '2010-2016' },
  { name: 'پژو 207 اتوماتیک', nameEn: 'Peugeot 207 Automatic', category: 'هاچبک', engine: '1600cc', year: '2011-2016' },
  { name: 'پژو 207 پانوراما', nameEn: 'Peugeot 207 Panorama', category: 'هاچبک', engine: '1600cc', year: '2012-2016' },
  { name: 'پژو 207i پانوراما', nameEn: 'Peugeot 207i Panorama', category: 'هاچبک', engine: '1600cc', year: '2013-2018' },
  { name: 'پژو 207i اتوماتیک', nameEn: 'Peugeot 207i Automatic', category: 'هاچبک', engine: '1600cc', year: '2014-2018' },
  { name: 'پژو 207i SD', nameEn: 'Peugeot 207i SD', category: 'سدان', engine: '1600cc', year: '2013-2018' },
  { name: 'پژو 207i SD پانوراما', nameEn: 'Peugeot 207i SD Panorama', category: 'سدان', engine: '1600cc', year: '2014-2018' },
  { name: 'پژو 207i SD اتوماتیک', nameEn: 'Peugeot 207i SD Automatic', category: 'سدان', engine: '1600cc', year: '2015-2018' },
  { name: 'پژو 207i SD اتوماتیک پانوراما', nameEn: 'Peugeot 207i SD Automatic Panorama', category: 'سدان', engine: '1600cc', year: '2015-2018' },
  { name: 'پژو 207i SD اتوماتیک پانوراما ELX', nameEn: 'Peugeot 207i SD Automatic Panorama ELX', category: 'سدان', engine: '1600cc', year: '2016-2018' },
  { name: 'پژو 207i SD اتوماتیک پانوراما GLX', nameEn: 'Peugeot 207i SD Automatic Panorama GLX', category: 'سدان', engine: '1600cc', year: '2016-2018' },
  { name: 'پژو 207i SD اتوماتیک پانوراما SLX', nameEn: 'Peugeot 207i SD Automatic Panorama SLX', category: 'سدان', engine: '1600cc', year: '2017-2018' },
  { name: 'پژو 207i SD اتوماتیک پانوراما ELX Plus', nameEn: 'Peugeot 207i SD Automatic Panorama ELX Plus', category: 'سدان', engine: '1600cc', year: '2017-2018' },
  { name: 'پژو 207i SD اتوماتیک پانوراما GTI', nameEn: 'Peugeot 207i SD Automatic Panorama GTI', category: 'سدان', engine: '1600cc Turbo', year: '2017-2018' },
  { name: 'پژو 207i SD اتوماتیک پانوراما GTR', nameEn: 'Peugeot 207i SD Automatic Panorama GTR', category: 'سدان', engine: '1600cc Turbo', year: '2018' }
];

const addIkcoModels = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/karno');
    console.log('Connected to MongoDB');
    
    // Find Iran Khodro manufacturer
    const ikcoManufacturer = await Manufacturer.findOne({ slug: 'iran-khodro' });
    if (!ikcoManufacturer) {
      console.error('Iran Khodro manufacturer not found. Please run add-iranian-manufacturers.js first.');
      return;
    }
    
    console.log(`Found Iran Khodro manufacturer: ${ikcoManufacturer.name}`);
    
    let added = 0;
    let skipped = 0;
    
    for (const modelData of ikcoModels) {
      const slug = createSlug(modelData.nameEn || modelData.name, 'ikco');
      
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
        manufacturer: ikcoManufacturer._id,
        year: modelData.year,
        engine: modelData.engine,
        category: modelData.category,
        description: `${modelData.name} - مدل تولیدی ایران‌خودرو`,
        specifications: {
          engineSize: modelData.engine,
          fuelType: modelData.engine.includes('Turbo') ? 'بنزین توربو' : 'بنزین'
        },
        popular: ['پژو 206', 'پژو 405', 'سمند', 'دنا', 'تارا'].some(popular => modelData.name.includes(popular.split(' ')[1] || popular)),
        isActive: true
      });
      
      await vehicleModel.save();
      console.log(`✅ Added ${vehicleModel.name}`);
      added++;
    }
    
    console.log(`\n🎉 Iran Khodro models import completed!`);
    console.log(`✅ Added: ${added} models`);
    console.log(`⏭️  Skipped: ${skipped} models (already existed)`);
    console.log(`📊 Total Iran Khodro models in database: ${added + skipped}`);
    
  } catch (error) {
    console.error('❌ Error adding Iran Khodro models:', error.message);
  } finally {
    mongoose.disconnect();
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addIkcoModels();
}

export default addIkcoModels; 