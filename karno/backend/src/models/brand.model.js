import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
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
    country: String,
    website: String,
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Add indexes (keep only essential ones)
brandSchema.index({ name: 1 }, { name: 'brand_name_idx', unique: true });
brandSchema.index({ slug: 1 }, { name: 'brand_slug_idx', unique: true });
brandSchema.index({ featured: 1 }, { name: 'brand_featured_idx' });
brandSchema.index({ order: 1 }, { name: 'brand_order_idx' });

const Brand = mongoose.model('Brand', brandSchema);

export default Brand;
