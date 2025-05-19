import 'dotenv/config';
import mongoose from 'mongoose';
import { getAuth } from 'firebase-admin/auth';
import User from './src/models/user.model.js';
import { connectDB } from './src/config/database.js';

async function createUser() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // First check if user already exists
    const existingUser = await User.findOne({ email: 'vahid12@gmail.com' });

    if (existingUser) {
      console.log('User already exists in database:', existingUser._id);
      await mongoose.disconnect();
      return;
    }

    // Try to get Firebase UID for this email
    let firebaseUid = null;
    try {
      const userRecord = await getAuth().getUserByEmail('vahid12@gmail.com');
      firebaseUid = userRecord.uid;
      console.log('Found Firebase user with UID:', firebaseUid);
    } catch (error) {
      console.log('Could not find Firebase user:', error.message);
    }

    // Create new user
    const newUser = new User({
      firstName: 'Vahid',
      lastName: 'User',
      email: 'vahid12@gmail.com',
      phone: '+989123456789', // Replace with actual phone if known
      password: 'password123', // This will be hashed by the model
      role: 'buyer',
      firebaseUid,
      cart: [],
      wishlist: [],
      addresses: [],
      orderHistory: [],
    });

    const savedUser = await newUser.save();
    console.log('User created successfully:', savedUser._id);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

createUser();
