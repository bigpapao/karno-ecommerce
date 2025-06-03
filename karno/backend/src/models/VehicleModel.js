import mongoose from 'mongoose';

const vehicleModelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'نام مدل الزامی است'],
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
  manufacturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manufacturer',
    required: [true, 'تولیدکننده الزامی است']
  },
  year: {
    type: String,
    trim: true
  },
  engine: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['سدان', 'هاچبک', 'کراس‌اوور', 'شاسی‌بلند', 'وانت', 'کوپه'],
    trim: true
  },
  image: {
    type: String,
    default: '/images/models/default-car.jpg'
  },
  description: {
    type: String,
    trim: true
  },
  specifications: {
    engineSize: String,
    power: String,
    transmission: String,
    fuelType: String,
    bodyType: String,
    seatingCapacity: String,
    length: String,
    width: String,
    height: String,
    wheelbase: String
  },
  popular: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Real field to store products count for better performance
  productsCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Keep virtual for backward compatibility
vehicleModelSchema.virtual('productsCountVirtual', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'compatibleVehicles.modelId',
  count: true
});

// Populate manufacturer by default
vehicleModelSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'manufacturer',
    select: 'name nameEn slug logo'
  });
  next();
});

// Index for better performance
vehicleModelSchema.index({ name: 1 });
vehicleModelSchema.index({ slug: 1 });
vehicleModelSchema.index({ manufacturer: 1 });
vehicleModelSchema.index({ category: 1 });
vehicleModelSchema.index({ popular: 1 });
vehicleModelSchema.index({ isActive: 1 });

export default mongoose.model('VehicleModel', vehicleModelSchema); 