import jwt from 'jsonwebtoken';

// JWT Secret from environment or fallback (should be set in .env in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-jwt-secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret';

// Access Token duration (15 minutes)
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
// Refresh Token duration (7 days)
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

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
  // Safely handle passwordChangedAt field - wrap date safely
  const issuedAt = new Date(user.passwordChangedAt || Date.now()).getTime();

  const payload = {
    id: user._id,
    version: issuedAt,
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
  const accessExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: false, // Set to false for localhost development
    sameSite: 'lax',
    expires: accessExpiry,
    path: '/',
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: false, // Set to false for localhost development
    sameSite: 'lax',
    expires: refreshExpiry,
    path: '/',
  });
};

// Clear tokens from cookies
export const clearTokenCookies = (res) => {
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: false, // Set to false for localhost development
    sameSite: 'lax',
    path: '/',
  });

  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: false, // Set to false for localhost development
    sameSite: 'lax',
    path: '/',
  });
};
