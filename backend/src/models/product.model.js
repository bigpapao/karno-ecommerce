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
    
    // Enhanced OEM and part identification
    oemCodes: [{
      code: {
        type: String,
        required: true,
        trim: true
      },
      manufacturer: String,     // Original equipment manufacturer
      type: {
        type: String,
        enum: ['original', 'aftermarket', 'compatible'],
        default: 'compatible'
      },
      verified: {
        type: Boolean,
        default: false
      }
    }],
    
    // Alternative part numbers and cross-references
    crossReferences: [{
      brand: String,
      partNumber: String,
      compatibilityLevel: {
        type: String,
        enum: ['exact', 'functional', 'upgrade', 'downgrade'],
        default: 'functional'
      },
      notes: String
    }],
    
    // Warranty information
    warranty: {
      duration: {
        value: Number,        // Duration value
        unit: {
          type: String,
          enum: ['روز', 'ماه', 'سال', 'کیلومتر'],
          default: 'ماه'
        }
      },
      type: {
        type: String,
        enum: ['محدود', 'کامل', 'تولیدکننده', 'فروشنده', 'بدون ضمانت'],
        default: 'محدود'
      },
      coverage: [{
        type: String,
        enum: ['نقص ساخت', 'عملکرد', 'مواد', 'نصب', 'همه موارد']
      }],
      conditions: [String],  // Warranty conditions
      voidConditions: [String], // What voids warranty
      registrationRequired: {
        type: Boolean,
        default: false
      },
      transferable: {
        type: Boolean,
        default: true
      }
    },
    
    // Installation and maintenance information
    installation: {
      difficulty: {
        type: String,
        enum: ['آسان', 'متوسط', 'سخت', 'حرفه‌ای'],
        default: 'متوسط'
      },
      estimatedTime: {
        min: Number,  // Minutes
        max: Number
      },
      toolsRequired: [String],
      specialSkills: [String],
      warnings: [String],
      instructions: {
        text: String,
        video: String,
        pdf: String
      },
      professionalRequired: {
        type: Boolean,
        default: false
      }
    },
    
    // Part condition and quality
    condition: {
      type: {
        type: String,
        enum: ['نو', 'نو در بسته', 'بازسازی شده', 'دست دوم', 'آسیب دیده'],
        default: 'نو'
      },
      grade: {
        type: String,
        enum: ['A+', 'A', 'B+', 'B', 'C'],
        default: 'A'
      },
      notes: String,
      testedBy: String,
      testDate: Date,
      defects: [String]
    },
    
    // Quality and certification information
    quality: {
      certifications: [{
        name: String,        // e.g., 'ISO 9001', 'CE', 'DOT'
        number: String,
        issuer: String,
        validUntil: Date
      }],
      standards: [String],   // Industry standards met
      testReports: [{
        type: String,
        date: Date,
        result: String,
        laboratory: String,
        documentUrl: String
      }],
      qualityScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 75
      }
    },
    
    // Lifecycle and maintenance
    lifecycle: {
      manufactureDate: Date,
      expiryDate: Date,
      shelfLife: {
        value: Number,
        unit: {
          type: String,
          enum: ['روز', 'ماه', 'سال'],
          default: 'سال'
        }
      },
      maintenanceSchedule: [{
        interval: {
          value: Number,
          unit: String // کیلومتر، ماه، سال
        },
        description: String,
        required: Boolean
      }]
    },
    
    // Supplier and sourcing information
    supplier: {
      name: String,
      country: String,
      reliability: {
        type: Number,
        min: 0,
        max: 100,
        default: 80
      },
      leadTime: Number,      // Days
      minimumOrder: Number,
      contact: {
        email: String,
        phone: String,
        website: String
      }
    },
    
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
        make: String,
        // Enhanced compatibility information
        compatibility: {
          type: String,
          enum: ['perfect', 'good', 'partial', 'with_modification'],
          default: 'good'
        },
        notes: String,
        verifiedBy: String,
        lastVerified: Date
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
    
    // Enhanced metadata
    metadata: {
      tags: [String],
      keywords: [String],
      searchTerms: [String],
      popularity: {
        views: { type: Number, default: 0 },
        purchases: { type: Number, default: 0 },
        searches: { type: Number, default: 0 },
        score: { type: Number, default: 0 }
      },
      seo: {
        title: String,
        description: String,
        keywords: String
      }
    }
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

// Add indexes (existing ones plus new ones)
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

// New indexes for enhanced fields
productSchema.index({ 'oemCodes.code': 1 }, { name: 'product_oem_codes_idx' });
productSchema.index({ 'crossReferences.partNumber': 1 }, { name: 'product_cross_ref_idx' });
productSchema.index({ 'installation.difficulty': 1 }, { name: 'product_installation_difficulty_idx' });
productSchema.index({ 'condition.type': 1 }, { name: 'product_condition_idx' });
productSchema.index({ 'quality.qualityScore': -1 }, { name: 'product_quality_score_idx' });
productSchema.index({ 'metadata.tags': 1 }, { name: 'product_tags_idx' });
productSchema.index({ 'metadata.popularity.score': -1 }, { name: 'product_popularity_idx' });

// Compound indexes for complex queries
productSchema.index({ 
  category: 1, 
  'compatibleVehicles.modelId': 1, 
  'installation.difficulty': 1 
}, { name: 'product_category_vehicle_difficulty_idx' });

productSchema.index({ 
  brand: 1, 
  'condition.type': 1, 
  price: 1 
}, { name: 'product_brand_condition_price_idx' });

productSchema.index({ 
  'metadata.tags': 1, 
  rating: -1, 
  stock: 1 
}, { name: 'product_tags_rating_stock_idx' });

const Product = mongoose.model('Product', productSchema);

export default Product;
