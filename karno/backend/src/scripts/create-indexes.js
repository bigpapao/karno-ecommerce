#!/usr/bin/env node

/**
 * Database Index Creation Script
 *
 * This script creates all database indexes defined in the database-indexes.js utility.
 * It can be run manually to ensure indexes are properly created, or on application startup.
 *
 * Usage:
 *   node create-indexes.js
 */

import 'dotenv/config';
import { createAllIndexes, getIndexInfo } from '../utils/database-indexes.js';
import { connectDB } from '../config/database.js';
import { logger } from '../utils/logger.js';

const createIndexes = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    logger.info('Connected to MongoDB, starting index creation');

    // Create all indexes
    const result = await createAllIndexes();
    
    if (result.success) {
      logger.info('Successfully created all database indexes');
      
      // Get and display index information
      const indexInfo = await getIndexInfo();
      if (indexInfo.success) {
        logger.info('Index information:', { indexInfo: indexInfo.data });
      }
    } else {
      logger.error('Failed to create indexes:', result.error);
    }
    
    process.exit(0);
  } catch (error) {
    logger.error({
      message: 'Error running index creation script',
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

// Run the function
createIndexes(); 