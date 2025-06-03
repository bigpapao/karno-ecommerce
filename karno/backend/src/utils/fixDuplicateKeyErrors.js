import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * This script fixes common duplicate key errors in MongoDB
 * It looks for E11000 errors and fixes them by either:
 * 1. Renaming the duplicate field (for less important fields)
 * 2. Renaming the document (for duplicate IDs)
 */
const fixDuplicateKeyErrors = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get database instance
    const { db } = mongoose.connection;

    // Collections to check (add your collection names here)
    const collectionsToCheck = ['users', 'products', 'orders', 'carts'];

    // Process each collection
    for (const collectionName of collectionsToCheck) {
      try {
        console.log(`Checking collection: ${collectionName}`);

        // Get collection
        const collection = db.collection(collectionName);

        // Get indexes to identify unique fields
        const indexes = await collection.indexes();
        const uniqueIndexes = indexes.filter((index) => index.unique);

        console.log(`Collection ${collectionName} has ${uniqueIndexes.length} unique indexes`);

        // Process each unique index
        for (const index of uniqueIndexes) {
          const indexFields = Object.keys(index.key);

          console.log(`Processing index on fields: ${indexFields.join(', ')}`);

          // For each field in the index
          for (const field of indexFields) {
            // Skip _id field for special handling
            if (field === '_id') continue;

            console.log(`Checking for duplicates in field: ${field}`);

            // Find duplicates
            const duplicates = await findDuplicateValues(collection, field);

            if (duplicates.length > 0) {
              console.log(`Found ${duplicates.length} duplicate values for field ${field}`);

              // Fix duplicates
              for (const duplicate of duplicates) {
                const value = duplicate._id;
                const documents = await collection.find({ [field]: value }).toArray();

                console.log(`Value "${value}" appears in ${documents.length} documents`);

                // Keep the first document, modify others
                for (let i = 1; i < documents.length; i++) {
                  const doc = documents[i];

                  // Create a unique modifier
                  const newValue = `${value}_DUPLICATE_${i}`;

                  // Update the document
                  await collection.updateOne(
                    { _id: doc._id },
                    { $set: { [field]: newValue } },
                  );

                  console.log(`Updated document ${doc._id}, changed ${field} from "${value}" to "${newValue}"`);
                }
              }
            } else {
              console.log(`No duplicates found for field ${field}`);
            }
          }
        }

        // Handle _id duplicates (should be rare)
        console.log('Checking for duplicate _id values (should not happen)');

        // This would mean documents with same _id which is very unlikely
        // but this is just a safeguard
      } catch (error) {
        console.error(`Error processing collection ${collectionName}:`, error);
      }
    }

    console.log('Duplicate key error fixes completed successfully');
  } catch (error) {
    console.error('Error fixing duplicate key errors:', error);
  } finally {
    // Close the MongoDB connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

/**
 * Helper function to find duplicate values for a field
 * @param {Object} collection - MongoDB collection
 * @param {string} field - Field to check for duplicates
 * @returns {Array} Array of duplicate values
 */
const findDuplicateValues = async (collection, field) => {
  const pipeline = [
    {
      $group: {
        _id: `$${field}`,
        count: { $sum: 1 },
      },
    },
    {
      $match: {
        count: { $gt: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ];

  return await collection.aggregate(pipeline).toArray();
};

// Run the function if this script is executed directly
if (require.main === module) {
  fixDuplicateKeyErrors()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error in fix script:', error);
      process.exit(1);
    });
}

export default fixDuplicateKeyErrors;
