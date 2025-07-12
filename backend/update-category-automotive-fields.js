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

// Category mapping with automotive-specific data
const categoryMappings = {
  'engine-parts': {
    partType: 'engine',
    vehicleCategory: ['sedan', 'hatchback', 'crossover', 'suv', 'pickup'],
    compatibilityLevel: 'model-specific',
    installationDifficulty: 'professional',
    criticalityLevel: 'performance-critical',
    maintenanceFrequency: 'annual'
  },
  'suspension-frontend': {
    partType: 'suspension',
    vehicleCategory: ['sedan', 'hatchback', 'crossover', 'suv', 'pickup'],
    compatibilityLevel: 'model-specific',
    installationDifficulty: 'professional',
    criticalityLevel: 'safety-critical',
    maintenanceFrequency: 'annual'
  },
  'brake-system': {
    partType: 'brake',
    vehicleCategory: ['sedan', 'hatchback', 'crossover', 'suv', 'pickup'],
    compatibilityLevel: 'model-specific',
    installationDifficulty: 'medium',
    criticalityLevel: 'safety-critical',
    maintenanceFrequency: 'seasonal'
  },
  'steering-system': {
    partType: 'steering',
    vehicleCategory: ['sedan', 'hatchback', 'crossover', 'suv', 'pickup'],
    compatibilityLevel: 'model-specific',
    installationDifficulty: 'professional',
    criticalityLevel: 'safety-critical',
    maintenanceFrequency: 'annual'
  },
  'electrical-electronics': {
    partType: 'electrical',
    vehicleCategory: ['sedan', 'hatchback', 'crossover', 'suv', 'pickup'],
    compatibilityLevel: 'brand-specific',
    installationDifficulty: 'medium',
    criticalityLevel: 'performance-critical',
    maintenanceFrequency: 'as-needed'
  },
  'fuel-system': {
    partType: 'fuel',
    vehicleCategory: ['sedan', 'hatchback', 'crossover', 'suv', 'pickup'],
    compatibilityLevel: 'model-specific',
    installationDifficulty: 'professional',
    criticalityLevel: 'performance-critical',
    maintenanceFrequency: 'annual'
  },
  'cooling-system': {
    partType: 'cooling',
    vehicleCategory: ['sedan', 'hatchback', 'crossover', 'suv', 'pickup'],
    compatibilityLevel: 'model-specific',
    installationDifficulty: 'medium',
    criticalityLevel: 'performance-critical',
    maintenanceFrequency: 'annual'
  },
  'body-parts': {
    partType: 'body',
    vehicleCategory: ['sedan', 'hatchback', 'crossover', 'suv', 'pickup'],
    compatibilityLevel: 'model-specific',
    installationDifficulty: 'professional',
    criticalityLevel: 'aesthetic',
    maintenanceFrequency: 'as-needed'
  },
  'consumables': {
    partType: 'consumables',
    vehicleCategory: ['sedan', 'hatchback', 'crossover', 'suv', 'pickup'],
    compatibilityLevel: 'universal',
    installationDifficulty: 'easy',
    criticalityLevel: 'performance-critical',
    maintenanceFrequency: 'monthly'
  },
  'interior-parts': {
    partType: 'interior',
    vehicleCategory: ['sedan', 'hatchback', 'crossover', 'suv', 'pickup'],
    compatibilityLevel: 'model-specific',
    installationDifficulty: 'medium',
    criticalityLevel: 'comfort',
    maintenanceFrequency: 'as-needed'
  },
  'transmission-clutch': {
    partType: 'transmission',
    vehicleCategory: ['sedan', 'hatchback', 'crossover', 'suv', 'pickup'],
    compatibilityLevel: 'model-specific',
    installationDifficulty: 'professional',
    criticalityLevel: 'performance-critical',
    maintenanceFrequency: 'annual'
  },
  'accessories': {
    partType: 'accessories',
    vehicleCategory: ['sedan', 'hatchback', 'crossover', 'suv', 'pickup'],
    compatibilityLevel: 'universal',
    installationDifficulty: 'easy',
    criticalityLevel: 'comfort',
    maintenanceFrequency: 'as-needed'
  },
  'part-condition': {
    partType: 'condition',
    vehicleCategory: ['sedan', 'hatchback', 'crossover', 'suv', 'pickup'],
    compatibilityLevel: 'universal',
    installationDifficulty: 'easy',
    criticalityLevel: 'performance-critical',
    maintenanceFrequency: 'as-needed'
  }
};

