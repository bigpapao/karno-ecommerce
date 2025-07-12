import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function createWorkingTestUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/karno');
    const { User } = await import('./src/models/index.js');
    
    // Delete any existing test users
    await User.deleteMany({ 
      $or: [
        { phone: '09888888888' },
        { email: 'workingtest@karno.ir' }
      ]
    });
    
    console.log('Deleted any existing test users');
    
    // Create new user - let the User model handle password hashing automatically
    const testUser = new User({
      phone: '09888888888',
      email: 'workingtest@karno.ir',
      firstName: 'Working',
      lastName: 'Test',
      password: 'test123', // This will be hashed by the pre-save hook
      role: 'user',
      isPhoneVerified: true,
      isEmailVerified: true
    });
    
    // Save the user - this triggers the pre-save hook that hashes the password
    await testUser.save();
    
    console.log('✅ Working test user created successfully!');
    console.log('📱 Phone: 09888888888');
    console.log('🔑 Password: test123');
    console.log('📧 Email: workingtest@karno.ir');
    
    // Test password verification using the model's comparePassword method
    const isPasswordValid = await testUser.comparePassword('test123', testUser.password);
    console.log('🔐 Password verification test:', isPasswordValid ? '✅ VALID' : '❌ INVALID');
    
    // Test user lookup
    const foundUser = await User.findOne({ phone: '09888888888' });
    console.log('👤 User lookup by phone:', foundUser ? '✅ FOUND' : '❌ NOT FOUND');
    
    if (foundUser && isPasswordValid) {
      console.log('\n🎉 SUCCESS! Test user is ready for login testing!');
      console.log('   Phone: 09888888888');
      console.log('   Password: test123');
      console.log('\n🔧 This user uses the same password hashing as the auth system!');
    } else {
      console.log('\n❌ There was an issue with user creation or password verification');
    }
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

createWorkingTestUser(); 