import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';
import { connectDB } from '../config/database.js';
import { logger } from './logger.js';

// Load environment variables
dotenv.config();

// Connect to database
const seedAdmin = async () => {
  try {
    await connectDB();
    logger.info('Connected to MongoDB for admin seeding');

    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@karno.com' });

    if (adminExists) {
      logger.info('Admin user already exists');
      console.log('Admin user already exists with email: admin@karno.com');
      console.log('You can login with:');
      console.log('Email: admin@karno.com');
      console.log('Password: admin123456');
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'Karno',
      email: 'admin@karno.com',
      password: 'admin123456',
      phone: '+989362782272',
      role: 'admin',
    });

    logger.info('Admin user created successfully');
    console.log('Admin user created successfully:');
    console.log('Email: admin@karno.com');
    console.log('Password: admin123456');
    console.log('You can now login to the admin dashboard at: http://localhost:3000/login');

    process.exit(0);
  } catch (error) {
    logger.error(`Error creating admin user: ${error.message}`);
    console.error('Error creating admin user:', error.message);
    process.exit(1);
  }
};

seedAdmin();
