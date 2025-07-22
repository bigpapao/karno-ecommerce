import mongoose from 'mongoose';

const manufacturerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'نام تولیدکننده الزامی است'],
    unique: true,
    trim: true
  },
  nameEn: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'اسلاگ الزامی است'],
    unique: true,
    lowercase: true,
    trim: true
  },
  logo: {
    type: String,
    default: '/images/brands/default.png'
  },
  description: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    default: 'Iran',
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for models count
manufacturerSchema.virtual('modelsCount', {
  ref: 'VehicleModel',
  localField: '_id',
  foreignField: 'manufacturer',
  count: true
});

// Index for better performance
// Removed duplicate name and slug indexes since they already have unique: true in schema definitions
manufacturerSchema.index({ isActive: 1 });

export default mongoose.model('Manufacturer', manufacturerSchema); 