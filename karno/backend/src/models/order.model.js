import mongoose from 'mongoose';

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

// Enhanced shipping address schema
const shippingAddressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    validate: {
      validator(v) {
        // Validate Iranian phone number format (with or without leading zero)
        return /^(0?9\d{9})$/.test(v);
      },
      message: 'Invalid phone number format',
    },
  },
  address: {
    type: String,
    required: [true, 'Street address is required'],
  },
  city: {
    type: String,
    required: [true, 'City is required'],
  },
  state: {
    type: String,
    required: [true, 'State/Province is required'],
  },
  zipCode: {
    type: String,
    required: [true, 'Postal/ZIP code is required'],
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
  },
  addressType: {
    type: String,
    enum: ['home', 'work', 'other'],
    default: 'home',
  },
  additionalInfo: String,
  // Reference to the user's saved address (if applicable)
  addressRef: {
    type: mongoose.Schema.Types.ObjectId,
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
    shippingAddress: shippingAddressSchema,
    shippingOption: {
      type: String,
      required: true,
      enum: ['standard', 'express', 'same_day'],
      default: 'standard',
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['stripe', 'paypal', 'credit_card', 'cash', 'zarinpal'],
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
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: Date,
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: Date,
    trackingNumber: String,
    notes: String,
    promoCodeApplied: String,
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, 'Discount amount cannot be negative'],
    },
    estimatedDeliveryDate: Date,
  },
  {
    timestamps: true,
  },
);

// Pre-save hook to set estimated delivery date based on shipping option
orderSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('shippingOption')) {
    const today = new Date();
    
    switch (this.shippingOption) {
      case 'same_day':
        // Same day (if ordered before 12 PM)
        this.estimatedDeliveryDate = new Date(today);
        break;
      case 'express':
        // 1-2 business days
        const expressDelivery = new Date(today);
        expressDelivery.setDate(today.getDate() + 2);
        this.estimatedDeliveryDate = expressDelivery;
        break;
      case 'standard':
      default:
        // 3-5 business days
        const standardDelivery = new Date(today);
        standardDelivery.setDate(today.getDate() + 5);
        this.estimatedDeliveryDate = standardDelivery;
        break;
    }
  }
  
  next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
