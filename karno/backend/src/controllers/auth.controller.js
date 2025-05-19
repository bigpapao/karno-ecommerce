import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/user.model.js';
import PhoneVerification from '../models/phoneVerification.model.js';
import VerificationCode from '../models/VerificationCode.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendSmsVerification } from '../utils/sms.js';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  setTokenCookies, 
  clearTokenCookies 
} from '../utils/tokens.js';

// Legacy token generation (kept for backward compatibility)
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
});

// Create and send token with secure cookie
const createSendToken = (user, statusCode, req, res) => {
  // Generate both access and refresh tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Set cookies
  setTokenCookies(res, accessToken, refreshToken);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token: accessToken, // For backward compatibility
    data: {
      user,
    },
  });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    let { phone } = req.body;

    // Check if we have either email or phone
    if ((!email && !phone) || !password) {
      return next(new AppError('Please provide email/phone and password', 400));
    }

    // Normalize phone number if provided
    if (phone) {
      phone = phone.toString().replace(/\D/g, '');
      if (phone.startsWith('98')) {
        phone = phone.substring(2);
      } else if (phone.startsWith('0')) {
        phone = phone.substring(1);
      }

      // Validate phone number format (accepts format with or without leading zero)
      if (!/^(0?9\d{9})$/.test(phone)) {
        return next(new AppError('شماره موبایل باید با 9 شروع شود و 10 رقم باشد', 400));
      }
    }

    // Find user by email or phone
    const query = email ? { email } : { phone };
    const user = await User.findOne(query).select('+password +accountLocked +lockUntil +passwordResetAttempts');

    if (!user) {
      return next(new AppError('Incorrect credentials', 401));
    }

    if (user.isAccountLocked && user.isAccountLocked()) {
      const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
      return next(new AppError(`Account temporarily locked due to too many failed attempts. Please try again in ${lockTimeRemaining} minutes`, 423));
    }

    if (!user.password) {
      return next(new AppError('No password set for this account. Please verify your phone number first.', 401));
    }

    const isPasswordCorrect = await user.comparePassword(password, user.password);

    if (!isPasswordCorrect) {
      await user.incrementPasswordResetAttempts();
      if (user.accountLocked) {
        return next(new AppError('Too many failed login attempts. Account locked for 30 minutes', 423));
      }
      return next(new AppError('Incorrect password', 401));
    }

    if (user.passwordResetAttempts > 0) {
      await user.resetPasswordAttempts();
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    createSendToken(user, 200, req, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const {
      firstName, lastName, name, email, password, phone, role,
    } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new AppError('User already exists', 400));
    }

    // Create user with role if provided
    const userData = {
      email,
      password,
      phone,
    };

    // Handle name field (from frontend) or firstName/lastName fields
    if (name) {
      // If a single 'name' field is provided, split it into firstName and lastName
      const nameParts = name.trim().split(' ');
      userData.firstName = nameParts[0] || 'User';
      userData.lastName = nameParts.slice(1).join(' ') || 'Account';
    } else {
      // Use provided firstName and lastName
      userData.firstName = firstName || 'User';
      userData.lastName = lastName || 'Account';
    }

    // Only add role if it's provided (for admin creation)
    if (role === 'admin') {
      userData.role = 'admin';
    }

    const user = await User.create(userData);

    // Log successful registration
    console.log(`New user registered: ${user.email} at ${new Date().toISOString()}`);

    // Create and send token
    createSendToken(user, 201, req, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request phone verification code
// @route   POST /api/auth/request-verification
// @access  Public
export const requestPhoneVerification = async (req, res, next) => {
  try {
    let { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ status: 'error', message: 'Phone number is required' });
    }
    // Normalize phone number (remove country code, leading zero)
    phone = phone.toString().replace(/\D/g, '');
    if (phone.startsWith('98')) phone = phone.substring(2);
    if (phone.startsWith('0')) phone = phone.substring(1);
    if (!/^9\d{9}$/.test(phone)) {
      return res.status(400).json({ status: 'error', message: 'Invalid Iranian phone number format' });
    }
    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // Store in MongoDB (upsert)
    await VerificationCode.findOneAndUpdate(
      { phone },
      { code, createdAt: new Date() },
      { upsert: true, new: true }
    );
    // Send SMS
    const smsResult = await sendSmsVerification(phone, code);
    if (!smsResult) {
      return res.status(500).json({ status: 'error', message: 'Failed to send verification code' });
    }
    return res.status(200).json({ status: 'success', message: 'Verification code sent' });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify phone and login/register user
// @route   POST /api/auth/verify-phone
// @access  Public
export const verifyPhoneAndLogin = async (req, res, next) => {
  try {
    let { phone, code, firstName, lastName, password } = req.body;
    if (!phone || !code) {
      return next(new AppError('Please provide phone number and verification code', 400));
    }
    // Normalize phone number
    phone = phone.toString().replace(/\D/g, '');
    if (phone.startsWith('98')) phone = phone.substring(2);
    if (phone.startsWith('0')) phone = phone.substring(1);
    if (!/^9\d{9}$/.test(phone)) {
      return next(new AppError('شماره موبایل باید با 9 شروع شود و 10 رقم باشد', 400));
    }
    // Find verification record
    const verification = await VerificationCode.findOne({ phone });
    if (!verification) {
      return next(new AppError('Verification code not found or expired. Please request a new code.', 404));
    }
    // Limit attempts (store in-memory for now, or add to model if needed)
    // Check if code matches
    if (verification.code !== code) {
      // Optionally: delete after 3 failed attempts (not implemented in this simple model)
      return next(new AppError('Invalid verification code. Please try again.', 400));
    }
    // Delete the code after successful verification
    await VerificationCode.deleteOne({ phone });
    // Find or create user
    let user = await User.findOne({ phone });
    let isNewUser = false;
    if (!user) {
      const userData = { phone, phoneVerified: true, role: 'user' };
      if (firstName) userData.firstName = firstName;
      if (lastName) userData.lastName = lastName;
      if (password) userData.password = password;
      user = await User.create(userData);
      isNewUser = true;
    } else {
      user.phoneVerified = true;
      user.lastLogin = Date.now();
      if (password) user.password = password;
      if (firstName && !user.firstName) user.firstName = firstName;
      if (lastName && !user.lastName) user.lastName = lastName;
      await user.save({ validateBeforeSave: false });
    }
    // Create response
    const response = {
      status: isNewUser ? 'created' : 'success',
      token: generateToken(user._id),
      data: { user },
      isNewUser: !user.password || isNewUser,
    };
    // Set cookie
    const cookieOptions = {
      expires: new Date(Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRES_IN) || 7) * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: '/',
    };
    res.cookie('jwt', response.token, cookieOptions);
    user.password = undefined;
    res.status(isNewUser ? 201 : 200).json(response);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req, res, next) => {
  try {
    // User is already attached to req from auth middleware
    res.status(200).json({
      status: 'success',
      data: req.user,
    });
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

    // Get user from auth middleware or find by phone (for password setup)
    let user;
    if (req.user) {
      user = await User.findById(req.user.id);
    } else if (phone) {
      // This path is used for setting password after phone verification
      user = await User.findOne({ phone });
    }

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Update basic info
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    // Update email if provided and different
    if (email && email !== user.email) {
      // Check if email already exists for another user
      const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingUser) {
        return next(new AppError('Email already in use by another account', 400));
      }

      user.email = email;
      user.isEmailVerified = false; // Reset email verification
    }

    // Update password if provided
    if (password) {
      if (password.length < 6) {
        return next(new AppError('Password must be at least 6 characters', 400));
      }
      user.password = password;
    }

    // Update address if provided
    if (address) {
      user.address = {
        ...user.address,
        ...address,
      };
    }

    await user.save({ validateBeforeSave: true });

    // Remove sensitive fields
    user.password = undefined;

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
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

    // Get user by email
    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError('There is no user with that email address', 404));
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    // Use a fixed frontend URL for development. In production, use an environment variable.
    const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetURL = `${frontendBaseUrl}/reset-password/${resetToken}`;

    const message = `Forgot your password? Click the link to reset your password: ${resetURL}
This link is valid for 10 minutes.
If you didn't forget your password, please ignore this email!`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Your password reset token (valid for 10 minutes)',
        html: message,
      });

      res.status(200).json({
        status: 'success',
        message: 'Token sent to email',
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return next(new AppError('There was an error sending the email. Try again later!', 500));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh JWT access token using refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshToken = async (req, res, next) => {
  try {
    // Get refresh token from cookies
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return next(new AppError('No refresh token provided', 401));
    }
    
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return next(new AppError('Invalid or expired refresh token', 401));
    }
    
    // Find user by id from decoded token
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    // Check if password was changed after token was issued
    if (user.passwordChangedAt) {
      const tokenIssuedAt = decoded.iat * 1000; // Convert to milliseconds
      if (user.passwordChangedAt.getTime() > tokenIssuedAt) {
        return next(new AppError('User recently changed password. Please log in again', 401));
      }
    }
    
    // Generate new access token
    const newAccessToken = generateAccessToken(user);
    
    // Set the new access token cookie
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    });
    
    // Return success response
    res.status(200).json({
      status: 'success',
      token: newAccessToken,
      message: 'Access token refreshed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   GET /api/auth/logout
// @access  Private
export const logout = (req, res) => {
  // Clear both access and refresh token cookies
  clearTokenCookies(res);
  
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    console.log('[RESET PASSWORD] Received token:', token ? '****** (present)' : '(not present)');
    console.log('[RESET PASSWORD] Received new password from req.body:', password ? `****** (present, length: ${password.length})` : '(not present)');

    // Hash token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user by token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Generate tokens and set cookies
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setTokenCookies(res, accessToken, refreshToken);

    res.status(200).json({
      status: 'success',
      token: accessToken,
      user,
    });
  } catch (error) {
    next(error);
  }
};
