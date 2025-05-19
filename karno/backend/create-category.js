// Script to create a category in MongoDB
import mongoose from 'mongoose';
import 'dotenv/config';
import slugify from 'slugify';

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Create a category schema
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Category description is required'],
    },
    image: {
      url: String,
      alt: String,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
  },
  { timestamps: true },
);

// Create the Category model
const Category = mongoose.model('Category', categorySchema);

// Create a category
const createCategory = async () => {
  try {
    await connectDB();

    // Create the category
    const categoryData = {
      name: 'Electronics',
      slug: slugify('Electronics', { lower: true }),
      description: 'Electronic devices and accessories',
      image: {
        url: 'https://via.placeholder.com/150',
        alt: 'Electronics',
      },
      featured: true,
    };

    const category = await Category.create(categoryData);

    console.log('Category created successfully:');
    console.log(category);

    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error(`Error creating category: ${error.message}`);
    // Close the connection even if there's an error
    await mongoose.connection.close();
  }
};

// Run the function
createCategory();
