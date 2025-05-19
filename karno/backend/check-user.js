import 'dotenv/config';
import mongoose from 'mongoose';
import User from './src/models/user.model.js';
import { connectDB } from './src/config/database.js';

async function checkUser() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'vahid244@gmail.com' });

    if (user) {
      console.log('User found:');
      console.log('ID:', user._id);
      console.log('Name:', user.firstName, user.lastName);
      console.log('Email:', user.email);
      console.log('Firebase UID:', user.firebaseUid || 'Not set');
      console.log('Role:', user.role);
    } else {
      console.log('User not found in the database');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUser();
