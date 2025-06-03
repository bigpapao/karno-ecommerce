# Karno E-commerce Guest Checkout Implementation

## Overview

This document outlines the implementation of guest checkout functionality in the Karno auto parts e-commerce platform. The guest checkout flow allows users to browse products, add items to their cart, and complete purchases without creating an account. Users have the option to create an account during checkout if desired.

## Key Features

1. **Guest Cart Management**
   - Session-based cart tracking using browser local storage
   - Seamless transition between guest and authenticated user carts
   - Cart merging when guest users log in or create an account

2. **Guest Checkout Process**
   - Streamlined checkout form with required shipping and payment information
   - Optional account creation during checkout
   - Order tracking via email and tracking code (no login required)

3. **Back-end Implementation**
   - MongoDB models updated to support guest carts and orders
   - API endpoints for guest cart and order operations
   - Security measures to protect guest data

## Technical Implementation

### Front-end Components

1. **Session Management**
   - `sessionUtils.js`: Handles guest session IDs and session state
   - Session ID generated using UUID and stored in localStorage

2. **Cart Functionality**
   - `cartUtils.js`: Provides functions for cart operations (add, update, remove)
   - Handles both authenticated and guest cart operations
   - Abstraction layer to use API or localStorage as appropriate

3. **Authentication**
   - `AuthModal.js`: Updated to support cart merging during login/signup
   - `ProtectedRoute.js`: Modified to show auth modal for checkout instead of redirecting

4. **Checkout**
   - `Checkout.js`: Enhanced with guest checkout flow and account creation options
   - Form validation for guest user information
   - Phone number validation and normalization

### Back-end Components

1. **Models**
   - `cart.model.js`: Updated with sessionId field for guest carts
   - `order.model.js`: Added guestInfo schema for guest orders

2. **Controllers**
   - `cart.controller.js`: New methods for guest cart operations
   - `order.controller.js`: Added guest order creation and retrieval
   - `auth.controller.js`: Updated to handle cart merging during authentication

3. **Routes**
   - `cart.routes.js`: Added routes for guest cart operations
   - `order.routes.js`: Added routes for guest orders

4. **Utilities**
   - `phoneUtils.js`: For phone number normalization and validation
   - `orderUtils.js`: For order number and tracking code generation
   - `guestOrderToken.js`: For secure guest order access

## User Flow

1. **Guest Browsing & Cart**
   - User visits site without logging in
   - Adds products to cart (stored in localStorage and synced to database with sessionId)
   - Cart persists between sessions via localStorage

2. **Guest Checkout**
   - User proceeds to checkout
   - Enters shipping and payment information
   - Optionally creates an account
   - Receives order confirmation and tracking code

3. **Order Tracking**
   - User can track order status using order number and email/phone
   - No login required for basic order tracking

4. **Account Creation (Optional)**
   - During checkout, user can choose to create an account
   - Cart items and order history are automatically associated with the new account

## Security Considerations

1. **Data Protection**
   - Guest data handled with the same security measures as registered users
   - Personal information not stored permanently unless account is created

2. **Order Access**
   - JWT-based tokens for guest order access
   - Orders accessible only with valid token or account credentials

3. **Session Management**
   - Session IDs are random UUIDs, making them difficult to guess
   - Cart data tied to specific session IDs

## Database Fixes

The implementation includes utilities to address potential database issues:

1. **fixDuplicatePhones.js**: Normalizes and fixes duplicate phone numbers
2. **fixIndexes.js**: Repairs MongoDB index issues
3. **fixDuplicateKeyErrors.js**: Resolves E11000 duplicate key errors

## Testing

To verify the guest checkout flow:

1. Clear browser local storage to start fresh
2. Browse products and add items to cart without logging in
3. Proceed to checkout and complete the form without creating an account
4. Verify order confirmation and ability to track order
5. Test cart merging by creating an account after adding items to cart 