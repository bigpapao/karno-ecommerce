import mongoose from 'mongoose';
import 'dotenv/config';
import VehicleModel from './src/models/VehicleModel.js';
import Manufacturer from './src/models/Manufacturer.js';

// Enhanced data for better product classification
const saipaModelEnhancements = [
  // Pride Series - Popular and widely serviced
  {
    name: 'پراید 111',
    yearRange: { start: 1990, end: 2018 },
    engineVariants: [
      { name: '1.0L Carburetor', displacement: '1000cc', power: '50hp', fuelType: 'بنزین', transmission: 'دستی', years: '1990-2005' },
      { name: '1.0L EFI', displacement: '1000cc', power: '55hp', fuelType: 'بنزین', transmission: 'دستی', years: '2005-2018' }
    ],
    marketSegment: 'اقتصادی',
    popularity: { score: 95, factors: { salesVolume: 90, marketShare: 25, searchFrequency: 95, partsRequests: 100, userRating: 3.8 } },
    partsAvailability: {
      score: 95,
      status: 'عالی',
      categories: { engine: 95, brake: 90, suspension: 85, electrical: 80, bodyParts: 90, interior: 75, filters: 100 }
    }
  },
  {
    name: 'پراید 131',
    yearRange: { start: 1993, end: 2018 },
    engineVariants: [
      { name: '1.3L Carburetor', displacement: '1300cc', power: '65hp', fuelType: 'بنزین', transmission: 'دستی', years: '1993-2005' },
      { name: '1.3L EFI', displacement: '1300cc', power: '70hp', fuelType: 'بنزین', transmission: 'دستی', years: '2005-2018' }
    ],
    marketSegment: 'اقتصادی',
    popularity: { score: 98, factors: { salesVolume: 95, marketShare: 30, searchFrequency: 100, partsRequests: 100, userRating: 4.0 } },
    partsAvailability: {
      score: 98,
      status: 'عالی',
      categories: { engine: 98, brake: 95, suspension: 90, electrical: 85, bodyParts: 95, interior: 80, filters: 100 }
    }
  },
  {
    name: 'پراید 132',
    yearRange: { start: 1995, end: 2018 },
    engineVariants: [
      { name: '1.3L EFI', displacement: '1300cc', power: '70hp', fuelType: 'بنزین', transmission: 'دستی', years: '1995-2018' }
    ],
    marketSegment: 'اقتصادی',
    popularity: { score: 85, factors: { salesVolume: 80, marketShare: 15, searchFrequency: 85, partsRequests: 95, userRating: 3.7 } },
    partsAvailability: {
      score: 95,
      status: 'عالی',
      categories: { engine: 95, brake: 90, suspension: 85, electrical: 80, bodyParts: 90, interior: 75, filters: 100 }
    }
  },
  {
    name: 'پراید 151 (وانت)',
    yearRange: { start: 1998, end: 2018 },
    engineVariants: [
      { name: '1.5L EFI', displacement: '1500cc', power: '85hp', fuelType: 'بنزین', transmission: 'دستی', years: '1998-2018' }
    ],
    marketSegment: 'تجاری',
    popularity: { score: 75, factors: { salesVolume: 70, marketShare: 10, searchFrequency: 75, partsRequests: 85, userRating: 3.5 } },
    partsAvailability: {
      score: 85,
      status: 'خوب',
      categories: { engine: 85, brake: 80, suspension: 90, electrical: 70, bodyParts: 75, interior: 60, filters: 90 }
    }
  },

  // Quick Series - Modern and popular
  {
    name: 'کوییک',
    yearRange: { start: 2010, end: 2020 },
    engineVariants: [
      { name: '1.5L EF7', displacement: '1500cc', power: '110hp', fuelType: 'بنزین', transmission: 'دستی', years: '2010-2020' }
    ],
    marketSegment: 'متوسط',
    popularity: { score: 88, factors: { salesVolume: 85, marketShare: 20, searchFrequency: 90, partsRequests: 90, userRating: 4.1 } },
    partsAvailability: {
      score: 85,
      status: 'خوب',
      categories: { engine: 85, brake: 80, suspension: 80, electrical: 85, bodyParts: 80, interior: 75, filters: 90 }
    }
  },
  {
    name: 'کوییک R',
    yearRange: { start: 2012, end: 2020 },
    engineVariants: [
      { name: '1.5L EF7 Enhanced', displacement: '1500cc', power: '115hp', fuelType: 'بنزین', transmission: 'دستی', years: '2012-2020' }
    ],
    marketSegment: 'متوسط',
    popularity: { score: 80, factors: { salesVolume: 75, marketShare: 15, searchFrequency: 80, partsRequests: 85, userRating: 4.0 } },
    partsAvailability: {
      score: 80,
      status: 'خوب',
      categories: { engine: 80, brake: 75, suspension: 75, electrical: 80, bodyParts: 75, interior: 70, filters: 85 }
    }
  },
  {
    name: 'کوییک اتوماتیک',
    yearRange: { start: 2015, end: 2020 },
    engineVariants: [
      { name: '1.5L EF7 CVT', displacement: '1500cc', power: '110hp', fuelType: 'بنزین', transmission: 'CVT', years: '2015-2020' }
    ],
    marketSegment: 'متوسط',
    popularity: { score: 70, factors: { salesVolume: 60, marketShare: 8, searchFrequency: 70, partsRequests: 75, userRating: 4.2 } },
    partsAvailability: {
      score: 70,
      status: 'متوسط',
      categories: { engine: 75, brake: 70, suspension: 70, electrical: 75, bodyParts: 70, interior: 65, filters: 80 }
    }
  },

  // Tiba Series
  {
    name: 'تیبا',
    yearRange: { start: 2009, end: 2018 },
    engineVariants: [
      { name: '1.5L EF7', displacement: '1500cc', power: '95hp', fuelType: 'بنزین', transmission: 'دستی', years: '2009-2018' }
    ],
    marketSegment: 'اقتصادی',
    popularity: { score: 82, factors: { salesVolume: 80, marketShare: 18, searchFrequency: 85, partsRequests: 85, userRating: 3.8 } },
    partsAvailability: {
      score: 80,
      status: 'خوب',
      categories: { engine: 80, brake: 75, suspension: 75, electrical: 75, bodyParts: 75, interior: 70, filters: 85 }
    }
  },
  {
    name: 'تیبا 2',
    yearRange: { start: 2014, end: 2020 },
    engineVariants: [
      { name: '1.5L EF7 Enhanced', displacement: '1500cc', power: '105hp', fuelType: 'بنزین', transmission: 'دستی', years: '2014-2020' }
    ],
    marketSegment: 'اقتصادی',
    popularity: { score: 75, factors: { salesVolume: 70, marketShare: 12, searchFrequency: 75, partsRequests: 80, userRating: 3.9 } },
    partsAvailability: {
      score: 75,
      status: 'خوب',
      categories: { engine: 75, brake: 70, suspension: 70, electrical: 75, bodyParts: 70, interior: 65, filters: 80 }
    }
  },

  // Saina Series
  {
    name: 'ساینا',
    yearRange: { start: 2010, end: 2020 },
    engineVariants: [
      { name: '1.5L EF7', displacement: '1500cc', power: '105hp', fuelType: 'بنزین', transmission: 'دستی', years: '2010-2020' }
    ],
    marketSegment: 'متوسط',
    popularity: { score: 85, factors: { salesVolume: 80, marketShare: 18, searchFrequency: 85, partsRequests: 90, userRating: 4.0 } },
    partsAvailability: {
      score: 82,
      status: 'خوب',
      categories: { engine: 82, brake: 78, suspension: 78, electrical: 80, bodyParts: 78, interior: 75, filters: 85 }
    }
  },
  {
    name: 'ساینا S',
    yearRange: { start: 2015, end: 2020 },
    engineVariants: [
      { name: '1.5L EF7 Enhanced', displacement: '1500cc', power: '110hp', fuelType: 'بنزین', transmission: 'دستی', years: '2015-2020' }
    ],
    marketSegment: 'متوسط',
    popularity: { score: 78, factors: { salesVolume: 75, marketShare: 15, searchFrequency: 80, partsRequests: 80, userRating: 4.1 } },
    partsAvailability: {
      score: 78,
      status: 'خوب',
      categories: { engine: 78, brake: 75, suspension: 75, electrical: 78, bodyParts: 75, interior: 72, filters: 82 }
    }
  },

  // Shahin Series - Latest generation
  {
    name: 'شاهین',
    yearRange: { start: 2020, end: 2024 },
    engineVariants: [
      { name: '1.5L Turbo', displacement: '1500cc', power: '150hp', fuelType: 'بنزین', transmission: 'دستی', years: '2020-2024' }
    ],
    marketSegment: 'متوسط',
    popularity: { score: 70, factors: { salesVolume: 60, marketShare: 8, searchFrequency: 75, partsRequests: 65, userRating: 4.3 } },
    partsAvailability: {
      score: 65,
      status: 'متوسط',
      categories: { engine: 65, brake: 60, suspension: 60, electrical: 70, bodyParts: 60, interior: 65, filters: 75 }
    }
  },

  // Atlas Series - SUV/Crossover
  {
    name: 'سایپا اطلس',
    yearRange: { start: 2019, end: 2024 },
    engineVariants: [
      { name: '1.6L Turbo', displacement: '1600cc', power: '160hp', fuelType: 'بنزین', transmission: 'دستی', years: '2019-2024' }
    ],
    marketSegment: 'متوسط',
    popularity: { score: 60, factors: { salesVolume: 50, marketShare: 5, searchFrequency: 65, partsRequests: 55, userRating: 4.2 } },
    partsAvailability: {
      score: 55,
      status: 'متوسط',
      categories: { engine: 55, brake: 50, suspension: 60, electrical: 60, bodyParts: 50, interior: 55, filters: 65 }
    }
  },

  // Commercial Vehicles
  {
    name: 'وانت نیسان زامیاد بنزینی',
    yearRange: { start: 2005, end: 2020 },
    engineVariants: [
      { name: '2.4L Nissan', displacement: '2400cc', power: '140hp', fuelType: 'بنزین', transmission: 'دستی', years: '2005-2020' }
    ],
    marketSegment: 'تجاری',
    popularity: { score: 75, factors: { salesVolume: 70, marketShare: 20, searchFrequency: 75, partsRequests: 85, userRating: 3.8 } },
    partsAvailability: {
      score: 80,
      status: 'خوب',
      categories: { engine: 80, brake: 85, suspension: 90, electrical: 70, bodyParts: 75, interior: 60, filters: 85 }
    }
  },
  {
    name: 'وانت نیسان زامیاد دیزلی',
    yearRange: { start: 2008, end: 2020 },
    engineVariants: [
      { name: '2.5L Diesel', displacement: '2500cc', power: '120hp', fuelType: 'دیزل', transmission: 'دستی', years: '2008-2020' }
    ],
    marketSegment: 'تجاری',
    popularity: { score: 65, factors: { salesVolume: 60, marketShare: 15, searchFrequency: 65, partsRequests: 75, userRating: 3.7 } },
    partsAvailability: {
      score: 75,
      status: 'خوب',
      categories: { engine: 75, brake: 80, suspension: 85, electrical: 65, bodyParts: 70, interior: 55, filters: 80 }
    }
  },
  {
    name: 'وانت شوکا بنزینی',
    yearRange: { start: 2018, end: 2024 },
    engineVariants: [
      { name: '1.6L EF7', displacement: '1600cc', power: '110hp', fuelType: 'بنزین', transmission: 'دستی', years: '2018-2024' }
    ],
    marketSegment: 'تجاری',
    popularity: { score: 50, factors: { salesVolume: 40, marketShare: 8, searchFrequency: 50, partsRequests: 55, userRating: 3.6 } },
    partsAvailability: {
      score: 60,
      status: 'متوسط',
      categories: { engine: 60, brake: 65, suspension: 70, electrical: 55, bodyParts: 55, interior: 50, filters: 70 }
    }
  },
  {
    name: 'زامیاد زاگرس',
    yearRange: { start: 2022, end: 2024 },
    engineVariants: [
      { name: '1.6L EF7', displacement: '1600cc', power: '110hp', fuelType: 'بنزین', transmission: 'دستی', years: '2022-2024' }
    ],
    marketSegment: 'تجاری',
    popularity: { score: 45, factors: { salesVolume: 35, marketShare: 3, searchFrequency: 45, partsRequests: 50, userRating: 3.5 } },
    partsAvailability: {
      score: 50,
      status: 'متوسط',
      categories: { engine: 50, brake: 55, suspension: 60, electrical: 45, bodyParts: 45, interior: 45, filters: 60 }
    }
  }
];

