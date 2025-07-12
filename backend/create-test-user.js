import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function createTestUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/karno');
    const { User } = await import('./src/models/index.js');
    
    // Check if test user already exists
    const existingUser = await User.findOne({ phone: '09123456789' });
    
    if (existingUser) {
      console.log('Test user already exists:');
      console.log(`Phone: ${existingUser.phone}`);
      console.log(`Email: ${existingUser.email}`);
      console.log(`Name: ${existingUser.firstName} ${existingUser.lastName}`);
      console.log('Password: testpass123 (if not changed)');
      await mongoose.disconnect();
      return;
    }
    
    // Create new test user
    const hashedPassword = await bcrypt.hash('testpass123', 12);
    
    const testUser = new User({
      firstName: 'Test',
      lastName: 'User',
      phone: '09123456789',
      email: 'testuser@karno.com',
      password: hashedPassword,
      role: 'user',
      isEmailVerified: true,
      isPhoneVerified: true
    });
    
    await testUser.save();
    
    console.log('✅ Test user created successfully!');
    console.log('Login credentials:');
    console.log('Phone: 09123456789');
    console.log('Password: testpass123');
    console.log('Email: testuser@karno.com');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error creating test user:', error);
    await mongoose.disconnect();
  }
}

createTestUser(); 