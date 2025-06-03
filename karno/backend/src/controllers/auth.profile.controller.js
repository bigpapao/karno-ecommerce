// controllers/auth.profile.controller.js (Optimized)
import crypto from 'crypto';
import User from '../models/user.model.js';
import { AppError } from '../middleware/error-handler.middleware.js';
import {
  generateAccessToken,
  generateRefreshToken,
  setTokenCookies,
} from '../utils/tokens.js';
import { sendEmail } from '../utils/email.js';

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req, res, next) => {
  try {
    res.status(200).json({ status: 'success', data: req.user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const {
      firstName, lastName, email, address, password, phone,
    } = req.body;
    const user = req.user || (await User.findOne({ phone }));

    if (!user) return next(new AppError('User not found', 404));

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    if (email && email !== user.email) {
      const existing = await User.findOne({ email, _id: { $ne: user._id } });
      if (existing) return next(new AppError('Email already in use', 400));
      user.email = email;
      user.isEmailVerified = false;
    }

    if (password) {
      if (password.length < 6) return next(new AppError('Password too short', 400));
      user.password = password;
    }

    if (address) user.address = { ...user.address, ...address };

    await user.save({ validateBeforeSave: true });
    user.password = undefined;

    res.status(200).json({ status: 'success', data: { user } });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return next(new AppError('No user with this email', 404));

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    const message = `Click to reset: ${resetURL}\nValid for 10 minutes.`;

    try {
      await sendEmail({ email: user.email, subject: 'Reset Token', html: message });
      res.status(200).json({ status: 'success', message: 'Token sent to email' });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return next(new AppError('Email failed to send', 500));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const hashed = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) return next(new AppError('Invalid or expired token', 400));

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setTokenCookies(res, accessToken, refreshToken);

    res.status(200).json({ status: 'success', token: accessToken, user });
  } catch (error) {
    next(error);
  }
};
