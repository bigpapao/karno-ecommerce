import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  eventType: {
    type: String,
    enum: ['view', 'add_to_cart', 'purchase', 'search'],
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  searchQuery: {
    type: String,
    sparse: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    sparse: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  referrer: String,
  sessionId: {
    type: String,
  },
  metadata: {
    type: Object,
    default: {},
  },
}, {
  timestamps: true,
});

// Compound indexes for efficient querying
eventSchema.index({ userId: 1, eventType: 1, timestamp: -1 });
eventSchema.index({ productId: 1, eventType: 1, timestamp: -1 });

const Event = mongoose.model('Event', eventSchema);

export default Event;
