import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import { carModelsData } from '../utils/carModelsData.js';

// Define schemas (these should match your actual model schemas)
const manufacturerSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  nameEn: { type: String },
  slug: { type: String, required: true, unique: true },
  logo: { type: String },
  description: { type: String },
  country: { type: String, default: 'Iran' },
  website: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const vehicleModelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameEn: { type: String },
  slug: { type: String, required: true },
  manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer', required: true },
  year: { type: String },
  engine: { type: String },
  category: { type: String },
  image: { type: String },
  description: { type: String },
  specifications: {
    engineSize: String,
    power: String,
    transmission: String,
    fuelType: String,
    bodyType: String,
    seatingCapacity: String,
    length: String,
    width: String,
    height: String,
    wheelbase: String
  },
  popular: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Manufacturer = mongoose.model('Manufacturer', manufacturerSchema);
const VehicleModel = mongoose.model('VehicleModel', vehicleModelSchema);

const seedVehicles = async () => {
  try {
    console.log('🚀 Starting vehicle database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data
    console.log('🗑️  Clearing existing manufacturers and models...');
    await Manufacturer.deleteMany({});
    await VehicleModel.deleteMany({});
    
    // Create manufacturers
    console.log('🏭 Creating manufacturers...');
    const manufacturersData = [
      {
        name: 'سایپا',
        nameEn: 'SAIPA',
        slug: 'saipa',
        logo: '/images/brands/saipa.png',
        description: 'شرکت سایپا یکی از بزرگترین تولیدکنندگان خودرو در ایران',
        website: 'https://www.saipa.com'
      },
      {
        name: 'ایران خودرو',
        nameEn: 'Iran Khodro',
        slug: 'ikco',
        logo: '/images/brands/ikco.png',
        description: 'شرکت ایران خودرو بزرگترین تولیدکننده خودرو در ایران',
        website: 'https://www.ikco.com'
      }
    ];
    
    const createdManufacturers = await Manufacturer.insertMany(manufacturersData);
    console.log(`✅ Created ${createdManufacturers.length} manufacturers`);
    
    // Create vehicle models
    console.log('🚗 Creating vehicle models...');
    const modelsToCreate = [];
    
    for (const modelData of carModelsData) {
      const manufacturer = createdManufacturers.find(m => m.name === modelData.brand);
      if (manufacturer) {
        modelsToCreate.push({
          name: modelData.name,
          nameEn: modelData.nameEn,
          slug: modelData.id, // Use the string ID as slug
          manufacturer: manufacturer._id,
          year: modelData.year,
          engine: modelData.engine,
          category: modelData.category,
          image: modelData.image,
          description: modelData.description,
          popular: modelData.popular || false,
          specifications: {
            engineSize: modelData.engine,
            fuelType: 'بنزین',
            bodyType: modelData.category
          }
        });
      }
    }
    
    const createdModels = await VehicleModel.insertMany(modelsToCreate);
    console.log(`✅ Created ${createdModels.length} vehicle models`);
    
    // Log summary
    console.log('\n📊 Seeding Summary:');
    console.log(`• Manufacturers: ${createdManufacturers.length}`);
    console.log(`• Vehicle Models: ${createdModels.length}`);
    
    console.log('\n🎉 Vehicle seeding completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error seeding vehicles:', error);
    process.exit(1);
  }
};

// Run the seeder
seedVehicles(); 