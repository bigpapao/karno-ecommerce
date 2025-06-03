# Authentication Middleware Consolidation Guide

This guide outlines the steps to standardize authentication middleware across the Karno e-commerce platform.

## Problem

The codebase currently uses two different middleware functions for authentication:

1. `authenticate` from `src/middleware/auth.middleware.js`
2. `protect` from `src/middleware/authMiddleware.js`

This creates redundancy and potential inconsistencies in how authentication is handled across different routes.

## Solution

Consolidate to a single authentication middleware pattern to:

- Simplify the codebase
- Ensure consistent authentication behavior
- Make future updates easier to maintain

## Implementation Steps

### 1. Choose the Preferred Middleware

After reviewing both implementations, we recommend using `authenticate` from `auth.middleware.js` as the standard middleware because:

- It provides cleaner error handling
- It has better separation of concerns with the `authorize` role-checking function
- Its naming follows the standard RESTful convention

### 2. Update Route Files

Find and replace all instances of `protect` with `authenticate` in route files:

```javascript
// BEFORE:
import { protect } from '../middleware/authMiddleware.js';
router.post('/update-profile', protect, updateProfile);

// AFTER:
import { authenticate } from '../middleware/auth.middleware.js';
router.post('/update-profile', authenticate, updateProfile);
```

#### Route Files to Update:

- `src/routes/user.routes.js`
- `src/routes/order.routes.js`
- `src/routes/cart.routes.js`
- `src/routes/payment.routes.js`
- Any other routes using the `protect` middleware

### 3. Update CheckoutGuard Component

Update the `CheckoutGuard` component to maintain consistency:

```javascript
// BEFORE:
import { protect } from '../middleware/authMiddleware.js';
import { canCheckout } from '../middleware/checkoutMiddleware.js';
router.post('/', protect, canCheckout, createOrder);

// AFTER:
import { authenticate } from '../middleware/auth.middleware.js';
import { canCheckout } from '../middleware/checkoutMiddleware.js';
router.post('/', authenticate, canCheckout, createOrder);
```

### 4. Consider Role-Based Authorization

If role-based checks are needed:

```javascript
// Use the authenticate and authorize combo:
import { authenticate, authorize } from '../middleware/auth.middleware.js';

// Admin-only route
router.get('/users', authenticate, authorize('admin'), getUsers);

// User route (self or admin)
router.get('/users/:id', authenticate, getUserById);
```

### 5. Testing Authentication

After making these changes, test all protected routes to ensure:

- Authentication is properly enforced
- JWT token validation works correctly
- Error handling is consistent
- User role restrictions are maintained

## Code Cleanup

After confirming everything works correctly:

1. Consider deprecating `authMiddleware.js` with a comment indicating it's no longer used and will be removed in the future

2. Document in `auth.middleware.js` that this is the standard authentication middleware for the application

3. Update any developer documentation to reflect the standardized authentication approach

## Example: User Routes Conversion

```javascript
// BEFORE: src/routes/user.routes.js
import express from 'express';
import {
  getUsers, getUserById, updateUser, deleteUser,
} from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  updateProfile,
  sendOTP,
  verifyOTP,
  getProfileStatus
} from '../controllers/user.controller.js';

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

// Admin only routes
router.get('/', authorize('admin'), getUsers);

// User routes (self or admin)
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

// Protected routes (require authentication)
router.post('/update-profile', protect, updateProfile);
router.post('/send-otp', protect, sendOTP);
router.post('/verify-otp', protect, verifyOTP);
router.get('/profile-status', protect, getProfileStatus);

export default router;

// AFTER: src/routes/user.routes.js
import express from 'express';
import {
  getUsers, getUserById, updateUser, deleteUser,
} from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import {
  updateProfile,
  sendOTP,
  verifyOTP,
  getProfileStatus
} from '../controllers/user.controller.js';

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

// Admin only routes
router.get('/', authorize('admin'), getUsers);

// User routes (self or admin)
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

// Protected routes (already authenticated by router.use(authenticate))
router.post('/update-profile', updateProfile);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.get('/profile-status', getProfileStatus);

export default router;
```

By implementing these changes, we will have a more consistent, maintainable authentication system throughout the application. 