import mongoose from 'mongoose';
import 'dotenv/config';
import Manufacturer from './src/models/Manufacturer.js';

const fixManufacturers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/karno');
    console.log('Connected to MongoDB');

    // Find all manufacturers
    const manufacturers = await Manufacturer.find({});
    console.log('Current manufacturers:');
    manufacturers.forEach(m => {
      console.log(`Name: ${m.name}, NameEn: ${m.nameEn}, Slug: ${m.slug}`);
    });

    // Find the problematic manufacturer
    const problematicManufacturer = await Manufacturer.findOne({ name: 'سایپا', nameEn: 'MVM / Chery' });
    
    if (problematicManufacturer) {
      console.log('\n🔧 Fixing manufacturer data...');
      
      // Update this to be MVM/Chery
      await Manufacturer.findByIdAndUpdate(problematicManufacturer._id, {
        name: 'مدیران‌خودرو',
        nameEn: 'MVM / Chery',
        slug: 'mvm',
        description: 'شرکت مدیران‌خودرو - نماینده چری در ایران',
        country: 'ایران',
        website: 'https://www.mvm.ir',
        logo: '/images/brands/mvm-logo.png'
      });
      console.log('✅ Updated MVM manufacturer');

      // Create proper SAIPA
      const saipaManufacturer = new Manufacturer({
        name: 'سایپا',
        nameEn: 'SAIPA',
        slug: 'saipa',
        description: 'شرکت سایپا (سازنده‌گان ایران پارس) یکی از بزرگ‌ترین خودروسازان ایران',
        country: 'ایران',
        website: 'https://www.saipacorp.com',
        logo: '/images/brands/saipa-logo.png',
        isActive: true
      });

      await saipaManufacturer.save();
      console.log('✅ Created SAIPA manufacturer');
    }

    // Also create Iran Khodro if not exists
    const ikcoExists = await Manufacturer.findOne({ slug: 'iran-khodro' });
    if (!ikcoExists) {
      const ikcoManufacturer = new Manufacturer({
        name: 'ایران‌خودرو',
        nameEn: 'Iran Khodro',
        slug: 'iran-khodro',
        description: 'شرکت ایران‌خودرو (ایکو) بزرگ‌ترین خودروساز ایران',
        country: 'ایران',
        website: 'https://www.ikco.ir',
        logo: '/images/brands/ikco-logo.png',
        isActive: true
      });

      await ikcoManufacturer.save();
      console.log('✅ Created Iran Khodro manufacturer');
    }

    // Show final results
    console.log('\n📊 Final manufacturers:');
    const finalManufacturers = await Manufacturer.find({}).select('name nameEn slug');
    finalManufacturers.forEach(m => {
      console.log(`  ${m.name} (${m.nameEn}) - slug: ${m.slug}`);
    });

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error fixing manufacturers:', error.message);
    mongoose.disconnect();
  }
};

fixManufacturers(); 