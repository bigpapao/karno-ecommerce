import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';
import { connectDB } from '../config/database.js';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const createAdminUser = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'vahid@admin.com' });

    if (adminExists) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      firstName: 'Vahid',
      lastName: 'Admin',
      email: 'vahid@admin.com',
      password: '12345678',
      phone: '+989362782272',
      role: 'admin',
    });

    console.log('Admin user created successfully:');
    console.log({
      name: `${admin.firstName} ${admin.lastName}`,
      email: admin.email,
      role: admin.role,
    });

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    process.exit(1);
  }
};

createAdminUser();
