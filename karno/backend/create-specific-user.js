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

async function createUser() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Create a direct connection to the User collection
    const User = mongoose.model('User', new mongoose.Schema({
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
      password: String,
      role: String,
      firebaseUid: String,
      cart: Array,
      wishlist: Array,
      addresses: Array,
      orderHistory: Array,
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    }));

    // First check if user already exists
    const existingUser = await User.findOne({ email: 'vahid244@gmail.com' });

    if (existingUser) {
      console.log('User already exists in database:', existingUser._id);
      await mongoose.disconnect();
      return;
    }

    // Get Firebase UID for this email
    let firebaseUid = null;

    if (firebaseInitialized) {
      try {
        const userRecord = await getAuth().getUserByEmail('vahid244@gmail.com');
        firebaseUid = userRecord.uid;
        console.log('Found Firebase user with UID:', firebaseUid);
      } catch (error) {
        console.log('Could not find Firebase user:', error.message);
      }
    }

    if (!firebaseUid) {
      console.error('Cannot create user without Firebase UID. Please register in Firebase first.');
      await mongoose.disconnect();
      return;
    }

    // Create new user
    const newUser = new User({
      firstName: 'Vahid',
      lastName: 'User',
      email: 'vahid244@gmail.com',
      phone: '+989123456789',
      password: '$2a$10$XQCilHY1mWQJfzMrOzJOZu7aBJzH.z3eCJDB9JB.Nf7IUfkAw4G2e', // Hashed password for '12345678'
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

createUser();
