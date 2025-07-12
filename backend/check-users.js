import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/karno');
    const { User } = await import('./src/models/index.js');
    
    const users = await User.find({}).select('phone email firstName lastName role').limit(10);
    console.log('Total users found:', await User.countDocuments({}));
    console.log('\nExisting users:');
    
    if (users.length === 0) {
      console.log('No users found in database');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. Phone: ${user.phone}, Email: ${user.email}, Name: ${user.firstName} ${user.lastName}, Role: ${user.role}`);
      });
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers(); 