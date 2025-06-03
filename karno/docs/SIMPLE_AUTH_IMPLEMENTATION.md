# Simple Authentication Backend Implementation

This document describes how to implement the backend API for the simplified authentication system according to the requirements.

## API Routes Implementation

### 1. User Registration (`POST /api/register`)

```javascript
// src/controllers/auth.controller.js
export const register = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, email, password, sessionId } = req.body;
    
    // Validate required fields
    if ((!phone && !email) || !password) {
      return res.status(400).json({ 
        message: 'Phone/email and password are required' 
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { phone },
        { email }
      ]
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this phone/email already exists' 
      });
    }
    
    // Hash password with bcrypt (12 rounds)
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      phone,
      email,
      password: hashedPassword
    });
    
    // Generate JWT token - 15 min expiry
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    // Generate refresh token - 7 days
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    
    // Set HTTP-only cookie with refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    });
    
    // Return user info and token
    res.status(201).json({
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email
      },
      token,
      sessionId // Return sessionId for frontend to handle cart merging
    });
  } catch (error) {
    next(error);
  }
};
```

### 2. User Login (`POST /api/login`)

```javascript
// src/controllers/auth.controller.js
export const login = async (req, res, next) => {
  try {
    const { email, phone, password, rememberMe, sessionId } = req.body;
    
    // Check if email/phone and password are provided
    if ((!email && !phone) || !password) {
      return res.status(400).json({ 
        message: 'Phone/email and password are required' 
      });
    }
    
    // Find user by email or phone
    const user = await User.findOne({
      $or: [
        { email },
        { phone }
      ]
    });
    
    // Generic error for security
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid phone/email or password' 
      });
    }
    
    // Compare password
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return res.status(401).json({ 
        message: 'Invalid phone/email or password' 
      });
    }
    
    // Generate JWT token - 15 min expiry
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    // Generate refresh token - 7 days or 1 day based on rememberMe
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: rememberMe ? '7d' : '1d' }
    );
    
    // Set HTTP-only cookie with refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    });
    
    // Return user info and token
    res.status(200).json({
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email
      },
      token,
      sessionId // Return sessionId for frontend to handle cart merging
    });
  } catch (error) {
    next(error);
  }
};
```

### 3. Merge Guest Cart (`POST /api/cart/merge`)

```javascript
// src/controllers/cart.controller.js
export const mergeGuestCart = async (req, res, next) => {
  try {
    const { guestCart } = req.body;
    const userId = req.user._id;
    
    if (!guestCart || !Array.isArray(guestCart)) {
      return res.status(400).json({ 
        message: 'Invalid guest cart data' 
      });
    }
    
    // Get user's cart or create one if it doesn't exist
    let userCart = await Cart.findOne({ user: userId });
    
    if (!userCart) {
      userCart = await Cart.create({
        user: userId,
        items: [],
        totalPrice: 0,
        totalItems: 0
      });
    }
    
    // Merge guest cart items with user cart
    for (const guestItem of guestCart) {
      const { productId, quantity } = guestItem;
      
      // Validate product
      const product = await Product.findById(productId);
      if (!product) continue; // Skip invalid products
      
      // Check if product already in cart
      const existingItem = userCart.items.find(
        item => item.product.toString() === productId
      );
      
      if (existingItem) {
        // Update quantity if product already in cart
        existingItem.quantity += quantity;
      } else {
        // Add new item to cart
        userCart.items.push({
          product: productId,
          name: product.name,
          price: product.price,
          quantity,
          image: product.images && product.images.length > 0 ? product.images[0] : null
        });
      }
    }
    
    // Recalculate cart totals
    userCart.totalItems = userCart.items.reduce((total, item) => total + item.quantity, 0);
    userCart.totalPrice = userCart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Save updated cart
    await userCart.save();
    
    res.status(200).json({
      message: 'Cart merged successfully',
      cart: {
        items: userCart.items,
        totalItems: userCart.totalItems,
        totalPrice: userCart.totalPrice
      }
    });
  } catch (error) {
    next(error);
  }
};
```

## Security Measures

1. **Password Hashing**: Using bcrypt with 12 rounds of salting:
   ```javascript
   const hashedPassword = await bcrypt.hash(password, 12);
   ```

2. **HTTPS Only**: Configure your server to use HTTPS in production:
   ```javascript
   // app.js or server.js
   if (process.env.NODE_ENV === 'production') {
     app.use((req, res, next) => {
       if (req.header('x-forwarded-proto') !== 'https') {
         res.redirect(`https://${req.header('host')}${req.url}`);
       } else {
         next();
       }
     });
   }
   ```

3. **Rate Limiting**: Implement rate limiting for registration and login:
   ```javascript
   // middleware/rateLimiter.js
   import rateLimit from 'express-rate-limit';
   
   export const authLimiter = rateLimit({
     windowMs: 60 * 1000, // 1 minute
     max: 5, // 5 requests per minute
     message: { message: 'Too many requests, please try again later.' },
     standardHeaders: true,
     legacyHeaders: false,
   });
   
   // routes/auth.routes.js
   import { authLimiter } from '../middleware/rateLimiter.js';
   
   router.post('/register', authLimiter, register);
   router.post('/login', authLimiter, login);
   ```

## Routes Setup

```javascript
// routes/auth.routes.js
import express from 'express';
import { register, login } from '../controllers/auth.controller.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

export default router;

// routes/cart.routes.js
import express from 'express';
import { mergeGuestCart } from '../controllers/cart.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/merge', protect, mergeGuestCart);

export default router;
```

## Middleware Setup

```javascript
// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const protect = async (req, res, next) => {
  try {
    // Check for token in headers
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Set user in request
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};
```

## Configuration

```javascript
// .env file
PORT=5000
MONGODB_URI=mongodb://localhost:27017/karno
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_token_secret_here
NODE_ENV=development
```

## Implementation Steps

1. Set up MongoDB with Mongoose
2. Create User, Cart, and Product models
3. Implement auth and cart controllers
4. Set up rate limiting middleware
5. Configure JWT authentication
6. Set up API routes
7. Test the endpoints with Postman or Insomnia
8. Deploy with HTTPS in production

This implementation satisfies the requirements for a simple authentication system with guest cart merging functionality. 