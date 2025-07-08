import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import all your models
import User from './src/models/user.model.js';
import Product from './src/models/product.model.js';
import Category from './src/models/category.model.js';
import Brand from './src/models/brand.model.js';
import Cart from './src/models/cart.model.js';
import Order from './src/models/order.model.js';
import VehicleModel from './src/models/VehicleModel.js';
import Manufacturer from './src/models/Manufacturer.js';
import PhoneVerification from './src/models/phoneVerification.model.js';

async function exportDatabaseStructure() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/karno');
    console.log('Connected to MongoDB');

    const exportData = {
      timestamp: new Date().toISOString(),
      database: 'karno',
      collections: {}
    };

    // Define all your models
    const models = {
      users: User,
      products: Product,
      categories: Category,
      brands: Brand,
      carts: Cart,
      orders: Order,
      vehicleModels: VehicleModel,
      manufacturers: Manufacturer,
      phoneVerifications: PhoneVerification
    };

    for (const [collectionName, Model] of Object.entries(models)) {
      console.log(`\n📊 Analyzing ${collectionName}...`);
      
      try {
        // Get schema structure
        const schema = Model.schema;
        const schemaDefinition = {};
        
        // Extract schema fields and their types
        schema.eachPath((pathname, schematype) => {
          if (pathname !== '_id' && pathname !== '__v') {
            schemaDefinition[pathname] = {
              type: schematype.constructor.name,
              required: schematype.isRequired || false,
              unique: schematype._index?.unique || false,
              ref: schematype.options?.ref || null,
              enum: schematype.enumValues || null,
              default: schematype.defaultValue || null
            };
          }
        });

        // Get collection stats
        const count = await Model.countDocuments();
        
        // Get sample documents (first 3)
        const samples = await Model.find().limit(3).lean();
        
        // Get indexes
        const indexes = await Model.collection.getIndexes();

        exportData.collections[collectionName] = {
          count,
          schema: schemaDefinition,
          indexes,
          samples: samples.map(doc => {
            // Remove sensitive data
            if (doc.password) delete doc.password;
            if (doc.refreshToken) delete doc.refreshToken;
            return doc;
          })
        };

        console.log(`✅ ${collectionName}: ${count} documents`);
      } catch (error) {
        console.log(`❌ Error analyzing ${collectionName}:`, error.message);
        exportData.collections[collectionName] = {
          error: error.message
        };
      }
    }

    // Save to file
    const outputPath = path.join(__dirname, 'database-structure.json');
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
    
    console.log(`\n🎉 Database structure exported to: ${outputPath}`);
    console.log('\n📋 Summary:');
    
    Object.entries(exportData.collections).forEach(([name, data]) => {
      if (data.error) {
        console.log(`   ${name}: ERROR - ${data.error}`);
      } else {
        console.log(`   ${name}: ${data.count} documents, ${Object.keys(data.schema).length} fields`);
      }
    });

  } catch (error) {
    console.error('❌ Export failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the export
exportDatabaseStructure(); 