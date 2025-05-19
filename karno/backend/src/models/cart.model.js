import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
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
    default: 1,
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

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [cartItemSchema],
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total price cannot be negative'],
    },
    totalItems: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total items cannot be negative'],
    },
    // Session ID for guest carts (can be null for logged-in users)
    sessionId: {
      type: String,
      sparse: true, // Allow null values
      index: true,  // Index for faster lookups
    },
    // Promo code applied to the cart
    promoCode: {
      type: String,
      default: null,
    },
    // Time when cart will expire (useful for guest carts)
    expiresAt: {
      type: Date,
      default: function() {
        // Set default expiration to 7 days from now
        const now = new Date();
        return new Date(now.setDate(now.getDate() + 7));
      },
      index: { expires: 0 }, // TTL index for automatic removal
    },
  },
  {
    timestamps: true,
  },
);

// Method to recalculate total price
cartSchema.methods.recalculateCart = function() {
  this.totalPrice = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  this.totalItems = this.items.reduce((total, item) => {
    return total + item.quantity;
  }, 0);
  
  return this;
};

// Pre-save hook to ensure totals are calculated
cartSchema.pre('save', function(next) {
  this.recalculateCart();
  next();
});

const Cart = mongoose.model('Cart', cartSchema);

export default Cart; 