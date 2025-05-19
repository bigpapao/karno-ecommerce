import User from '../models/user.model.js';
import { AppError } from '../middleware/errorHandler.js';

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
