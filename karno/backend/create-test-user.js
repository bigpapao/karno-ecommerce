import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

// Get directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamically import User model
const importUserModel = async () => {
  const { default: User } = await import('./src/models/user.model.js');
  return User;
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    return true;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    return false;
  }
};

const createTestUser = async () => {
  try {
    // Connect to database
    const connected = await connectDB();
    if (!connected) {
      console.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Import User model
    const User = await importUserModel();

    // Check if user already exists
    const existingUser = await User.findOne({ phone: '9304314246' });

    if (existingUser) {
      console.log('Test user already exists. Updating password...');

      // Hash password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash('12345678', salt);

      // Update user
      existingUser.password = hashedPassword;
      existingUser.phoneVerified = true;
      await existingUser.save();

      console.log('Test user password updated successfully!');
    } else {
      // Create new test user
      const newUser = new User({
        phone: '9304314246',
        firstName: 'Test',
        lastName: 'User',
        password: '12345678', // Will be hashed by pre-save hook
        phoneVerified: true,
        role: 'user',
      });

      await newUser.save();
      console.log('Test user created successfully!');
    }

    // Display user info
    const user = await User.findOne({ phone: '9304314246' }).select('-password');
    console.log('Test User Details:', JSON.stringify(user, null, 2));
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the function
createTestUser();
