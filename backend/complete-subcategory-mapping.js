import mongoose from 'mongoose';
import 'dotenv/config';
import Category from './src/models/category.model.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/karno');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Complete subcategory mappings
const completeSubcategoryMappings = {
  // Engine parts subcategories
  'camshaft': { 
    installationDifficulty: 'professional', 
    maintenanceFrequency: 'annual',
    criticalityLevel: 'performance-critical'
  },
  'head-gasket': { 
    installationDifficulty: 'professional', 
    maintenanceFrequency: 'annual',
    criticalityLevel: 'performance-critical'
  },
  
  // Suspension subcategories
  'ball-joint': { 
    installationDifficulty: 'professional', 
    maintenanceFrequency: 'annual',
    criticalityLevel: 'safety-critical'
  },
  'stabilizer-bar': { 
    installationDifficulty: 'professional', 
    maintenanceFrequency: 'annual',
    criticalityLevel: 'performance-critical'
  },
  'coil-spring': { 
    installationDifficulty: 'professional', 
    maintenanceFrequency: 'annual',
    criticalityLevel: 'performance-critical'
  },
  
  // Brake system subcategories
  'brake-shoe': { 
    installationDifficulty: 'medium', 
    maintenanceFrequency: 'seasonal',
    criticalityLevel: 'safety-critical'
  },
  'brake-booster': { 
    installationDifficulty: 'professional', 
    maintenanceFrequency: 'annual',
    criticalityLevel: 'safety-critical'
  },
  'brake-pump': { 
    installationDifficulty: 'professional', 
    maintenanceFrequency: 'annual',
    criticalityLevel: 'safety-critical'
  },
  
  // Steering system subcategories
  'steering-box': { 
    installationDifficulty: 'professional', 
    maintenanceFrequency: 'annual',
    criticalityLevel: 'safety-critical'
  },
  'power-steering-pump': { 
    installationDifficulty: 'professional', 
    maintenanceFrequency: 'annual',
    criticalityLevel: 'performance-critical'
  },
  'steering-shaft': { 
    installationDifficulty: 'professional', 
    maintenanceFrequency: 'annual',
    criticalityLevel: 'safety-critical'
  },
  
  // Electrical subcategories
  'ecu': { 
    installationDifficulty: 'professional', 
    maintenanceFrequency: 'as-needed',
    criticalityLevel: 'performance-critical'
  },
  'sensors': { 
    installationDifficulty: 'medium', 
    maintenanceFrequency: 'as-needed',
    criticalityLevel: 'performance-critical'
  },
  'lights': { 
    installationDifficulty: 'easy', 
    maintenanceFrequency: 'as-needed',
    criticalityLevel: 'safety-critical'
  },
  
  // Fuel system subcategories
  'fuel-tank': { 
    installationDifficulty: 'professional', 
    maintenanceFrequency: 'as-needed',
    criticalityLevel: 'performance-critical'
  },
  'fuel-pump': { 
    installationDifficulty: 'professional', 
    maintenanceFrequency: 'annual',
    criticalityLevel: 'performance-critical'
  },
  'injector': { 
    installationDifficulty: 'professional', 
    maintenanceFrequency: 'annual',
    criticalityLevel: 'performance-critical'
  },
  'fuel-rail': { 
    installationDifficulty: 'professional', 
    maintenanceFrequency: 'annual',
    criticalityLevel: 'performance-critical'
  },
  'fuel-filter': { 
    installationDifficulty: 'medium', 
    maintenanceFrequency: 'seasonal',
    criticalityLevel: 'performance-critical'
  },
  
  // Cooling system subcategories
  'radiator': { 
    installationDifficulty: 'professional', 
    maintenanceFrequency: 'annual',
    criticalityLevel: 'performance-critical'
  },
  'cooling-fan': { 
    installationDifficulty: 'medium', 
    maintenanceFrequency: 'annual',
    criticalityLevel: 'performance-critical'
  },
  'thermostat': { 
    installationDifficulty: 'medium', 
    maintenanceFrequency: 'annual',
    criticalityLevel: 'performance-critical'
  },
  'water-hose': { 
    installationDifficulty: 'medium', 
    maintenanceFrequency: 'annual',
    criticalityLevel: 'performance-critical'
  },
  
  // Body parts subcategories
  'fender': { 
    installationDifficulty: 'professional', 
    maintenanceFrequency: 'as-needed',
    criticalityLevel: 'aesthetic'
  },
  'mirror': { 
    installationDifficulty: 'medium', 
    maintenanceFrequency: 'as-needed',
    criticalityLevel: 'safety-critical'
  },
  'handle': { 
    installationDifficulty: 'medium', 
    maintenanceFrequency: 'as-needed',
    criticalityLevel: 'comfort'
  },
  'door-seal': { 
    installationDifficulty: 'medium', 
    maintenanceFrequency: 'annual',
    criticalityLevel: 'comfort'
  },
  
  // Consumables subcategories
  'cabin-filter': { 
    installationDifficulty: 'easy', 
    maintenanceFrequency: 'seasonal',
    criticalityLevel: 'comfort'
  },
  'fuel-filter-consumable': { 
    installationDifficulty: 'medium', 
    maintenanceFrequency: 'seasonal',
    criticalityLevel: 'performance-critical'
  },
  'various-oils': { 
    installationDifficulty: 'easy', 
    maintenanceFrequency: 'seasonal',
    criticalityLevel: 'performance-critical'
  },
  'antifreeze': { 
    installationDifficulty: 'easy', 
    maintenanceFrequency: 'annual',
    criticalityLevel: 'performance-critical'
  },
  
  // Interior parts subcategories
  'dashboard': { 
    installationDifficulty: 'professional', 
    maintenanceFrequency: 'as-needed',
    criticalityLevel: 'comfort'
  },
  'seat': { 
    installationDifficulty: 'medium', 
    maintenanceFrequency: 'as-needed',
    criticalityLevel: 'comfort'
  },
  'seatbelt': { 
    installationDifficulty: 'professional', 
    maintenanceFrequency: 'as-needed',
    criticalityLevel: 'safety-critical'
  },
  'center-console': { 
    installationDifficulty: 'medium', 
    maintenanceFrequency: 'as-needed',
    criticalityLevel: 'comfort'
  },
  'interior-trim': { 
    installationDifficulty: 'medium', 
    maintenanceFrequency: 'as-needed',
    criticalityLevel: 'aesthetic'
  },
  
  // Transmission subcategories
  'clutch-disc': { 
    installationDifficulty: 'professional', 
    maintenanceFrequency: 'annual',
    criticalityLevel: 'performance-critical'
  },
  'clutch-plate': { 
    installationDifficulty: 'professional', 
    maintenanceFrequency: 'annual',
    criticalityLevel: 'performance-critical'
  },
  'transmission': { 
    installationDifficulty: 'professional', 
    maintenanceFrequency: 'as-needed',
    criticalityLevel: 'performance-critical'
  },
  'clutch-cable': { 
    installationDifficulty: 'medium', 
    maintenanceFrequency: 'annual',
    criticalityLevel: 'performance-critical'
  },
  'clutch-pump': { 
    installationDifficulty: 'professional', 
    maintenanceFrequency: 'annual',
    criticalityLevel: 'performance-critical'
  },
  'gear-shift': { 
    installationDifficulty: 'medium', 
    maintenanceFrequency: 'as-needed',
    criticalityLevel: 'performance-critical'
  },
  
  // Accessories subcategories
  'seat-cover': { 
    installationDifficulty: 'easy', 
    maintenanceFrequency: 'as-needed',
    criticalityLevel: 'comfort'
  },
  'floor-mat': { 
    installationDifficulty: 'easy', 
    maintenanceFrequency: 'as-needed',
    criticalityLevel: 'comfort'
  },
  'sun-visor': { 
    installationDifficulty: 'easy', 
    maintenanceFrequency: 'as-needed',
    criticalityLevel: 'comfort'
  },
  'rear-camera': { 
    installationDifficulty: 'professional', 
    maintenanceFrequency: 'as-needed',
    criticalityLevel: 'safety-critical'
  },
  'parking-sensor': { 
    installationDifficulty: 'professional', 
    maintenanceFrequency: 'as-needed',
    criticalityLevel: 'safety-critical'
  },
  
  // Condition subcategories
  'new': { 
    installationDifficulty: 'medium', 
    maintenanceFrequency: 'as-needed',
    criticalityLevel: 'performance-critical'
  },
  'used': { 
    installationDifficulty: 'medium', 
    maintenanceFrequency: 'seasonal',
    criticalityLevel: 'performance-critical'
  },
  'refurbished': { 
    installationDifficulty: 'medium', 
    maintenanceFrequency: 'seasonal',
    criticalityLevel: 'performance-critical'
  }
};

