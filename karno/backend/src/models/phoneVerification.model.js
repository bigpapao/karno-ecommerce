import mongoose from 'mongoose';

const phoneVerificationSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  code: {
    type: String,
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: '10m' }, // Automatically delete after 10 minutes
  },
  verified: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

phoneVerificationSchema.methods.isExpired = function () {
  return this.expiresAt < new Date();
};

phoneVerificationSchema.methods.isMaxAttemptsReached = function () {
  return this.attempts >= 3;
};

phoneVerificationSchema.methods.incrementAttempts = async function () {
  this.attempts += 1;
  await this.save();
};

const PhoneVerification = mongoose.model('PhoneVerification', phoneVerificationSchema);

export default PhoneVerification;
