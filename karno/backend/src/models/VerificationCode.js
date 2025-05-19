import mongoose from 'mongoose';

const VerificationCodeSchema = new mongoose.Schema({
  phone: { type: String, required: true, index: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 }, // expires after 5 minutes
});

export default mongoose.model('VerificationCode', VerificationCodeSchema); 