const updateRemainingSubcategories = async () => {
  try {
    await connectDB();
    console.log('🚀 Starting to update remaining subcategory automotive fields...\n');

    let totalUpdated = 0;
    let totalSkipped = 0;

    // Get all categories that have a parent (subcategories)
    const subcategories = await Category.find({ parent: { $ne: null } }).populate('parent');
    console.log(`Found ${subcategories.length} subcategories to update\n`);

    for (const subcategory of subcategories) {
      try {
        const mapping = completeSubcategoryMappings[subcategory.slug];
        
        if (!mapping) {
          console.log(`⚠️  No mapping found for subcategory: "${subcategory.name}" (${subcategory.slug}), skipping...`);
          totalSkipped++;
          continue;
        }

        // Prepare update data - inherit from parent category
        const updateData = {};
        
        if (subcategory.parent) {
          // Inherit automotive fields from parent
          updateData.partType = subcategory.parent.partType;
          updateData.vehicleCategory = subcategory.parent.vehicleCategory;
          updateData.compatibilityLevel = subcategory.parent.compatibilityLevel || 'model-specific';
          updateData.isAutomotiveSpecific = true;
        }

        // Apply subcategory-specific overrides
        if (mapping.installationDifficulty) {
          updateData.installationDifficulty = mapping.installationDifficulty;
        }
        if (mapping.maintenanceFrequency) {
          updateData.maintenanceFrequency = mapping.maintenanceFrequency;
        }
        if (mapping.criticalityLevel) {
          updateData.criticalityLevel = mapping.criticalityLevel;
        }

        // Update the subcategory
        await Category.findByIdAndUpdate(subcategory._id, updateData);
        console.log(`✅ Updated subcategory: "${subcategory.name}" with ${Object.keys(updateData).length} fields`);
        totalUpdated++;

      } catch (error) {
        console.error(`❌ Error updating subcategory "${subcategory.name}": ${error.message}`);
      }
    }

    console.log('\n🎉 Subcategory automotive fields update completed!');
    console.log(`📊 Summary:`);
    console.log(`   ✅ Subcategories updated: ${totalUpdated}`);
    console.log(`   ⚠️  Subcategories skipped: ${totalSkipped}`);
    console.log(`   📁 Total subcategories processed: ${totalUpdated + totalSkipped}`);

    // Close the connection
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  } catch (error) {
    console.error(`❌ Error updating subcategories: ${error.message}`);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the function
console.log('🏁 Starting subcategory automotive fields update...\n');
updateRemainingSubcategories(); 