// Subcategory-specific mappings
const subcategoryMappings = {
  // Engine parts subcategories
  'piston': { installationDifficulty: 'professional', maintenanceFrequency: 'annual' },
  'crankshaft': { installationDifficulty: 'professional', maintenanceFrequency: 'annual' },
  'timing-belt': { installationDifficulty: 'professional', maintenanceFrequency: 'seasonal' },
  'oil-pump': { installationDifficulty: 'professional', maintenanceFrequency: 'annual' },
  'water-pump': { installationDifficulty: 'professional', maintenanceFrequency: 'annual' },
  
  // Brake system subcategories
  'brake-pads': { installationDifficulty: 'medium', maintenanceFrequency: 'seasonal' },
  'brake-disc': { installationDifficulty: 'medium', maintenanceFrequency: 'annual' },
  'brake-fluid': { installationDifficulty: 'easy', maintenanceFrequency: 'annual' },
  
  // Electrical subcategories
  'battery': { installationDifficulty: 'easy', maintenanceFrequency: 'annual' },
  'alternator': { installationDifficulty: 'medium', maintenanceFrequency: 'as-needed' },
  'starter': { installationDifficulty: 'medium', maintenanceFrequency: 'as-needed' },
  
  // Consumables
  'air-filter': { installationDifficulty: 'easy', maintenanceFrequency: 'seasonal' },
  'engine-oil': { installationDifficulty: 'easy', maintenanceFrequency: 'seasonal' },
  'spark-plugs': { installationDifficulty: 'medium', maintenanceFrequency: 'annual' },
  
  // Suspension
  'shock-absorber': { installationDifficulty: 'professional', maintenanceFrequency: 'annual' },
  'control-arm': { installationDifficulty: 'professional', maintenanceFrequency: 'annual' },
  
  // Body parts
  'bumper': { installationDifficulty: 'professional', criticalityLevel: 'aesthetic' },
  'door': { installationDifficulty: 'professional', criticalityLevel: 'safety-critical' },
  'hood': { installationDifficulty: 'professional', criticalityLevel: 'aesthetic' }
};

const updateCategoryFields = async () => {
  try {
    await connectDB();
    console.log('🚀 Starting to update category automotive fields...\n');

    let totalUpdated = 0;
    let totalSkipped = 0;

    // Get all categories
    const categories = await Category.find({});
    console.log(`Found ${categories.length} categories to update\n`);

    for (const category of categories) {
      try {
        const mapping = categoryMappings[category.slug];
        const subcategoryMapping = subcategoryMappings[category.slug];
        
        if (!mapping && !subcategoryMapping) {
          console.log(`⚠️  No mapping found for category: "${category.name}" (${category.slug}), skipping...`);
          totalSkipped++;
          continue;
        }

        // Prepare update data
        const updateData = {};
        
        if (mapping) {
          // Main category mappings
          updateData.partType = mapping.partType;
          updateData.vehicleCategory = mapping.vehicleCategory;
          updateData.compatibilityLevel = mapping.compatibilityLevel;
          updateData.installationDifficulty = mapping.installationDifficulty;
          updateData.criticalityLevel = mapping.criticalityLevel;
          updateData.maintenanceFrequency = mapping.maintenanceFrequency;
        }

        if (subcategoryMapping) {
          // Subcategory-specific overrides
          if (subcategoryMapping.installationDifficulty) {
            updateData.installationDifficulty = subcategoryMapping.installationDifficulty;
          }
          if (subcategoryMapping.maintenanceFrequency) {
            updateData.maintenanceFrequency = subcategoryMapping.maintenanceFrequency;
          }
          if (subcategoryMapping.criticalityLevel) {
            updateData.criticalityLevel = subcategoryMapping.criticalityLevel;
          }
        }

        // Set default automotive specific
        updateData.isAutomotiveSpecific = true;

        // If it's a subcategory, inherit parent's partType and vehicleCategory
        if (category.parent) {
          const parentCategory = await Category.findById(category.parent);
          if (parentCategory && categoryMappings[parentCategory.slug]) {
            updateData.partType = categoryMappings[parentCategory.slug].partType;
            updateData.vehicleCategory = categoryMappings[parentCategory.slug].vehicleCategory;
            updateData.compatibilityLevel = categoryMappings[parentCategory.slug].compatibilityLevel;
            updateData.criticalityLevel = categoryMappings[parentCategory.slug].criticalityLevel;
          }
        }

        // Update the category
        await Category.findByIdAndUpdate(category._id, updateData);
        console.log(`✅ Updated category: "${category.name}" with ${Object.keys(updateData).length} fields`);
        totalUpdated++;

      } catch (error) {
        console.error(`❌ Error updating category "${category.name}": ${error.message}`);
      }
    }

    console.log('\n🎉 Category automotive fields update completed!');
    console.log(`📊 Summary:`);
    console.log(`   ✅ Categories updated: ${totalUpdated}`);
    console.log(`   ⚠️  Categories skipped: ${totalSkipped}`);
    console.log(`   📁 Total categories processed: ${totalUpdated + totalSkipped}`);

    // Close the connection
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  } catch (error) {
    console.error(`❌ Error updating categories: ${error.message}`);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the function
console.log('🏁 Starting category automotive fields update...\n');
updateCategoryFields(); 