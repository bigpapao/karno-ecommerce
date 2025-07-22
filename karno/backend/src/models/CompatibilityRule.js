import mongoose from 'mongoose';

const compatibilityRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'نام قانون سازگاری الزامی است'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Rule type for different matching strategies
  ruleType: {
    type: String,
    enum: ['exact', 'range', 'pattern', 'custom', 'universal'],
    required: true,
    default: 'exact'
  },
  
  // Priority for rule application (higher = more priority)
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 100
  },
  
  // Vehicle matching criteria
  vehicleCriteria: {
    // Specific manufacturer IDs
    manufacturers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Manufacturer'
    }],
    
    // Specific vehicle model IDs
    models: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VehicleModel'
    }],
    
    // Year range matching
    yearRange: {
      start: Number,
      end: Number
    },
    
    // Engine specifications
    engineCriteria: {
      displacement: {
        min: Number,  // in cc
        max: Number
      },
      type: [String], // ['بنزین', 'دیزل', etc.]
      power: {
        min: Number,  // in hp
        max: Number
      }
    },
    
    // Vehicle categories
    categories: [{
      type: String,
      enum: ['سدان', 'هاچبک', 'کراس‌اوور', 'شاسی‌بلند', 'وانت', 'کوپه']
    }],
    
    // Market segment
    marketSegments: [{
      type: String,
      enum: ['اقتصادی', 'متوسط', 'لوکس', 'اسپرت', 'تجاری', 'خانوادگی']
    }],
    
    // Custom attributes for flexible matching
    customAttributes: [{
      key: String,
      value: mongoose.Schema.Types.Mixed,
      operator: {
        type: String,
        enum: ['equals', 'contains', 'startsWith', 'endsWith', 'regex', 'gt', 'lt', 'gte', 'lte', 'in', 'nin'],
        default: 'equals'
      }
    }]
  },
  
  // Product/Part matching criteria
  partCriteria: {
    // Specific product IDs
    products: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    
    // Category matching
    categories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    }],
    
    // Brand matching
    brands: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand'
    }],
    
    // Part specifications
    specifications: [{
      name: String,
      value: mongoose.Schema.Types.Mixed,
      operator: {
        type: String,
        enum: ['equals', 'contains', 'startsWith', 'endsWith', 'regex', 'gt', 'lt', 'gte', 'lte', 'in', 'nin'],
        default: 'equals'
      }
    }],
    
    // OEM codes or part numbers
    oemCodes: [String],
    
    // Custom part attributes
    customAttributes: [{
      key: String,
      value: mongoose.Schema.Types.Mixed,
      operator: {
        type: String,
        enum: ['equals', 'contains', 'startsWith', 'endsWith', 'regex', 'gt', 'lt', 'gte', 'lte', 'in', 'nin'],
        default: 'equals'
      }
    }]
  },
  
  // Compatibility result
  compatibility: {
    // Compatibility level
    level: {
      type: String,
      enum: ['perfect', 'high', 'medium', 'low', 'incompatible'],
      default: 'medium'
    },
    
    // Confidence score (0-100)
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 80
    },
    
    // Installation difficulty
    installationDifficulty: {
      type: String,
      enum: ['آسان', 'متوسط', 'سخت', 'حرفه‌ای'],
      default: 'متوسط'
    },
    
    // Notes and warnings
    notes: String,
    warnings: [String],
    
    // Required modifications
    modifications: [{
      description: String,
      required: { type: Boolean, default: false },
      cost: { type: String, enum: ['کم', 'متوسط', 'زیاد'] }
    }]
  },
  
  // Rule validation and testing
  validation: {
    // Test cases for rule validation
    testCases: [{
      vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VehicleModel'
      },
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      expectedResult: {
        type: String,
        enum: ['match', 'no-match']
      },
      actualResult: {
        type: String,
        enum: ['match', 'no-match']
      },
      lastTested: Date
    }],
    
    // Rule performance metrics
    metrics: {
      totalTests: { type: Number, default: 0 },
      successfulMatches: { type: Number, default: 0 },
      falsePositives: { type: Number, default: 0 },
      falseNegatives: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 }
    }
  },
  
  // Rule status and lifecycle
  status: {
    type: String,
    enum: ['draft', 'testing', 'active', 'deprecated', 'disabled'],
    default: 'draft'
  },
  
  // Versioning for rule updates
  version: {
    type: String,
    default: '1.0.0'
  },
  
  // Rule application scope
  scope: {
    type: String,
    enum: ['global', 'category', 'brand', 'model'],
    default: 'global'
  },
  
  // Tags for organization
  tags: [String],
  
  // Created and managed by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Approval workflow
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  
  // Rule expiration (optional)
  expiresAt: Date,
  
  // Usage statistics
  usageStats: {
    timesApplied: { type: Number, default: 0 },
    lastUsed: Date,
    avgResponseTime: { type: Number, default: 0 } // in milliseconds
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
compatibilityRuleSchema.index({ status: 1, priority: -1 });
compatibilityRuleSchema.index({ ruleType: 1 });
compatibilityRuleSchema.index({ scope: 1 });
compatibilityRuleSchema.index({ 'vehicleCriteria.manufacturers': 1 });
compatibilityRuleSchema.index({ 'vehicleCriteria.models': 1 });
compatibilityRuleSchema.index({ 'partCriteria.categories': 1 });
compatibilityRuleSchema.index({ 'partCriteria.brands': 1 });
compatibilityRuleSchema.index({ tags: 1 });
compatibilityRuleSchema.index({ createdAt: -1 });

// Compound indexes for complex queries
compatibilityRuleSchema.index({ 
  status: 1, 
  priority: -1, 
  ruleType: 1 
});

compatibilityRuleSchema.index({ 
  'vehicleCriteria.yearRange.start': 1, 
  'vehicleCriteria.yearRange.end': 1 
});

// Static method to find applicable rules for a vehicle-part combination
compatibilityRuleSchema.statics.findApplicableRules = async function(vehicleId, productId) {
  // This method will be implemented to find and apply compatibility rules
  // based on the vehicle and product characteristics
  return this.find({
    status: 'active',
    $or: [
      { 'vehicleCriteria.models': vehicleId },
      { scope: 'global' }
    ]
  }).sort({ priority: -1 });
};

// Instance method to evaluate compatibility
compatibilityRuleSchema.methods.evaluateCompatibility = function(vehicle, product) {
  // This method will implement the actual compatibility evaluation logic
  // based on the rule criteria and return a compatibility result
  
  const result = {
    isCompatible: false,
    confidence: 0,
    level: 'incompatible',
    notes: '',
    warnings: []
  };
  
  // Implementation will be added based on rule type and criteria
  
  return result;
};

// Pre-save hook to validate rule logic
compatibilityRuleSchema.pre('save', function(next) {
  // Validate that at least one vehicle criteria is specified
  const hasVehicleCriteria = 
    this.vehicleCriteria.manufacturers?.length > 0 ||
    this.vehicleCriteria.models?.length > 0 ||
    this.vehicleCriteria.categories?.length > 0 ||
    this.scope === 'global';
  
  if (!hasVehicleCriteria) {
    return next(new Error('At least one vehicle criteria must be specified'));
  }
  
  next();
});

export default mongoose.model('CompatibilityRule', compatibilityRuleSchema); 