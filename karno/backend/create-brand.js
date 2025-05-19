// Script to create a brand in MongoDB
import mongoose from 'mongoose';
import 'dotenv/config';
import slugify from 'slugify';

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://vahidchaf:YahooVahid79@cluster.x8nqqru.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Create a brand schema
const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Brand name is required'],
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
      required: [true, 'Brand description is required'],
    },
    logo: {
      url: String,
      alt: String,
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Create the Brand model
const Brand = mongoose.model('Brand', brandSchema);

// Create a brand
const createBrand = async () => {
  try {
    await connectDB();

    // Create the brand
    const brandData = {
      name: 'Apple',
      slug: slugify('Apple', { lower: true }),
      description: 'Apple Inc. is an American multinational technology company',
      logo: {
        url: 'https://via.placeholder.com/150',
        alt: 'Apple',
      },
      featured: true,
    };

    const brand = await Brand.create(brandData);

    console.log('Brand created successfully:');
    console.log(brand);

    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error(`Error creating brand: ${error.message}`);
    // Close the connection even if there's an error
    await mongoose.connection.close();
  }
};

// Run the function
createBrand();
