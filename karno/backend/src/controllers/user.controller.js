import User from '../models/user.model.js';
import PhoneVerification from '../models/phoneVerification.model.js';
import { AppError } from '../middleware/error-handler.middleware.js';
import smsService from '../services/sms.service.js';
import { isValidIranianMobile } from '../utils/phoneUtils.js';
import { sendSmsVerification } from '../utils/sms.js'; // Assuming you have an SMS service

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({});
    res.status(200).json({
      status: 'success',
      results: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin or Self
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Check if user is requesting their own profile or is an admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return next(new AppError('Not authorized to access this user', 403));
    }

    res.status(200).json({
      status: 'success',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin or Self
export const updateUser = async (req, res, next) => {
  try {
    // Check if user is updating their own profile or is an admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return next(new AppError('Not authorized to update this user', 403));
    }

    // Don't allow regular users to change their role
    if (req.user.role !== 'admin' && req.body.role) {
      delete req.body.role;
    }

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile information
 * @route POST /api/user/update-profile
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      firstName,
      lastName,
      address,
      city,
      province,
      postalCode,
      phone,
    } = req.body;

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // If phone number is changed, verify it's valid and not already in use
    if (phone && phone !== user.phone) {
      // Validate phone format
      if (!isValidIranianMobile(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format',
        });
      }

      // Check if phone is already in use
      const existingUser = await User.findOne({ phone, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is already in use',
        });
      }

      // If changing phone, reset verification status
      user.phoneVerified = false;
      user.phone = phone; // Update phone number
    }

    // Update user profile fields
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.address = address || user.address;
    user.city = city || user.city;
    user.province = province || user.province;
    user.postalCode = postalCode || user.postalCode;

    // Save the updated user
    await user.save();

    // Return updated user data (without sensitive fields)
    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          address: user.address,
          city: user.city,
          province: user.province,
          postalCode: user.postalCode,
          mobileVerified: user.mobileVerified, // This should be phoneVerified now
          phoneVerified: user.phoneVerified,
          isProfileComplete: user.isProfileComplete,
          email: user.email,
        },
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message,
    });
  }
};

/**
 * Request phone verification code
 * @route POST /api/v1/user/phone/request
 * @access Private
 */
