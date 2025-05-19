import jwt from 'jsonwebtoken';

// JWT Secret from environment or fallback (should be set in .env in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-jwt-secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret';

// Access Token duration (shorter lived)
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '30m'; // 30 minutes
// Refresh Token duration (longer lived)
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '14d'; // 14 days

// Generate JWT access token
export const generateAccessToken = (user) => {
  const payload = {
    id: user._id,
    name: user.firstName ? `${user.firstName} ${user.lastName || ''}` : '',
    email: user.email || '',
    phone: user.phone || '',
    role: user.role || 'user',
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

// Generate JWT refresh token
export const generateRefreshToken = (user) => {
  const payload = {
    id: user._id,
    version: user.passwordChangedAt ? user.passwordChangedAt.getTime() : Date.now(),
  };
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
};

// Verify a refresh token
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
  } catch (error) {
    return null;
  }
};

// Set tokens in HTTP-only cookies
export const setTokenCookies = (res, accessToken, refreshToken) => {
  // Calculate cookie expiry dates
  const accessExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  const refreshExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: accessExpiry,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: refreshExpiry,
  });
};

// Clear auth cookies
export const clearTokenCookies = (res) => {
  res.cookie('accessToken', '', { 
    httpOnly: true, 
    expires: new Date(0) 
  });
  res.cookie('refreshToken', '', { 
    httpOnly: true, 
    expires: new Date(0) 
  });
};