// Script to create an order in MongoDB
import mongoose from 'mongoose';
import 'dotenv/config';
import User from './src/models/user.model.js';
import Product from './src/models/product.model.js';

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

// Create the Order schema and model
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative'],
  },
  image: {
    url: String,
    alt: String,
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderItems: [orderItemSchema],
    shippingAddress: {
      fullName: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      zipCode: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['stripe', 'paypal', 'credit_card'],
    },
    paymentResult: {
      id: String,
      status: String,
      update_time: String,
      email_address: String,
    },
    itemsPrice: {
      type: Number,
      required: true,
      min: [0, 'Items price cannot be negative'],
    },
    taxPrice: {
      type: Number,
      required: true,
      min: [0, 'Tax price cannot be negative'],
    },
    shippingPrice: {
      type: Number,
      required: true,
      min: [0, 'Shipping price cannot be negative'],
    },
    totalPrice: {
      type: Number,
      required: true,
      min: [0, 'Total price cannot be negative'],
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true },
);

const Order = mongoose.model('Order', orderSchema);

// Create an order
const createOrder = async () => {
  try {
    await connectDB();

    // Find the admin user
    const user = await User.findOne({ email: 'admin@karno.com' });
    if (!user) {
      console.error('Admin user not found');
      return;
    }

    // Find the iPhone product
    const product = await Product.findOne({ name: 'iPhone 14 Pro' });
    if (!product) {
      console.error('iPhone product not found');
      return;
    }

    console.log('Found user:', user._id.toString());
    console.log('Found product:', product._id.toString());

    // Create the order
    const orderData = {
      user: user._id,
      orderItems: [
        {
          product: product._id,
          name: product.name,
          quantity: 2,
          price: product.price,
          image: product.images && product.images.length > 0 ? product.images[0] : { url: 'https://via.placeholder.com/500', alt: 'iPhone 14 Pro' },
        },
      ],
      shippingAddress: {
        fullName: 'Admin User',
        address: '123 Main St',
        city: 'Tehran',
        state: 'Tehran Province',
        zipCode: '12345',
        country: 'Iran',
        phone: '9123456789',
      },
      paymentMethod: 'credit_card',
      itemsPrice: product.price * 2,
      taxPrice: (product.price * 2) * 0.09,
      shippingPrice: 10.00,
      totalPrice: (product.price * 2) + ((product.price * 2) * 0.09) + 10.00,
      status: 'pending',
    };

    const order = await Order.create(orderData);

    console.log('Order created successfully:');
    console.log(JSON.stringify(order, null, 2));

    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error(`Error creating order: ${error.message}`);
    // Close the connection even if there's an error
    await mongoose.connection.close();
  }
};

// Run the function
createOrder();
