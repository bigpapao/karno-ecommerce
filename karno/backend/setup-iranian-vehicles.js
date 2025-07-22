import mongoose from 'mongoose';
import 'dotenv/config';
import addIranianManufacturers from './add-iranian-manufacturers.js';
import addSaipaModels from './add-saipa-models.js';
import addIkcoModels from './add-ikco-models.js';
import addMvmModels from './add-mvm-models.js';
import addBahmanModels from './add-bahman-models.js';

// Setup all Iranian vehicle manufacturers and models
const setupIranianVehicles = async () => {
  console.log('🚀 Starting Iranian Vehicle Database Setup...\n');
  
  try {
    // Step 1: Add Iranian Manufacturers
    console.log('📋 STEP 1: Adding Iranian Manufacturers...');
    const manufacturerIds = await addIranianManufacturers();
    console.log('✅ Manufacturers setup completed!\n');
    
    // Step 2: Add SAIPA Models (80+ models)
    console.log('🚗 STEP 2: Adding SAIPA Vehicle Models (80+ models)...');
    await addSaipaModels();
    console.log('✅ SAIPA models setup completed!\n');
    
    // Step 3: Add Iran Khodro Models (40+ models)
    console.log('🚙 STEP 3: Adding Iran Khodro Vehicle Models (40+ models)...');
    await addIkcoModels();
    console.log('✅ Iran Khodro models setup completed!\n');
    
    // Step 4: Add MVM Models (40+ models)
    console.log('🚘 STEP 4: Adding MVM Vehicle Models (40+ models)...');
    await addMvmModels();
    console.log('✅ MVM models setup completed!\n');
    
    // Step 5: Add Bahman Motor Models (10+ models)
    console.log('🚛 STEP 5: Adding Bahman Motor Vehicle Models (10+ models)...');
    await addBahmanModels();
    console.log('✅ Bahman Motor models setup completed!\n');
    
    // Final Summary
    console.log('🎉 IRANIAN VEHICLE DATABASE SETUP COMPLETED! 🎉');
    console.log('═══════════════════════════════════════════════');
    console.log('📊 SUMMARY:');
    console.log('   🏭 Manufacturers: 4 major Iranian brands');
    console.log('   🚗 SAIPA: ~80 vehicle models');
    console.log('   🚙 Iran Khodro: ~40 vehicle models');
    console.log('   🚘 MVM/Chery: ~40 vehicle models');
    console.log('   🚛 Bahman Motor: ~12 vehicle models');
    console.log('   📈 Total: ~172+ Iranian vehicle models');
    console.log('═══════════════════════════════════════════════');
    console.log('✅ Database is now ready for automotive parts compatibility!');
    
  } catch (error) {
    console.error('❌ Error in Iranian vehicle setup:', error.message);
    throw error;
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('📊 Database connection closed.');
    }
  }
};

// Run the setup
setupIranianVehicles()
  .then(() => {
    console.log('\n🎯 Setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }); 