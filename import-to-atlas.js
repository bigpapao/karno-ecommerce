import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration - UPDATE THESE VALUES
const ATLAS_URI = 'mongodb+srv://username:password@cluster.mongodb.net/karno?retryWrites=true&w=majority';
const BACKUP_PATH = './backup/karno';

async function importData() {
  const client = new MongoClient(ATLAS_URI);
  
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db('karno');
    
    // Get all backup files
    const backupDir = path.join(__dirname, BACKUP_PATH);
    const files = fs.readdirSync(backupDir);
    
    console.log(`📁 Found ${files.length} collections to import`);
    
    for (const file of files) {
      if (file.endsWith('.bson')) {
        const collectionName = file.replace('.bson', '');
        const filePath = path.join(backupDir, file);
        
        console.log(`📥 Importing collection: ${collectionName}`);
        
        try {
          // Read the BSON file
          const bsonData = fs.readFileSync(filePath);
          
          // Parse BSON data (simplified - you might need a BSON parser)
          // For now, we'll use mongorestore command
          console.log(`   Using mongorestore for ${collectionName}...`);
          
          // Alternative: Use mongorestore command
          const { exec } = await import('child_process');
          const { promisify } = await import('util');
          const execAsync = promisify(exec);
          
          const command = `mongorestore --uri "${ATLAS_URI}" --collection ${collectionName} --db karno "${filePath}"`;
          
          try {
            await execAsync(command);
            console.log(`   ✅ Successfully imported ${collectionName}`);
          } catch (error) {
            console.log(`   ⚠️  Error importing ${collectionName}: ${error.message}`);
          }
          
        } catch (error) {
          console.log(`   ❌ Failed to import ${collectionName}: ${error.message}`);
        }
      }
    }
    
    console.log('🎉 Data import completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

// Instructions
console.log('🚀 MongoDB Atlas Data Import Script');
console.log('=====================================');
console.log('');
console.log('📋 Before running this script:');
console.log('1. Update ATLAS_URI with your MongoDB Atlas connection string');
console.log('2. Make sure you have mongorestore installed');
console.log('3. Ensure your backup files are in ./backup/karno/');
console.log('');
console.log('🔧 To install mongorestore:');
console.log('   - Windows: Download from MongoDB website');
console.log('   - Mac: brew install mongodb/brew/mongodb-database-tools');
console.log('   - Linux: sudo apt-get install mongodb-database-tools');
console.log('');
console.log('📝 Your backup files are ready in: ./backup/karno/');
console.log('');

// Check if ATLAS_URI is updated
if (ATLAS_URI.includes('username:password')) {
  console.log('⚠️  Please update ATLAS_URI with your actual MongoDB Atlas connection string');
  console.log('   Then run: node import-to-atlas.js');
} else {
  console.log('✅ ATLAS_URI looks configured. Running import...');
  importData();
} 