// Script to create a product in MongoDB
import mongoose from 'mongoose';
import 'dotenv/config';
import slugify from 'slugify';

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

// Get the Category and Brand models
const categorySchema = new mongoose.Schema({
  name: String,
  slug: String,
  description: String,
  image: { url: String, alt: String },
  featured: Boolean,
});

const brandSchema = new mongoose.Schema({
  name: String,
  slug: String,
  description: String,
  logo: { url: String, alt: String },
  featured: Boolean,
});

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: Number,
  comment: String,
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  discountPrice: Number,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
  stock: { type: Number, required: true, default: 0 },
  images: [{ url: String, alt: String }],
  featured: { type: Boolean, default: false },
  specifications: [{ name: String, value: String }],
  reviews: [reviewSchema],
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  sku: { type: String, required: true, unique: true },
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);
const Brand = mongoose.model('Brand', brandSchema);
const Product = mongoose.model('Product', productSchema);

// Create a product
const createProduct = async () => {
  try {
    await connectDB();

    // Find the Electronics category
    const category = await Category.findOne({ name: 'Electronics' });
    if (!category) {
      console.error('Category "Electronics" not found');
      return;
    }

    // Find the Apple brand
    const brand = await Brand.findOne({ name: 'Apple' });
    if (!brand) {
      console.error('Brand "Apple" not found');
      return;
    }

    console.log('Found category:', category._id.toString());
    console.log('Found brand:', brand._id.toString());

    // Create the product
    const productData = {
      name: 'iPhone 14 Pro',
      slug: slugify('iPhone 14 Pro', { lower: true }),
      description: 'Apple\'s latest flagship smartphone with advanced camera system',
      price: 999.99,
      category: category._id,
      brand: brand._id,
      stock: 50,
      sku: 'APPL-IP14-PRO-128',
      images: [
        {
          url: 'https://via.placeholder.com/500',
          alt: 'iPhone 14 Pro',
        },
      ],
      featured: true,
      specifications: [
        {
          name: 'Storage',
          value: '128GB',
        },
        {
          name: 'Color',
          value: 'Deep Purple',
        },
      ],
    };

    const product = await Product.create(productData);

    console.log('Product created successfully:');
    console.log(JSON.stringify(product, null, 2));

    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error(`Error creating product: ${error.message}`);
    // Close the connection even if there's an error
    await mongoose.connection.close();
  }
};

// Run the function
createProduct();
