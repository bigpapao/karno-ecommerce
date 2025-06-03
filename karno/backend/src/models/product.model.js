import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    discountPrice: {
      type: Number,
      min: [0, 'Discount price cannot be negative'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
    },
    stock: {
      type: Number,
      required: [true, 'Product stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    images: [
      {
        url: String,
        alt: String,
      },
    ],
    featured: {
      type: Boolean,
      default: false,
    },
    specifications: [
      {
        name: String,
        value: String,
      },
    ],
    compatibleVehicles: [
      {
        modelId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'VehicleModel'
        },
        manufacturer: String,
        model: String,
        year: String,
        // Keep backward compatibility
        make: String
      },
    ],
    reviews: [reviewSchema],
    rating: {
      type: Number,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
    },
    weight: {
      type: Number,
      default: 0,
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Calculate average rating when reviews are modified
productSchema.pre('save', function (next) {
  if (this.reviews.length > 0) {
    this.rating = this.reviews.reduce((acc, review) => acc + review.rating, 0)
      / this.reviews.length;
    this.numReviews = this.reviews.length;
  }
  next();
});

// Add indexes
productSchema.index({ name: 1 }, { name: 'product_name_idx' });
productSchema.index({ slug: 1 }, { name: 'product_slug_idx', unique: true });
productSchema.index({ category: 1 }, { name: 'product_category_idx' });
productSchema.index({ brand: 1 }, { name: 'product_brand_idx' });
productSchema.index({ price: 1 }, { name: 'product_price_idx' });
productSchema.index({ stock: 1 }, { name: 'product_stock_idx' });
productSchema.index({ featured: 1 }, { name: 'product_featured_idx' });
productSchema.index({ sku: 1 }, { name: 'product_sku_idx', unique: true });
productSchema.index({ createdAt: -1 }, { name: 'product_created_at_idx' });
productSchema.index({ rating: -1 }, { name: 'product_rating_idx' });
productSchema.index({ 'compatibleVehicles.modelId': 1 }, { name: 'product_compatible_vehicles_idx' });

const Product = mongoose.model('Product', productSchema);

export default Product;