export const requestPhoneVerification = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;
    const userId = req.user.id;

    if (!phoneNumber) {
      return next(new AppError('Phone number is required', 400));
    }

    // Basic validation for Iranian phone numbers (e.g., starts with 09 and 11 digits)
    if (!/^09\d{9}$/.test(phoneNumber)) {
      return next(new AppError('Invalid phone number format', 400));
    }

    const existingUserWithPhone = await User.findOne({ phone: phoneNumber, _id: { $ne: userId } });
    if (existingUserWithPhone) {
      return next(new AppError('This phone number is already in use by another account.', 400));
    }

    const code = Math.floor(10000 + Math.random() * 90000).toString(); // 5-digit code
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    await PhoneVerification.findOneAndUpdate(
      { phone: phoneNumber },
      {
        phone: phoneNumber, code, expiresAt, attempts: 0, verified: false,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    // try {
    //   await sendSmsVerification(phoneNumber, `Your verification code is: ${code}`);
    // } catch (smsError) {
    //   console.error('SMS sending failed:', smsError);
    //   // Decide if you want to return an error to the user or proceed without SMS for testing
    //   // return next(new AppError('Failed to send verification SMS', 500));
    // }

    res.status(200).json({
      status: 'success',
      message: 'Verification code sent to your phone number. Please check your messages.',
      // TEMP: returning code for testing if SMS is not set up
      verificationCode: code,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify phone number with code
// @route   POST /api/v1/user/phone/verify
// @access  Private
export const verifyPhoneVerification = async (req, res, next) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;
    // Find the user who is trying to verify
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // The phone number to verify should be the one from the request that initiated OTP,
    // or you might need to store it temporarily or get it from user profile if they already set it.
    // For this example, let's assume the user has a `tempPhoneNumber` field or we get it from the verification document itself.
    // This part highly depends on your exact flow: is the user setting a new phone or verifying an existing one?

    // For simplicity, let's find the verification document by the code first.
    // In a real app, you'd likely find it by phone number that was used to request the code.
    // This needs to be more robust.

    // Find the phone verification document by phone number that user wants to verify.
    // This assumes the phone number is available, perhaps from user.phone or from a temporary storage if it's a new phone.
    // Let's assume the user already has a `phone` field they are trying to verify or have just updated.
    const phoneNumberToVerify = user.phone; // Or from req.body if they are verifying a new number not yet saved
    if (!phoneNumberToVerify) {
      return next(new AppError('No phone number found for verification. Please set a phone number first or provide it.', 400));
    }

    const verificationDoc = await PhoneVerification.findOne({ phone: phoneNumberToVerify });

    if (!verificationDoc) {
      return next(new AppError('No verification process started for this phone number, or it has expired. Please request a new code.', 400));
    }

    if (verificationDoc.verified) {
      return res.status(200).json({
        status: 'success',
        message: 'Phone number already verified.',
      });
    }

    if (verificationDoc.isExpired()) {
      await PhoneVerification.deleteOne({ _id: verificationDoc._id }); // Clean up expired doc
      return next(new AppError('Verification code has expired. Please request a new one.', 400));
    }

    if (verificationDoc.isMaxAttemptsReached()) {
      await PhoneVerification.deleteOne({ _id: verificationDoc._id }); // Clean up doc after max attempts
      return next(new AppError('Maximum verification attempts reached. Please request a new code.', 400));
    }

    if (verificationDoc.code !== code) {
      await verificationDoc.incrementAttempts();
      const attemptsRemaining = 3 - verificationDoc.attempts;
      return next(new AppError(`Invalid verification code. ${attemptsRemaining} attempts remaining.`, 400));
    }

    // Mark as verified in the verification document
    verificationDoc.verified = true;
    verificationDoc.attempts += 1; // Count this as an attempt
    await verificationDoc.save();

    // Update user's phoneVerified status
    user.phoneVerified = true;
    // If the phone number in verificationDoc is different from user.phone, update it.
    // This would be the case if they are verifying a *new* phone number.
    if (user.phone !== verificationDoc.phone) {
      user.phone = verificationDoc.phone;
    }
    await user.save({ validateBeforeSave: false });

    // Optionally, delete the verification document after successful verification
    await PhoneVerification.deleteOne({ _id: verificationDoc._id });

    res.status(200).json({
      status: 'success',
      message: 'Phone number verified successfully.',
      data: {
        userId: user._id,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to get incomplete fields for profile status
 * @param {Object} user - User object
 * @returns {Array} Array of incomplete field names
 */
const getIncompleteFields = (user) => {
  const fields = [];
  if (!user.firstName) fields.push('firstName');
  if (!user.lastName) fields.push('lastName');
  if (!user.phone) fields.push('phone'); // Assuming phone is now a primary identifier for verification
  // Add other fields as necessary, e.g., address fields if they are part of profile completion
  if (!user.address) fields.push('address');
  if (!user.city) fields.push('city');
  if (!user.province) fields.push('province');
  if (!user.postalCode) fields.push('postalCode');
  return fields;
};

/**
 * Get user profile status
 * @route GET /api/user/profile-status
 */
export const getProfileStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('firstName lastName email phone phoneVerified isProfileComplete verificationStatus');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Determine profile status message
    let statusMessage = 'Profile is up to date.';
    let incompleteFields = [];
    if (!user.isProfileComplete) {
      statusMessage = 'Profile is incomplete.';
      incompleteFields = getIncompleteFields(user);
    }
    if (!user.phoneVerified) {
      statusMessage = 'Phone number not verified.';
    }

    res.status(200).json({
      success: true,
      profileStatus: {
        isComplete: user.isProfileComplete,
        phoneVerified: user.phoneVerified,
        verificationStatus: user.verificationStatus,
        message: statusMessage,
        incompleteFields: user.isProfileComplete ? [] : incompleteFields,
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching profile status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile status',
      error: error.message,
    });
  }
};
