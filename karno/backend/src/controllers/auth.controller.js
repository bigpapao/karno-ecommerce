import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

// Helper functions
const generateAccessToken = (userId) => jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });

const generateRefreshToken = (userId) => jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

// Register
export const register = async (req, res) => {
  const {
    phone, password, firstName, lastName,
  } = req.body;
  const existingUser = await User.findOne({ phone });
  if (existingUser) return res.status(400).json({ status: 'error', message: 'این شماره قبلاً ثبت شده است.' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({
    phone, password: hashedPassword, firstName, lastName,
  });
  await user.save();

  return res.status(201).json({ status: 'success', message: 'ثبت‌نام با موفقیت انجام شد.' });
};

// Login
export const login = async (req, res) => {
  const { phone, password } = req.body;
  const user = await User.findOne({ phone });
  if (!user) return res.status(401).json({ status: 'error', message: 'کاربری با این شماره یافت نشد.' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ status: 'error', message: 'رمز عبور اشتباه است.' });

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    status: 'success',
    message: 'ورود موفقیت‌آمیز بود.',
    user: {
      id: user._id,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    accessToken,
  });
};

// Get Profile
export const getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) return res.status(404).json({ status: 'error', message: 'کاربر یافت نشد.' });

  return res.status(200).json({ status: 'success', data: user });
};

// Update Profile
export const updateProfile = async (req, res) => {
  const updates = (({ firstName, lastName }) => ({ firstName, lastName }))(req.body);
  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true }).select('-password');

  return res.status(200).json({ status: 'success', message: 'پروفایل با موفقیت به‌روزرسانی شد', data: user });
};

// Refresh Token
export const refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ status: 'error', message: 'رفرش توکن وجود ندارد.' });

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const accessToken = generateAccessToken(decoded.id);
    return res.status(200).json({ status: 'success', accessToken });
  } catch (err) {
    return res.status(403).json({ status: 'error', message: 'رفرش توکن نامعتبر است.' });
  }
};

// Logout
export const logout = async (req, res) => {
  res.clearCookie('refreshToken');
  return res.status(200).json({ status: 'success', message: 'با موفقیت خارج شدید.' });
};