const enhanceSaipaModels = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/karno');
    console.log('Connected to MongoDB');
    
    // Find SAIPA manufacturer
    const saipaManufacturer = await Manufacturer.findOne({ slug: 'saipa' });
    if (!saipaManufacturer) {
      console.error('SAIPA manufacturer not found.');
      return;
    }
    
    console.log(`Found SAIPA manufacturer: ${saipaManufacturer.name}`);
    
    let updated = 0;
    let notFound = 0;
    
    for (const enhancement of saipaModelEnhancements) {
      // Find existing model by name
      const existingModel = await VehicleModel.findOne({ 
        name: enhancement.name,
        manufacturer: saipaManufacturer._id 
      });
      
      if (!existingModel) {
        console.log(`⚠️  Model not found: ${enhancement.name}`);
        notFound++;
        continue;
      }
      
      // Update with enhanced data
      await VehicleModel.findByIdAndUpdate(existingModel._id, {
        yearRange: enhancement.yearRange,
        engineVariants: enhancement.engineVariants,
        marketSegment: enhancement.marketSegment,
        popularity: {
          ...enhancement.popularity,
          lastUpdated: new Date()
        },
        partsAvailability: {
          ...enhancement.partsAvailability,
          lastUpdated: new Date()
        }
      });
      
      console.log(`✅ Enhanced ${enhancement.name}`);
      updated++;
    }
    
    console.log(`\n🎉 SAIPA models enhancement completed!`);
    console.log(`✅ Updated: ${updated} models`);
    console.log(`⚠️  Not found: ${notFound} models`);
    
    // Show summary of enhanced models
    const enhancedModels = await VehicleModel.find({ 
      manufacturer: saipaManufacturer._id,
      'popularity.score': { $exists: true }
    }).select('name popularity.score partsAvailability.score marketSegment');
    
    console.log(`\n📊 Enhanced Models Summary:`);
    enhancedModels.forEach(model => {
      console.log(`  ${model.name}: Popularity ${model.popularity?.score || 0}, Parts ${model.partsAvailability?.score || 0}, Segment: ${model.marketSegment || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('❌ Error enhancing SAIPA models:', error.message);
  } finally {
    mongoose.disconnect();
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  enhanceSaipaModels();
}

export default enhanceSaipaModels; 