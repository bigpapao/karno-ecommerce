/**
 * Database Index Fixer Utility
 *
 * This script solves both:
 * 1. Duplicate key errors by fixing data inconsistencies (empty/null/duplicate fields)
 * 2. Index conflicts by dropping and recreating indexes with consistent names
 *
 * Usage: node src/utils/fixDatabaseIndexes.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { recreateAllIndexes } from './database-indexes.js';
import { logger } from './logger.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/karno';

    // Remove deprecated options
    const conn = await mongoose.connect(uri);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Fix duplicate key issues in the database
 */
const fixDuplicateKeyErrors = async () => {
  try {
    // Fix User collection issues
    await fixUserDuplicates();

    // Fix Order collection issues
    await fixOrderDuplicates();

    logger.info('Successfully fixed all duplicate key issues');
    return { success: true };
  } catch (error) {
    logger.error(`Error fixing duplicate key errors: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Fix user collection duplicate key issues
 */
const fixUserDuplicates = async () => {
  try {
    const usersCollection = mongoose.connection.collection('users');

    // 1. Fix empty/null phone values
    const emptyPhoneUsers = await usersCollection.find({
      $or: [
        { phone: '' },
        { phone: null },
        { phone: { $exists: false } },
      ],
    }).toArray();

    if (emptyPhoneUsers.length > 0) {
      logger.info(`Found ${emptyPhoneUsers.length} users with empty phone values`);

      for (const user of emptyPhoneUsers) {
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { phone: `placeholder-${user._id.toString()}` } },
        );
      }

      logger.info(`Updated ${emptyPhoneUsers.length} users with placeholder phone values`);
    }

    // 2. Fix duplicate phone numbers
    const phoneValues = await usersCollection.aggregate([
      { $group: { _id: '$phone', count: { $sum: 1 }, ids: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } },
    ]).toArray();

    if (phoneValues.length > 0) {
      logger.info(`Found ${phoneValues.length} duplicate phone numbers`);

      for (const duplicate of phoneValues) {
        logger.info(`Fixing duplicate phone: ${duplicate._id} (${duplicate.count} instances)`);

        // Skip the first document (keep original), update others
        for (let i = 1; i < duplicate.ids.length; i++) {
          await usersCollection.updateOne(
            { _id: duplicate.ids[i] },
            { $set: { phone: `duplicate-${duplicate._id}-${duplicate.ids[i].toString()}` } },
          );
        }
      }

      logger.info('Fixed all duplicate phone numbers');
    }

    // 3. Fix duplicate email values (same approach)
    const emailValues = await usersCollection.aggregate([
      { $match: { email: { $ne: null, $exists: true } } },
      { $group: { _id: '$email', count: { $sum: 1 }, ids: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } },
    ]).toArray();

    if (emailValues.length > 0) {
      logger.info(`Found ${emailValues.length} duplicate email addresses`);

      for (const duplicate of emailValues) {
        logger.info(`Fixing duplicate email: ${duplicate._id} (${duplicate.count} instances)`);

        // Skip the first document (keep original), update others
        for (let i = 1; i < duplicate.ids.length; i++) {
          await usersCollection.updateOne(
            { _id: duplicate.ids[i] },
            { $set: { email: `duplicate-${i}+${duplicate._id}` } },
          );
        }
      }

      logger.info('Fixed all duplicate email addresses');
    }

    return true;
  } catch (error) {
    logger.error(`Error fixing user duplicates: ${error.message}`);
    throw error;
  }
};

/**
 * Fix order collection duplicate key issues
 */
const fixOrderDuplicates = async () => {
  try {
    const ordersCollection = mongoose.connection.collection('orders');

    // 1. Fix null/empty orderNumber values
    const emptyOrderNumbers = await ordersCollection.find({
      $or: [
        { orderNumber: null },
        { orderNumber: '' },
        { orderNumber: { $exists: false } },
      ],
    }).toArray();

    if (emptyOrderNumbers.length > 0) {
      logger.info(`Found ${emptyOrderNumbers.length} orders with null/empty orderNumber values`);

      for (const order of emptyOrderNumbers) {
        await ordersCollection.updateOne(
          { _id: order._id },
          { $set: { orderNumber: `temp-${order._id.toString()}` } },
        );
      }

      logger.info(`Updated ${emptyOrderNumbers.length} orders with placeholder orderNumber values`);
    }

    // 2. Fix duplicate orderNumber values
    const orderNumberValues = await ordersCollection.aggregate([
      { $match: { orderNumber: { $ne: null, $exists: true } } },
      { $group: { _id: '$orderNumber', count: { $sum: 1 }, ids: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } },
    ]).toArray();

    if (orderNumberValues.length > 0) {
      logger.info(`Found ${orderNumberValues.length} duplicate orderNumber values`);

      for (const duplicate of orderNumberValues) {
        logger.info(`Fixing duplicate orderNumber: ${duplicate._id} (${duplicate.count} instances)`);

        // Skip the first document (keep original), update others
        for (let i = 1; i < duplicate.ids.length; i++) {
          await ordersCollection.updateOne(
            { _id: duplicate.ids[i] },
            { $set: { orderNumber: `${duplicate._id}-duplicate-${i}` } },
          );
        }
      }

      logger.info('Fixed all duplicate orderNumber values');
    }

    return true;
  } catch (error) {
    logger.error(`Error fixing order duplicates: ${error.message}`);
    throw error;
  }
};

/**
 * Main function
 */
const main = async () => {
  logger.info('Starting database index fix process');

  try {
    // Connect to the database
    await connectDB();

    // Step 1: Fix duplicate key errors in the data
    const fixResult = await fixDuplicateKeyErrors();

    if (fixResult.success) {
      // Step 2: Recreate all indexes with proper naming
      const indexResult = await recreateAllIndexes();

      // Log the result
      if (indexResult.success) {
        logger.info('✅ Successfully fixed all database inconsistencies and recreated indexes');
      } else {
        logger.error(`⚠️ Fixed duplicate keys but failed to recreate indexes: ${indexResult.error}`);
      }
    } else {
      logger.error(`⚠️ Failed to fix duplicate key errors: ${fixResult.error}`);
    }

    // Close the connection
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');

    process.exit(0);
  } catch (error) {
    logger.error(`❌ Unhandled error in fix process: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
};

// Run the main function
main();
