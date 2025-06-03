import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// New address schema for storing multiple addresses
const addressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  zipCode: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  addressType: {
    type: String,
    enum: ['home', 'work', 'other'],
    default: 'home',
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  additionalInfo: String,
}, { _id: true, timestamps: true });

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    email: {
      type: String,
      required: false,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please use a valid email address'],
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    // Profile completion fields
    address: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    province: {
      type: String,
      default: '',
    },
    postalCode: {
      type: String,
      default: '',
    },
    // Verification fields
    mobileVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
    },
    verificationCodeExpires: {
      type: Date,
    },
    // Security and session management
    refreshToken: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
    // New array of addresses
    addresses: [addressSchema],
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    // New verification status field
    verificationStatus: {
      type: String,
      enum: ['unverified', 'phone_verified', 'email_verified', 'fully_verified'],
      default: 'unverified',
    },
    // OAuth connections - for future social logins
    connections: {
      google: {
        id: String,
        token: String,
        email: String,
      },
      // Other providers can be added later
    },
    // For tracking OTP logins
    otpLoginHistory: [
      {
        timestamp: {
          type: Date,
          default: Date.now,
        },
        ipAddress: String,
        userAgent: String,
        device: String,
      },
    ],
    // Password change tracking
    passwordChangedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return `User ${this.phone}`;
});

// Virtual for profile completion check
userSchema.virtual('isProfileComplete').get(function () {
  return !!(
    this.firstName
    && this.lastName
    && this.address
    && this.city
    && this.province
    && this.postalCode
    && this.phone
  );
});

// Add this virtual to the object when converting to JSON
userSchema.set('toJSON', {
  virtuals: true,
  transform: function transform(doc, ret) {
    delete ret.password;
    delete ret.verificationCode;
    delete ret.verificationCodeExpires;
    delete ret.refreshToken;
    return ret;
  },
});

// Hash password before saving (if password exists)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);

    // Update passwordChangedAt when password is modified
    this.passwordChangedAt = new Date(Date.now() - 1000);

    next();
  } catch (error) {
    next(error);
  }
});

// Ensure only one default address
userSchema.pre('save', function (next) {
  if (this.isModified('addresses')) {
    // Check if we're setting a new default
    const hasNewDefault = this.addresses.some((addr) => addr.isDefault && addr.isModified('isDefault'));

    if (hasNewDefault) {
      // If setting a new default, make sure no other address is default
      this.addresses.forEach((addr) => {
        if (!addr.isModified('isDefault') || !addr.isDefault) {
          addr.isDefault = false;
        }
      });
    } else if (this.addresses.length === 1 && this.isNew) {
      // If no default is explicitly set and this is a new address, set the first one as default
      this.addresses[0].isDefault = true;
    }
  }
  next();
});

// Compare passwords
userSchema.methods.comparePassword = async function (enteredPassword, storedPassword) {
  if (!storedPassword) return false;
  return bcrypt.compare(enteredPassword, storedPassword);
};

// Check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Check if account is locked
userSchema.methods.isAccountLocked = function () {
  return this.accountLocked && this.lockUntil && this.lockUntil > Date.now();
};

// Increment password reset attempts
userSchema.methods.incrementPasswordResetAttempts = async function () {
  this.passwordResetAttempts += 1;

  // Lock account after 5 failed attempts
  if (this.passwordResetAttempts >= 5) {
    this.accountLocked = true;
    this.lockUntil = Date.now() + 30 * 60 * 1000; // Lock for 30 minutes
  }

  await this.save({ validateBeforeSave: false });
  return this.passwordResetAttempts;
};

// Reset password attempts counter
userSchema.methods.resetPasswordAttempts = async function () {
  this.passwordResetAttempts = 0;
  this.accountLocked = false;
  this.lockUntil = undefined;
  await this.save({ validateBeforeSave: false });
};

// Helper method to add a new address
userSchema.methods.addAddress = async function (addressData) {
  // If this is the first address or isDefault is true, set as default
  if (this.addresses.length === 0 || addressData.isDefault) {
    // Set all existing addresses to non-default
    if (this.addresses.length > 0) {
      this.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }
    addressData.isDefault = true;
  }

  this.addresses.push(addressData);
  return this.save();
};

// Helper method to get default address
userSchema.methods.getDefaultAddress = function () {
  if (!this.addresses || this.addresses.length === 0) {
    return null;
  }

  return this.addresses.find((addr) => addr.isDefault) || this.addresses[0];
};

// Method to generate OTP
userSchema.methods.generateVerificationCode = function () {
  // Generate a 5-digit code
  const code = Math.floor(10000 + Math.random() * 90000).toString();

  // Store the code and set expiry (10 minutes)
  this.verificationCode = code;
  this.verificationCodeExpires = Date.now() + 10 * 60 * 1000;

  return code;
};

const User = mongoose.model('User', userSchema);

export default User;
