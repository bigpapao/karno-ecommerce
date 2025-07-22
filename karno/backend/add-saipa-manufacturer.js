import mongoose from 'mongoose';
import 'dotenv/config';
import Manufacturer from './src/models/Manufacturer.js';

const addSaipaManufacturer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/karno');
    console.log('Connected to MongoDB');

    // Check if SAIPA already exists
    const existingSaipa = await Manufacturer.findOne({ slug: 'saipa' });
    if (existingSaipa) {
      console.log('SAIPA manufacturer already exists:', existingSaipa.name);
      mongoose.disconnect();
      return;
    }

    // Create SAIPA manufacturer
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
    console.log('✅ SAIPA manufacturer created successfully!');
    console.log('Name:', saipaManufacturer.name);
    console.log('Slug:', saipaManufacturer.slug);
    console.log('ID:', saipaManufacturer._id);

    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error creating SAIPA manufacturer:', error.message);
    mongoose.disconnect();
  }
};

addSaipaManufacturer(); 