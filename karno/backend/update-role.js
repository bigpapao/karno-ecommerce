import mongoose from 'mongoose';
import 'dotenv/config';

// User Schema (simplified version of your actual schema)
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  phone: String,
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
});

// Create model
const User = mongoose.model('User', userSchema);

// Function to update role
async function updateUserRole(email, newRole) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test');
    console.log('Connected to MongoDB');

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      console.error(`User with email ${email} not found`);
      return;
    }

    // Update role
    user.role = newRole;
    await user.save();

    console.log(`User ${email} role updated to ${newRole}`);

    // Print updated user info
    console.log('Updated user:', user);
  } catch (error) {
    console.error('Error updating user role:', error.message);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Get email and new role from command line arguments
const email = process.argv[2];
const newRole = process.argv[3];

if (!email || !newRole) {
  console.error('Usage: node update-role.js <email> <newRole>');
  process.exit(1);
}

// Execute the update
updateUserRole(email, newRole);
