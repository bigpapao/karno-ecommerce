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
  // Enhanced year range for better compatibility matching
  yearRange: {
    start: {
      type: Number,
      min: 1950,
      max: new Date().getFullYear() + 5
    },
    end: {
      type: Number,
      min: 1950,
      max: new Date().getFullYear() + 5
    }
  },
  engine: {
    type: String,
    trim: true
  },
  // Multiple engine variants for the same model
  engineVariants: [{
    name: String,           // e.g., "1.6L EF7"
    displacement: String,   // e.g., "1600cc"
    power: String,         // e.g., "110hp"
    torque: String,        // e.g., "150Nm"
    fuelType: {
      type: String,
      enum: ['بنزین', 'دیزل', 'CNG', 'LPG', 'هیبرید', 'برقی']
    },
    transmission: {
      type: String,
      enum: ['دستی', 'اتوماتیک', 'CVT', 'DCT']
    },
    years: String          // Years this variant was available
  }],
  category: {
    type: String,
    enum: ['سدان', 'هاچبک', 'کراس‌اوور', 'شاسی‌بلند', 'وانت', 'کوپه'],
    trim: true
  },
  // Market positioning and target audience
  marketSegment: {
    type: String,
    enum: ['اقتصادی', 'متوسط', 'لوکس', 'اسپرت', 'تجاری', 'خانوادگی'],
    default: 'متوسط'
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
  // Enhanced popularity scoring system
  popularity: {
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    },
    factors: {
      salesVolume: { type: Number, default: 0 },      // Historical sales data
      marketShare: { type: Number, default: 0 },       // % of market share
      searchFrequency: { type: Number, default: 0 },   // How often searched
      partsRequests: { type: Number, default: 0 },     // Parts demand
      userRating: { type: Number, default: 3.5 }       // User satisfaction
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  // Parts availability and market presence
  partsAvailability: {
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 70
    },
    status: {
      type: String,
      enum: ['عالی', 'خوب', 'متوسط', 'ضعیف', 'کمیاب'],
      default: 'متوسط'
    },
    categories: {
      engine: { type: Number, min: 0, max: 100, default: 70 },
      brake: { type: Number, min: 0, max: 100, default: 70 },
      suspension: { type: Number, min: 0, max: 100, default: 70 },
      electrical: { type: Number, min: 0, max: 100, default: 70 },
      bodyParts: { type: Number, min: 0, max: 100, default: 70 },
      interior: { type: Number, min: 0, max: 100, default: 70 },
      filters: { type: Number, min: 0, max: 100, default: 70 }
    },
    suppliers: [{
      name: String,
      reliability: { type: Number, min: 0, max: 100 },
      priceRange: { type: String, enum: ['ارزان', 'متوسط', 'گران'] }
    }],
    lastUpdated: {
      type: Date,
      default: Date.now
    }
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
vehicleModelSchema.index({ manufacturer: 1 });
vehicleModelSchema.index({ category: 1 });
vehicleModelSchema.index({ popular: 1 });
vehicleModelSchema.index({ isActive: 1 });
vehicleModelSchema.index({ marketSegment: 1 });
vehicleModelSchema.index({ 'popularity.score': -1 });
vehicleModelSchema.index({ 'partsAvailability.score': -1 });
vehicleModelSchema.index({ 'yearRange.start': 1, 'yearRange.end': 1 });

export default mongoose.model('VehicleModel', vehicleModelSchema); 