// Script to delete a user from MongoDB
import mongoose from 'mongoose';
import 'dotenv/config';

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/karno');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Delete user function
const deleteUser = async (email) => {
  try {
    const connection = await connectDB();

    // Delete the user
    const result = await connection.connection.db.collection('users').deleteOne({ email });

    if (result.deletedCount === 1) {
      console.log(`Successfully deleted user with email: ${email}`);
    } else {
      console.log(`No user found with email: ${email}`);
    }

    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error(`Error deleting user: ${error.message}`);
  }
};

// Delete the admin user
const userEmail = 'admin@karno.com';
deleteUser(userEmail);
