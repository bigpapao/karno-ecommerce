import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Category description is required'],
    },
    image: {
      url: String,
      alt: String,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Add indexes (keep only essential ones)
categorySchema.index({ name: 1 }, { name: 'category_name_idx', unique: true });
categorySchema.index({ slug: 1 }, { name: 'category_slug_idx', unique: true });
categorySchema.index({ parent: 1 }, { name: 'category_parent_idx' });
categorySchema.index({ featured: 1 }, { name: 'category_featured_idx' });
categorySchema.index({ order: 1 }, { name: 'category_order_idx' });

// Virtual for child categories
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
});

const Category = mongoose.model('Category', categorySchema);

export default Category;
