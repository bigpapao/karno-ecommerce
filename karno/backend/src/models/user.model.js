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
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      validate: {
        validator(v) {
          // Validate Iranian phone number format (with or without leading zero)
          return /^(0?9\d{9})$/.test(v);
        },
        message: (props) => `${props.value} شماره موبایل باید با 9 شروع شود و 10 رقم باشد`,
      },
      // Normalize phone number before saving
      set(v) {
        if (!v) return v;
        // Remove any non-digit characters
        let phone = v.toString().replace(/\D/g, '');
        // Remove leading zero or country code if present
        if (phone.startsWith('98')) {
          phone = phone.substring(2);
        } else if (phone.startsWith('0')) {
          phone = phone.substring(1);
        }
        return phone;
      },
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    password: {
      type: String,
      select: false,
    },
    passwordChangedAt: Date,
    passwordResetAttempts: {
      type: Number,
      default: 0,
    },
    accountLocked: {
      type: Boolean,
      default: false,
    },
    lockUntil: Date,
    // Legacy single address field (maintained for backward compatibility)
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    // New array of addresses
    addresses: [addressSchema],
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    lastLogin: Date,
    phoneVerified: {
      type: Boolean,
      default: false,
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

// Hash password before saving (if password exists)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);

  // Update passwordChangedAt when password is modified
  this.passwordChangedAt = Date.now() - 1000;

  next();
});

// Ensure only one default address
userSchema.pre('save', function (next) {
  if (this.isModified('addresses')) {
    // Check if we're setting a new default
    const hasNewDefault = this.addresses.some(addr => addr.isDefault && addr.isModified('isDefault'));
    
    if (hasNewDefault) {
      // If setting a new default, make sure no other address is default
      this.addresses.forEach(addr => {
        if (!addr.isModified('isDefault') || !addr.isDefault) {
          addr.isDefault = false;
        }
      });
    } else {
      // If no default is explicitly set and this is a new address, set the first one as default
      if (this.addresses.length === 1 && this.isNew) {
        this.addresses[0].isDefault = true;
      }
    }
  }
  next();
});

// Compare passwords
userSchema.methods.comparePassword = async function (enteredPassword, storedPassword) {
  if (!storedPassword) return false;
  return await bcrypt.compare(enteredPassword, storedPassword);
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
userSchema.methods.addAddress = async function(addressData) {
  // If this is the first address or isDefault is true, set as default
  if (this.addresses.length === 0 || addressData.isDefault) {
    // Set all existing addresses to non-default
    if (this.addresses.length > 0) {
      this.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }
    addressData.isDefault = true;
  }
  
  this.addresses.push(addressData);
  return this.save();
};

// Helper method to get default address
userSchema.methods.getDefaultAddress = function() {
  if (!this.addresses || this.addresses.length === 0) {
    return null;
  }
  
  return this.addresses.find(addr => addr.isDefault) || this.addresses[0];
};

const User = mongoose.model('User', userSchema);

export default User;
