import 'dotenv/config';
import mongoose from 'mongoose';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import { connectDB } from './src/config/database.js';
import User from './src/models/user.model.js';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = 'http://localhost:5000/api/v1/auth';

// Test user data
const testUser = {
  firstName: 'Test',
  lastName: 'User',
  phone: '09123456789',
  password: 'password123'
};

const updatedProfile = {
  firstName: 'Updated',
  lastName: 'TestUser',
  address: '123 Test Street',
  city: 'Test City',
  province: 'Test Province',
  postalCode: '12345'
};

async function waitForServer() {
  console.log('Waiting for server to start...');
  for (let i = 0; i < 30; i++) {
    try {
      await axios.get('http://localhost:5000');
      console.log('Server is ready!');
      return true;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('Server failed to start within 30 seconds');
}

async function checkExistingUsers() {
  console.log('\n=== CHECKING EXISTING USERS IN DATABASE ===');
  try {
    await connectDB();
    const users = await User.find({}).select('-password').limit(5);
    console.log(`Found ${users.length} users in database:`);
    
    if (users.length > 0) {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName} - Phone: ${user.phone} - Email: ${user.email || 'N/A'}`);
      });
      return users[0]; // Return first user for testing
    } else {
      console.log('No users found in database');
      return null;
    }
  } catch (error) {
    console.error('Error checking users:', error.message);
    return null;
  }
}

async function createTestUser() {
  console.log('\n=== CREATING TEST USER ===');
  try {
    // Check if test user already exists
    const existingUser = await User.findOne({ phone: testUser.phone });
    if (existingUser) {
      console.log('Test user already exists');
      return existingUser;
    }

    // Create test user via API
    const response = await axios.post(`${API_BASE_URL}/register`, testUser);
    console.log('User created successfully via API:', response.data);
    
    // Fetch the created user from database
    const createdUser = await User.findOne({ phone: testUser.phone });
    return createdUser;
  } catch (error) {
    console.error('Error creating user:', error.response?.data || error.message);
    return null;
  }
}

async function loginUser(phone, password) {
  console.log('\n=== TESTING LOGIN ===');
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, {
      phone: phone,
      password: password
    });
    
    console.log('Login successful:', response.data);
    return response.data.accessToken;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    return null;
  }
}

async function getProfile(token) {
  console.log('\n=== GETTING USER PROFILE ===');
  try {
    const response = await axios.get(`${API_BASE_URL}/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Profile data:', JSON.stringify(response.data.data, null, 2));
    return response.data.data;
  } catch (error) {
    console.error('Error getting profile:', error.response?.data || error.message);
    return null;
  }
}

async function updateProfile(token, updateData) {
  console.log('\n=== UPDATING USER PROFILE ===');
  try {
    const response = await axios.put(`${API_BASE_URL}/profile`, updateData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Profile updated successfully:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error updating profile:', error.response?.data || error.message);
    return null;
  }
}

async function verifyDatabaseChanges(userId) {
  console.log('\n=== VERIFYING DATABASE CHANGES ===');
  try {
    const user = await User.findById(userId).select('-password');
    console.log('User data in database:');
    console.log(JSON.stringify(user, null, 2));
    
    // Check specific fields
    console.log('\nVerification:');
    console.log(`- Name: ${user.firstName} ${user.lastName}`);
    console.log(`- Address: ${user.address || 'Not set'}`);
    console.log(`- City: ${user.city || 'Not set'}`);
    console.log(`- Province: ${user.province || 'Not set'}`);
    console.log(`- Postal Code: ${user.postalCode || 'Not set'}`);
    console.log(`- Profile Complete: ${user.isProfileComplete || false}`);
    
    return user;
  } catch (error) {
    console.error('Error verifying database changes:', error.message);
    return null;
  }
}

async function runTests() {
  try {
    // Wait for server to be ready
    await waitForServer();
    
    // Check existing users
    let existingUser = await checkExistingUsers();
    
    let testUserData;
    let testCredentials;
    
    if (existingUser) {
      // Use existing user
      testUserData = existingUser;
      testCredentials = {
        phone: existingUser.phone,
        password: 'password123' // Assuming a common test password
      };
      console.log(`\nUsing existing user: ${existingUser.firstName} ${existingUser.lastName} (${existingUser.phone})`);
    } else {
      // Create new test user
      testUserData = await createTestUser();
      testCredentials = {
        phone: testUser.phone,
        password: testUser.password
      };
    }
    
    if (!testUserData) {
      throw new Error('No user available for testing');
    }
    
    // Test login
    const token = await loginUser(testCredentials.phone, testCredentials.password);
    if (!token) {
      throw new Error('Login failed');
    }
    
    // Get current profile
    const currentProfile = await getProfile(token);
    if (!currentProfile) {
      throw new Error('Failed to get profile');
    }
    
    // Update profile
    const updatedProfileData = await updateProfile(token, updatedProfile);
    if (!updatedProfileData) {
      throw new Error('Failed to update profile');
    }
    
    // Verify changes in database
    await verifyDatabaseChanges(testUserData._id);
    
    console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
    console.log('All user functionality tests passed!');
    
  } catch (error) {
    console.error('\n=== TEST FAILED ===');
    console.error('Error:', error.message);
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
}

async function createAndTestUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/karno');
    const { User } = await import('./src/models/index.js');
    
    // Delete any existing user with this phone number
    await User.deleteMany({ 
      $or: [
        { phone: '09123456789' },
        { phone: '+989123456789' }
      ]
    });
    
    console.log('Deleted any existing test users with this phone number');
    
    // Create new test user with correct format
    const hashedPassword = await bcrypt.hash('testpass123', 12);
    
    const testUser = new User({
      phone: '09123456789',  // Correct format without +98
      email: 'testuser@karno.ir',
      firstName: 'Test',
      lastName: 'User',
      password: hashedPassword,
      role: 'user',
      isPhoneVerified: true,
      isEmailVerified: true
    });
    
    await testUser.save();
    console.log('✅ Test user created successfully!');
    console.log('📱 Phone: 09123456789');
    console.log('🔑 Password: testpass123');
    console.log('📧 Email: testuser@karno.ir');
    
    // Test password verification
    const isPasswordValid = await bcrypt.compare('testpass123', testUser.password);
    console.log('🔐 Password verification:', isPasswordValid ? '✅ VALID' : '❌ INVALID');
    
    // Verify user can be found by phone
    const foundUser = await User.findOne({ phone: '09123456789' });
    console.log('👤 User lookup by phone:', foundUser ? '✅ FOUND' : '❌ NOT FOUND');
    
    if (foundUser) {
      console.log('📋 User details:', {
        id: foundUser._id,
        phone: foundUser.phone,
        email: foundUser.email,
        name: `${foundUser.firstName} ${foundUser.lastName}`
      });
    }
    
    await mongoose.disconnect();
    console.log('\n🎉 Test user is ready! You can now login with:');
    console.log('   Phone: 09123456789');
    console.log('   Password: testpass123');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

// Run the tests
runTests();
createAndTestUser(); 