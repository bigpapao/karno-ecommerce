// Script to generate a JWT token for an existing user
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import 'dotenv/config';
import User from './src/models/user.model.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/karno');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Generate JWT token
const signToken = (id) => {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables');
    return null;
  }

  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Generate token for a user
const generateTokenForUser = async (email) => {
  try {
    await connectDB();

    // Find the user
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`No user found with email: ${email}`);
      return;
    }

    // Generate token
    const token = signToken(user._id);

    if (!token) {
      console.log('Failed to generate token. Check your JWT_SECRET environment variable.');
      return;
    }

    console.log('User found:', {
      _id: user._id,
      email: user.email,
      role: user.role,
      fullName: `${user.firstName} ${user.lastName}`,
    });

    console.log('\nGenerated JWT Token:');
    console.log(token);
    console.log('\nUse this token in your Authorization header:');
    console.log(`Authorization: Bearer ${token}`);

    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error(`Error generating token: ${error.message}`);
  }
};

// Generate token for the admin user
const userEmail = 'admin@karno.com';
generateTokenForUser(userEmail);
