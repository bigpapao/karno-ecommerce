import 'dotenv/config';
import mongoose from 'mongoose';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, cert } from 'firebase-admin/app';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { connectDB } from './src/config/database.js';

// Setup Firebase Admin SDK
let firebaseInitialized = false;

try {
  let firebaseCredential;

  // Option 1: Use JSON content from environment variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    firebaseCredential = cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
    firebaseInitialized = true;
  }
  // Option 2: Use file path from environment variable
  else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const require = createRequire(import.meta.url);
    const fullPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);

    if (fs.existsSync(fullPath)) {
      const serviceAccount = require(fullPath);
      firebaseCredential = cert(serviceAccount);
      firebaseInitialized = true;
    }
  }
  // Fallback for development
  else {
    const require = createRequire(import.meta.url);
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const serviceAccountPath = path.join(__dirname, 'src', 'config', 'karno-4253f-firebase-adminsdk-fbsvc-066a91c22c.json');

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      firebaseCredential = cert(serviceAccount);
      firebaseInitialized = true;
    }
  }

  // Initialize Firebase
  if (firebaseInitialized) {
    initializeApp({
      credential: firebaseCredential,
    });
    console.log('Firebase Admin SDK initialized successfully');
  }
} catch (error) {
  console.error(`Failed to initialize Firebase Admin SDK: ${error.message}`);
}

// Create a user schema directly in this file to avoid model validation issues
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'buyer', 'seller'],
    default: 'buyer',
  },
  firebaseUid: {
    type: String,
    sparse: true,
  },
  cart: {
    type: Array,
    default: [],
  },
  wishlist: {
    type: Array,
    default: [],
  },
  addresses: {
    type: Array,
    default: [],
  },
  orderHistory: {
    type: Array,
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

async function fixUser() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Create the User model using our schema
    const User = mongoose.model('User', userSchema);

    // First check if user already exists
    const existingUser = await User.findOne({ email: 'vahid12@gmail.com' });

    if (existingUser) {
      console.log('User already exists in database:', existingUser._id);
      await mongoose.disconnect();
      return;
    }

    // Get Firebase UID for this email
    let firebaseUid = null;
    let firebaseUser = null;

    if (firebaseInitialized) {
      try {
        firebaseUser = await getAuth().getUserByEmail('vahid12@gmail.com');
        firebaseUid = firebaseUser.uid;
        console.log('Found Firebase user with UID:', firebaseUid);
      } catch (error) {
        console.log('Could not find Firebase user:', error.message);
      }
    }

    if (!firebaseUid) {
      console.error('Cannot create user without Firebase UID');
      await mongoose.disconnect();
      return;
    }

    // Create new user with a secure password
    const securePassword = `${Math.random().toString(36).slice(-10) + Math.random().toString(36).toUpperCase().slice(-2)}!`;

    const newUser = new User({
      firstName: 'Vahid',
      lastName: 'User',
      email: 'vahid12@gmail.com',
      phone: '+989123456789', // Replace with actual phone if known
      password: securePassword, // This is just a placeholder since auth is handled by Firebase
      role: 'buyer',
      firebaseUid,
      cart: [],
      wishlist: [],
      addresses: [],
      orderHistory: [],
    });

    const savedUser = await newUser.save();
    console.log('User created successfully:', savedUser._id);
    console.log('User can now log in with their Firebase credentials');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

fixUser();
