import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from './src/config/database.js';

async function updateUserPassword() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Create a direct connection to the User collection
    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      password: String,
    }));

    // Find the user
    const user = await User.findOne({ email: 'vahid244@gmail.com' });

    if (!user) {
      console.log('User not found in database');
      await mongoose.disconnect();
      return;
    }

    console.log('User found:', user._id);

    // Generate a proper password hash
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash('12345678', salt);

    // Update the user's password
    user.password = passwordHash;
    await user.save();

    console.log('Password updated successfully');
    console.log('User can now log in with password: 12345678');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

updateUserPassword();
