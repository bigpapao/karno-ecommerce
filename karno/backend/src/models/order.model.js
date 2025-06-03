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
}, { _id: true });

// Enhanced shipping address schema
const shippingAddressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
  },
  firstName: String, // For backward compatibility
  lastName: String, // For backward compatibility
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
  email: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: [true, 'Street address is required'],
  },
  city: {
    type: String,
    required: [true, 'City is required'],
  },
  state: String, // New field
  province: String, // Old field (for backward compatibility)
  postalCode: String, // Old field
  zipCode: String, // New field
  country: {
    type: String,
    default: 'IR',
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

const guestInfoSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
}, { _id: false });

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    trackingCode: {
      type: String,
      required: true,
      unique: true,
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
      enum: ['zarinpal', 'cod', 'bank_transfer'],
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
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
    guestInfo: guestInfoSchema,
  },
  {
    timestamps: true,
  },
);

// Pre-save hook to set estimated delivery date based on shipping option
orderSchema.pre('save', function (next) {
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

// Index for faster lookup
orderSchema.index({ user: 1, createdAt: -1 });
// orderSchema.index({ orderNumber: 1 });
// orderSchema.index({ trackingCode: 1 });
orderSchema.index({ 'guestInfo.email': 1, 'guestInfo.phone': 1 });
orderSchema.index({ status: 1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
