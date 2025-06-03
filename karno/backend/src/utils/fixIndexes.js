import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * This script fixes index issues in MongoDB collections
 * It rebuilds indexes for collections with index violations
 */
const fixIndexes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get database instance
    const { db } = mongoose.connection;

    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collections`);

    // Process each collection
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`Processing collection: ${collectionName}`);

      // Get collection
      const collection = db.collection(collectionName);

      // Get indexes
      const indexes = await collection.indexes();
      console.log(`Collection ${collectionName} has ${indexes.length} indexes`);

      // Check for unique indexes
      const uniqueIndexes = indexes.filter((index) => index.unique);
      console.log(`Collection ${collectionName} has ${uniqueIndexes.length} unique indexes`);

      // Fix each unique index
      for (const index of uniqueIndexes) {
        const indexName = index.name;
        const indexKey = index.key;

        console.log(`Processing unique index: ${indexName}`);

        // Identify the fields in this index
        const indexFields = Object.keys(indexKey);

        // Find documents with duplicate values for this index
        const pipeline = [
          {
            $group: {
              _id: {},
              count: { $sum: 1 },
              ids: { $push: '$_id' },
            },
          },
          {
            $match: {
              count: { $gt: 1 },
            },
          },
        ];

        // Build the _id object with each index field
        for (const field of indexFields) {
          pipeline[0].$group._id[field] = `$${field}`;
        }

        // Run the aggregation to find duplicates
        const duplicates = await collection.aggregate(pipeline).toArray();

        if (duplicates.length > 0) {
          console.log(`Found ${duplicates.length} duplicate sets for index ${indexName}`);

          // Process each set of duplicates
          for (const duplicate of duplicates) {
            const duplicateIds = duplicate.ids;
            console.log(`Duplicate set has ${duplicateIds.length} documents`);

            // Keep the first document, modify others
            const keepId = duplicateIds[0];
            const modifyIds = duplicateIds.slice(1);

            // For each document to modify, update the fields to make them unique
            for (const modifyId of modifyIds) {
              const update = {};

              // Build update object
              for (const field of indexFields) {
                const value = duplicate._id[field];
                update[field] = `${value}_DUPLICATE_${modifyId}`;
              }

              // Apply update
              await collection.updateOne(
                { _id: modifyId },
                { $set: update },
              );

              console.log(`Updated document ${modifyId} to resolve duplicate index value`);
            }
          }
        } else {
          console.log(`No duplicates found for index ${indexName}`);
        }
      }
    }

    console.log('Index fixes completed successfully');
  } catch (error) {
    console.error('Error fixing indexes:', error);
  } finally {
    // Close the MongoDB connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// Run the function if this script is executed directly
if (require.main === module) {
  fixIndexes()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error in fix script:', error);
      process.exit(1);
    });
}

export default fixIndexes;
