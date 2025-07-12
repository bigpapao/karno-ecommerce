import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function createSimpleTestUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/karno');
    const { User } = await import('./src/models/index.js');
    
    // Delete any existing test users
    await User.deleteMany({ 
      $or: [
        { phone: '09999999999' },
        { email: 'simpletest@karno.ir' }
      ]
    });
    
    console.log('Deleted any existing test users');
    
    // Create new test user with simple credentials
    const password = 'simple123';
    const saltRounds = 10; // Use the same salt rounds as your auth system
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const testUser = new User({
      phone: '09999999999',
      email: 'simpletest@karno.ir',
      firstName: 'Simple',
      lastName: 'Test',
      password: hashedPassword,
      role: 'user',
      isPhoneVerified: true,
      isEmailVerified: true
    });
    
    await testUser.save();
    console.log('✅ Simple test user created successfully!');
    console.log('📱 Phone: 09999999999');
    console.log('🔑 Password: simple123');
    console.log('📧 Email: simpletest@karno.ir');
    
    // Test password verification to make sure it works
    const isPasswordValid = await bcrypt.compare(password, testUser.password);
    console.log('🔐 Password verification test:', isPasswordValid ? '✅ VALID' : '❌ INVALID');
    
    // Test user lookup
    const foundUser = await User.findOne({ phone: '09999999999' });
    console.log('👤 User lookup by phone:', foundUser ? '✅ FOUND' : '❌ NOT FOUND');
    
    if (foundUser && isPasswordValid) {
      console.log('\n🎉 SUCCESS! Test user is ready for login testing!');
      console.log('   Phone: 09999999999');
      console.log('   Password: simple123');
    } else {
      console.log('\n❌ There was an issue with user creation or password verification');
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

createSimpleTestUser(); 