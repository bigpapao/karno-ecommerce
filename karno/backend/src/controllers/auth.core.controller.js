import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/user.model.js';
import PhoneVerification from '../models/phoneVerification.model.js';
import { AppError } from '../middleware/error-handler.middleware.js';
import { sendSmsVerification } from '../utils/sms.js';
import { logger } from '../utils/logger.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setTokenCookies,
  clearTokenCookies,
} from '../utils/tokens.js';

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password, sessionId } = req.body;
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
      return next(
        new AppError(
          `Account temporarily locked. Try again in ${lockTimeRemaining} min`,
          423,
        ),
      );
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

    // If sessionId is provided, merge guest cart with user cart
    let cartMergeResult = null;
    if (sessionId) {
      try {
        // Import the cart controller to use the mergeGuestCart functionality
        const CartModule = await import('../models/cart.model.js');
        const Cart = CartModule.default;

        // Find guest cart by sessionId
        const guestCart = await Cart.findOne({ sessionId });
        if (guestCart) {
          // Find user cart
          let userCart = await Cart.findOne({ user: user._id });
          if (!userCart) {
            // Create a new user cart if it doesn't exist
            userCart = new Cart({
              user: user._id,
              items: [],
              totalPrice: 0,
              totalItems: 0,
            });
          }
          // Merge items from guest cart to user cart
          if (guestCart.items && guestCart.items.length > 0) {
            guestCart.items.forEach((guestItem) => {
              const existingItemIndex = userCart.items.findIndex(
                (item) => item.product.toString() === guestItem.product.toString(),
              );
              if (existingItemIndex > -1) {
                // Add quantities if product already exists in user cart
                userCart.items[existingItemIndex].quantity += guestItem.quantity;
              } else {
                // Add new item to user cart
                userCart.items.push({
                  product: guestItem.product,
                  name: guestItem.name,
                  quantity: guestItem.quantity,
                  price: guestItem.price,
                  image: guestItem.image,
                });
              }
            });
            // Update cart totals
            userCart.totalItems = userCart.items.reduce((total, item) => total + item.quantity, 0);
            userCart.totalPrice = userCart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
            // Save the updated user cart
            await userCart.save();
            // Delete the guest cart
            await Cart.deleteOne({ _id: guestCart._id });
            cartMergeResult = {
              success: true,
              message: 'Guest cart merged successfully',
              itemCount: userCart.totalItems,
            };
          }
        }
      } catch (cartError) {
        logger.error('Error merging carts:', { error: cartError.message, stack: cartError.stack });
        cartMergeResult = {
          success: false,
          message: 'Error merging carts, but login was successful',
        };
      }
    }

    // Set response data
    const resData = {
      status: 'success',
      token: generateAccessToken(user), // For backward compatibility
      data: {
        user,
      },
    };
    // Add cart merge result to response if available
    if (cartMergeResult) {
      resData.cartMergeResult = cartMergeResult;
    }

    // Set cookies and send response
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setTokenCookies(res, accessToken, refreshToken);
    // Remove password from output
    user.password = undefined;

    res.status(200).json(resData);
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
      firstName, lastName, email, password, mobile, phone, sessionId,
    } = req.body;

    // Use mobile if provided, otherwise use phone
    const rawPhoneNumber = mobile || phone;

    // Phone number is mandatory
    if (!rawPhoneNumber) {
      return res.status(422).json({
        status: 'error',
        message: 'شماره موبایل الزامی است',
        errors: [{
          field: mobile ? 'mobile' : 'phone',
          msg: 'شماره موبایل الزامی است',
        }],
      });
    }

    // Normalize and validate phone number
    let normalizedPhoneNumber = rawPhoneNumber.toString().replace(/\D/g, '');
    if (normalizedPhoneNumber.startsWith('98')) {
      normalizedPhoneNumber = normalizedPhoneNumber.substring(2);
    }
    if (normalizedPhoneNumber.startsWith('0')) {
      normalizedPhoneNumber = normalizedPhoneNumber.substring(1);
    }

    if (!/^9\d{9}$/.test(normalizedPhoneNumber)) {
      return res.status(400).json({
        status: 'error',
        message: 'فرمت شماره موبایل صحیح نیست. شماره باید با 9 شروع شود و 10 رقم باشد.',
        errors: [{
          field: mobile ? 'mobile' : 'phone',
          msg: 'فرمت شماره موبایل صحیح نیست. شماره باید با 9 شروع شود و 10 رقم باشد.',
        }],
      });
    }

    // Check if user already exists with the same email (if provided) or normalized phone
    const queryOrConditions = [{ phone: normalizedPhoneNumber }];
    if (email) {
      queryOrConditions.push({ email });
    }
    const existingUser = await User.findOne({ $or: queryOrConditions });

    if (existingUser) {
      if (existingUser.phone === normalizedPhoneNumber) {
        return res.status(409).json({
          status: 'error',
          message: 'کاربری با این شماره موبایل قبلاً ثبت نام کرده است',
          errors: [{
            field: mobile ? 'mobile' : 'phone',
            msg: 'کاربری با این شماره موبایل قبلاً ثبت نام کرده است',
          }],
        });
      }
      if (email && existingUser.email === email) {
        return res.status(409).json({
          status: 'error',
          message: 'کاربری با این ایمیل قبلاً ثبت نام کرده است',
          errors: [{
            field: 'email',
            msg: 'کاربری با این ایمیل قبلاً ثبت نام کرده است',
          }],
        });
      }
      return res.status(409).json({
        status: 'error',
        message: 'کاربری با این مشخصات قبلاً ثبت نام کرده است',
        errors: [{ field: 'unknown', msg: 'کاربری با این مشخصات قبلاً ثبت نام کرده است' }],
      });
    }

    // Create user data object
    const userData = {
      firstName,
      lastName,
      password,
      phone: normalizedPhoneNumber, // Use the normalized phone number
    };

    // Add email if provided
    if (email) {
      userData.email = email;
    }

    // Only add role if it's provided (for admin creation)
    if (req.body.role === 'admin') {
      userData.role = 'admin';
    }

    // Create the user
    const user = await User.create(userData);

    // Log successful registration
    logger.info(`New user registered: ${user.email || user.phone} at ${new Date().toISOString()}`);

    // If sessionId is provided, merge guest cart with user cart
    let cartMergeResult = null;
    if (sessionId) {
      try {
        // Import the cart controller to use the mergeGuestCart functionality
        const CartModule = await import('../models/cart.model.js');
        const Cart = CartModule.default;

        // Find guest cart by sessionId
        const guestCart = await Cart.findOne({ sessionId });
        if (guestCart) {
          // Find user cart
          let userCart = await Cart.findOne({ user: user._id });
          if (!userCart) {
            // Create a new user cart if it doesn't exist
            userCart = new Cart({
              user: user._id,
              items: [],
              totalPrice: 0,
              totalItems: 0,
            });
          }
          // Merge items from guest cart to user cart
          if (guestCart.items && guestCart.items.length > 0) {
            guestCart.items.forEach((guestItem) => {
              const existingItemIndex = userCart.items.findIndex(
                (item) => item.product.toString() === guestItem.product.toString(),
              );
              if (existingItemIndex > -1) {
                // Add quantities if product already exists in user cart
                userCart.items[existingItemIndex].quantity += guestItem.quantity;
              } else {
                // Add new item to user cart
                userCart.items.push({
                  product: guestItem.product,
                  name: guestItem.name,
                  quantity: guestItem.quantity,
                  price: guestItem.price,
                  image: guestItem.image,
                });
              }
            });
            // Update cart totals
            userCart.totalItems = userCart.items.reduce((total, item) => total + item.quantity, 0);
            userCart.totalPrice = userCart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
            // Save the updated user cart
            await userCart.save();
            // Delete the guest cart
            await Cart.deleteOne({ _id: guestCart._id });
            cartMergeResult = {
              success: true,
              message: 'Guest cart merged successfully',
              itemCount: userCart.totalItems,
            };
          }
        }
      } catch (cartError) {
        logger.error('Error merging carts:', { error: cartError.message, stack: cartError.stack });
        cartMergeResult = {
          success: false,
          message: 'Error merging carts, but registration was successful',
        };
      }
    }

    // Set response data
    const resData = {
      status: 'success',
      token: generateAccessToken(user), // For backward compatibility
      data: {
        user,
      },
    };
    // Add cart merge result to response if available
    if (cartMergeResult) {
      resData.cartMergeResult = cartMergeResult;
    }

    // Set cookies and send response
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json(resData);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Registration error:', error.stack);
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err) => ({
        field: err.path,
        msg: err.message,
      }));
      return res.status(422).json({
        status: 'error',
        message: 'خطا در اعتبارسنجی اطلاعات',
        errors,
      });
    }
    // Handle duplicate key errors (MongoDB error code 11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        status: 'error',
        message: 'کاربری با این مشخصات قبلاً ثبت نام کرده است',
        errors: [{
          field,
          msg: `کاربری با این ${field === 'email' ? 'ایمیل' : 'شماره موبایل'} قبلاً ثبت نام کرده است`,
        }],
      });
    }
    // For any other errors, pass to the global error handler
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
    // Use the PhoneVerification model with improved rate limiting
    try {
      // Get IP address and user agent for rate limiting
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];
      // Create or update verification with the purpose from request body or default to 'login'
      const purpose = req.body.purpose || 'login';
      const verification = await PhoneVerification.createVerification(phone, purpose, ipAddress, userAgent);
      // Send SMS
      const smsResult = await sendSmsVerification(phone, verification.code);
      if (!smsResult) {
        return res.status(500).json({ status: 'error', message: 'Failed to send verification code' });
      }
      return res.status(200).json({
        status: 'success',
        message: 'Verification code sent',
        expiresAt: verification.expiresAt,
      });
    } catch (err) {
      if (err.message.includes('Rate limit')) {
        return res.status(429).json({
          status: 'error',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: 3600,
        });
      }
      throw err; // Re-throw for general error handling
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Verify phone and login/register user
// @route   POST /api/auth/verify-phone
// @access  Public
export const verifyPhoneAndLogin = async (req, res, next) => {
  try {
    let { phone } = req.body;
    const {
      code, firstName, lastName, password,
    } = req.body;

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
    // Find verification record using PhoneVerification model
    const verification = await PhoneVerification.findOne({ phone });
    if (!verification) {
      return next(new AppError('Verification code not found or expired. Please request a new code.', 404));
    }
    // Check if code is expired
    if (verification.isExpired()) {
      return next(new AppError('Verification code has expired. Please request a new code.', 400));
    }
    // Check if max attempts reached
    if (verification.isMaxAttemptsReached()) {
      // Delete the verification and force user to request a new one
      await PhoneVerification.deleteOne({ phone });
      return next(new AppError('Too many failed attempts. Please request a new verification code.', 400));
    }
    // Check if code matches
    if (verification.code !== code) {
      // Increment attempts
      await verification.incrementAttempts();
      return next(
        new AppError(
          `Invalid code. ${3 - verification.attempts} attempts remaining.`,
          400,
        ),
      );
    }
    // Mark verification as verified
    verification.verified = true;
    await verification.save();
    // Find or create user
    let user = await User.findOne({ phone });
    let isNewUser = false;
    if (!user) {
      const userData = {
        phone,
        phoneVerified: true,
        role: 'user',
        verificationStatus: 'phone_verified',
      };
      if (firstName) userData.firstName = firstName;
      if (lastName) userData.lastName = lastName;
      if (password) userData.password = password;
      user = await User.create(userData);
      isNewUser = true;
    } else {
      user.phoneVerified = true;
      user.lastLogin = Date.now();
      user.verificationStatus = user.verificationStatus || 'phone_verified';
      if (password) user.password = password;
      if (firstName && !user.firstName) user.firstName = firstName;
      if (lastName && !user.lastName) user.lastName = lastName;
      await user.save({ validateBeforeSave: false });
    }
    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshTokenGenerated = generateRefreshToken(user); // Renamed to avoid conflict
    // Set cookies
    setTokenCookies(res, accessToken, refreshTokenGenerated);
    // Create response
    const response = {
      status: isNewUser ? 'created' : 'success',
      token: accessToken, // For backward compatibility
      data: { user },
      isNewUser: !user.password || isNewUser,
    };
    // Remove sensitive data
    user.password = undefined;
    res.status(isNewUser ? 201 : 200).json(response);
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
    const { refreshToken: reqRefreshToken } = req.cookies; // Renamed to avoid conflict
    if (!reqRefreshToken) {
      return next(new AppError('No refresh token provided', 401));
    }
    // Verify refresh token
    const decoded = verifyRefreshToken(reqRefreshToken);
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
      message: 'Access token refreshed successfully',
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
