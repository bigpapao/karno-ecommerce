import 'dotenv/config';
import fetch from 'node-fetch';

// Note: We're not using Firebase directly in this test script to avoid API key issues
// In a real application, Firebase authentication would be handled by the frontend

// API URL
const API_URL = 'http://localhost:5001/api';

// Test user data - using timestamp to ensure unique email
const timestamp = Date.now();
const testUser = {
  firstName: 'Test',
  lastName: 'User',
  email: `test.user.${timestamp}@example.com`,
  password: 'Test123456!',
  phone: '9123456789', // Iranian format without +98
  role: 'user',
};

// Helper function to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Register a test user directly with the backend
async function testUserRegistration() {
  console.log('=== TESTING USER REGISTRATION ===');
  console.log(`Time: ${new Date().toLocaleString()}`);
  console.log(`Test User Email: ${testUser.email}`);

  try {
    // In a real application, the frontend would handle Firebase authentication
    // and then send the user data to the backend
    console.log('\nRegistering user in backend...');

    // Prepare user data for registration
    const submissionData = {
      ...testUser,
      phone: `+98${testUser.phone}`,
      // Note: In a real app, firebaseUid would be provided by Firebase authentication
      // We're simulating it here with a random string
      firebaseUid: `test-uid-${timestamp}`,
    };

    console.log('Submission data:', {
      ...submissionData,
      password: '********', // Mask password in logs
    });

    // Send registration request to backend
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submissionData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Backend registration failed: ${data.message || 'Unknown error'}`);
    }

    console.log('\nBackend registration successful!');

    // Check if user data was returned
    if (data.data && data.data.user) {
      console.log('User data:', {
        id: data.data.user._id,
        name: `${data.data.user.firstName} ${data.data.user.lastName}`,
        email: data.data.user.email,
        role: data.data.user.role,
      });

      // Verify token was generated
      if (data.data.token) {
        console.log('JWT token was generated successfully');
      } else {
        console.warn('Warning - No JWT token was returned from the backend');
      }
    } else {
      console.warn('Warning - No user data returned from backend');
    }

    console.log('\n=== TEST COMPLETED SUCCESSFULLY ===');
    console.log('\nNOTE: In a real application, the user would now be redirected to the products page');

    return {
      success: true,
      user: data.data?.user,
    };
  } catch (error) {
    console.error('\nTest failed:', error.message);
    console.error('Error details:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Run the test
testUserRegistration()
  .then(() => {
    console.log('\nTest script execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nUnhandled error in test script:', error);
    process.exit(1);
  });
