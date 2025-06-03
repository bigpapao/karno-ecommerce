import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';
import { normalizePhoneNumber } from './phoneUtils.js';

// Load environment variables
dotenv.config();

/**
 * This script fixes duplicate phone numbers in the database
 * It normalizes phone numbers and then merges or updates records as needed
 */
const fixDuplicatePhones = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    // Track normalized phones
    const phoneMap = {};
    const duplicates = [];

    // First pass - find duplicates
    for (const user of users) {
      if (user.phone) {
        const normalizedPhone = normalizePhoneNumber(user.phone);

        if (normalizedPhone !== user.phone) {
          console.log(`User ${user._id}: Phone ${user.phone} normalized to ${normalizedPhone}`);
        }

        if (phoneMap[normalizedPhone]) {
          duplicates.push({
            normalizedPhone,
            users: [phoneMap[normalizedPhone], user._id],
          });
        } else {
          phoneMap[normalizedPhone] = user._id;
        }
      }
    }

    console.log(`Found ${duplicates.length} duplicate phones`);

    // Process duplicates
    for (const dup of duplicates) {
      console.log(`Processing duplicate: ${dup.normalizedPhone}`);

      // Get both users
      const user1 = await User.findById(dup.users[0]);
      const user2 = await User.findById(dup.users[1]);

      // Decide which user to keep (the one with more info or older account)
      let keepUser; let
        removeUser;

      // Simple heuristic: keep the user with more fields filled in
      const user1Score = countFilledFields(user1);
      const user2Score = countFilledFields(user2);

      if (user1Score >= user2Score) {
        keepUser = user1;
        removeUser = user2;
      } else {
        keepUser = user2;
        removeUser = user1;
      }

      console.log(`Keeping user ${keepUser._id}, removing ${removeUser._id}`);

      // Merge data if needed (e.g., merge orders, addresses, etc.)
      // This would need customization based on your data model

      // Update the phone on the keeper
      keepUser.phone = dup.normalizedPhone;
      await keepUser.save();

      // Either delete the duplicate or mark it as merged
      // await removeUser.remove(); // For deletion

      // For marking as merged:
      removeUser.phone = `MERGED_${dup.normalizedPhone}`;
      removeUser.status = 'merged';
      removeUser.mergedInto = keepUser._id;
      await removeUser.save();
    }

    // Update all phone numbers to normalized format
    let updatedCount = 0;
    for (const user of users) {
      if (user.phone && !user.phone.startsWith('MERGED_')) {
        const normalizedPhone = normalizePhoneNumber(user.phone);
        if (normalizedPhone !== user.phone) {
          user.phone = normalizedPhone;
          await user.save();
          updatedCount++;
        }
      }
    }

    console.log(`Updated ${updatedCount} phone numbers to normalized format`);
    console.log('Duplicate phone fixes completed successfully');
  } catch (error) {
    console.error('Error fixing duplicate phones:', error);
  } finally {
    // Close the MongoDB connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

/**
 * Helper to count filled fields in a user document
 * @param {Object} user - User document
 * @returns {number} Number of filled fields
 */
const countFilledFields = (user) => {
  let count = 0;
  if (user.firstName) count++;
  if (user.lastName) count++;
  if (user.email) count++;
  if (user.phoneVerified) count += 2;
  if (user.isEmailVerified) count += 2;
  if (user.address) count += 3;
  if (user.lastLogin) count++;
  return count;
};

// Run the function if this script is executed directly
if (require.main === module) {
  fixDuplicatePhones()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error in fix script:', error);
      process.exit(1);
    });
}

export default fixDuplicatePhones;
