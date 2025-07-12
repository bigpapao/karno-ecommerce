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
    // Automotive-specific fields
    partType: {
      type: String,
      enum: [
        'engine',
        'brake',
        'electrical',
        'suspension',
        'steering',
        'fuel',
        'cooling',
        'body',
        'interior',
        'transmission',
        'accessories',
        'consumables',
        'condition'
      ],
      trim: true,
    },
    vehicleCategory: [{
      type: String,
      enum: [
        'sedan',
        'hatchback', 
        'crossover',
        'suv',
        'pickup',
        'coupe',
        'convertible',
        'wagon',
        'commercial',
        'motorcycle'
      ],
      trim: true,
    }],
    isAutomotiveSpecific: {
      type: Boolean,
      default: true,
    },
    compatibilityLevel: {
      type: String,
      enum: ['universal', 'brand-specific', 'model-specific', 'year-specific'],
      default: 'universal',
    },
    // Category metadata
    installationDifficulty: {
      type: String,
      enum: ['easy', 'medium', 'professional'],
      default: 'medium',
    },
    maintenanceFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'seasonal', 'annual', 'as-needed'],
    },
    criticalityLevel: {
      type: String,
      enum: ['safety-critical', 'performance-critical', 'comfort', 'aesthetic'],
      default: 'performance-critical',
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

// Add new automotive-specific indexes
categorySchema.index({ partType: 1 }, { name: 'category_part_type_idx' });
categorySchema.index({ vehicleCategory: 1 }, { name: 'category_vehicle_category_idx' });
categorySchema.index({ compatibilityLevel: 1 }, { name: 'category_compatibility_level_idx' });
categorySchema.index({ isAutomotiveSpecific: 1 }, { name: 'category_automotive_specific_idx' });
categorySchema.index({ criticalityLevel: 1 }, { name: 'category_criticality_level_idx' });

// Virtual for child categories
categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
});

// Virtual for products count in this category
categorySchema.virtual('productsCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
  count: true,
});

const Category = mongoose.model('Category', categorySchema);

export default Category;
