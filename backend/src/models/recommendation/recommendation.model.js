import mongoose from 'mongoose';

const recommendationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sourceProductId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    sparse: true,
  },
  recommendationType: {
    type: String,
    enum: ['collaborative', 'content_based', 'popular', 'hybrid', 'personalized', 'trending'],
    required: true,
  },
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    score: {
      type: Number,
      default: 0,
    },
    reason: String,
  }],
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    sparse: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    expires: 0, // TTL index to automatically delete expired recommendations
  },
});

// Compound index for most common query pattern
recommendationSchema.index({ userId: 1, recommendationType: 1, createdAt: -1 });

const Recommendation = mongoose.model('Recommendation', recommendationSchema);

export default Recommendation;
