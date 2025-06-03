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
}, { timestamps: true });

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    sessionId: {
      type: String,
    },
    items: [cartItemSchema],
    totalItems: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total items cannot be negative'],
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Total price cannot be negative'],
    },
    promoCode: {
      type: String,
      default: null,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      default() {
        const now = new Date();
        return new Date(now.setDate(now.getDate() + 7));
      },
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
  },
);

// Method to recalculate total price
cartSchema.methods.recalculateCart = function () {
  this.totalPrice = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);

  this.totalItems = this.items.reduce((total, item) => total + item.quantity, 0);

  return this;
};

// Pre-save hook to ensure totals are calculated
cartSchema.pre('save', function (next) {
  if (!this.user && !this.sessionId) {
    next(new Error('Either user or sessionId must be provided'));
  } else {
    this.recalculateCart();
    next();
  }
});

// Add index for looking up carts by user or sessionId
cartSchema.index({ user: 1 });
cartSchema.index({ sessionId: 1 });

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
