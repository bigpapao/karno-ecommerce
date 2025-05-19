import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
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

const Brand = mongoose.model('Brand', brandSchema);

export default Brand;
