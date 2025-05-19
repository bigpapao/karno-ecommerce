import 'dotenv/config';
import fetch from 'node-fetch';

async function testLogin() {
  try {
    console.log('Testing login API...');

    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'vahid244@gmail.com',
        password: '12345678',
      }),
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);

    if (response.ok) {
      console.log('Login successful!');
    } else {
      console.log('Login failed:', data.message || 'Unknown error');
    }
  } catch (error) {
    console.error('Error testing login API:', error.message);
  }
}

testLogin();
