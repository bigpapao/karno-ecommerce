import mongoose from 'mongoose';

const phoneVerificationSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      validate: {
        validator(v) {
          // Validate Iranian phone number format (10 digits starting with 9)
          // This validation happens after normalization, so we only need to check the final format
          return /^9\d{9}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid Iranian phone number!`,
      },
    },
    code: {
      type: String,
      required: [true, 'Verification code is required'],
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default() {
        // Set expiration to 5 minutes from now
        return new Date(Date.now() + 5 * 60 * 1000);
      },
    },
    attempts: {
      type: Number,
      default: 0,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Index to automatically expire documents after they're expired
phoneVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to check if code is expired
phoneVerificationSchema.methods.isExpired = function () {
  return this.expiresAt < new Date();
};

// Method to check if max attempts reached
phoneVerificationSchema.methods.isMaxAttemptsReached = function () {
  return this.attempts >= 3; // Max 3 attempts
};

// Method to increment attempts
phoneVerificationSchema.methods.incrementAttempts = async function () {
  this.attempts += 1;
  await this.save();
  return this.attempts;
};

// Static method to generate a random verification code
phoneVerificationSchema.statics.generateCode = function () {
  // Generate a 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Static method to create or update a verification code
phoneVerificationSchema.statics.createVerification = async function (phone) {
  const code = this.generateCode();

  // Find existing verification for this phone and update it, or create new one
  const verification = await this.findOneAndUpdate(
    { phone },
    {
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      attempts: 0,
      verified: false,
    },
    { upsert: true, new: true },
  );

  return verification;
};

const PhoneVerification = mongoose.model('PhoneVerification', phoneVerificationSchema);

export default PhoneVerification;
