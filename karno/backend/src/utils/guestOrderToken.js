import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Secret key for guest order tokens
const GUEST_ORDER_SECRET = process.env.GUEST_ORDER_SECRET || 
  crypto.randomBytes(32).toString('hex'); // Generate random if not set in env

/**
 * Generate a temporary token for guest users to access their order
 * 
 * @param {string} orderId - The order ID 
 * @param {string} email - The guest email
 * @returns {string} The JWT token
 */
export const generateGuestOrderToken = async (orderId, email) => {
  return jwt.sign(
    { 
      type: 'guest_order',
      orderId,
      email
    },
    GUEST_ORDER_SECRET,
    { expiresIn: '1h' } // Token expires in 1 hour
  );
};

/**
 * Verify a guest order token
 * 
 * @param {string} token - The JWT token to verify
 * @returns {Object|null} The decoded token payload or null if invalid
 */
export const verifyGuestOrderToken = (token) => {
  try {
    const decoded = jwt.verify(token, GUEST_ORDER_SECRET);
    
    // Ensure it's a guest order token
    if (decoded.type !== 'guest_order') {
      return null;
    }
    
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Middleware to verify guest order access
 * 
 * This middleware can be used to protect guest order routes
 * It attaches the guest order info to req.guestOrder if valid
 */
export const verifyGuestOrderAccess = (req, res, next) => {
  // Get token from header
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }
  
  // Verify token
  const decodedToken = verifyGuestOrderToken(token);
  
  if (!decodedToken) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
  
  // Attach guest order info to request
  req.guestOrder = {
    orderId: decodedToken.orderId,
    email: decodedToken.email
  };
  
  next();
};

export default {
  generateGuestOrderToken,
  verifyGuestOrderToken,
  verifyGuestOrderAccess
}; 