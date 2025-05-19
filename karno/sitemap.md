# Karno E-commerce Platform Sitemap

This document provides a comprehensive overview of the Karno e-commerce platform's file and directory structure, including both frontend and backend components.

## Project Root
- `README.md`
- `DEPLOYMENT.md`
- `netlify.toml`
- `.env.example` - Environment variables template
- `.gitignore` - Git ignore rules

## Frontend Structure

### Root Files
- `frontend/package.json` - Project dependencies and scripts
- `frontend/package-lock.json` - Dependency lock file
- `frontend/index.html` - Main HTML entry point
- `frontend/netlify.toml` - Netlify deployment configuration

### Source Files (`frontend/src/`)

#### Core Files
- `index.js` - Main React entry point
- `index.css` - Global CSS styles
- `App.js` - Main application component
- `firebase.js` - Firebase configuration and initialization

#### Assets
- `assets/` - Static assets directory

#### Components
- `components/AdminHeader.js` - Admin dashboard header component
- `components/AdminRoute.js` - Route protection for admin pages
- `components/BrandCard.js` - Brand display card component
- `components/FeaturedBrands.js` - Featured brands section
- `components/FeaturedCategories.js` - Featured categories section
- `components/FilterSidebar.js` - Product filtering sidebar
- `components/Footer.js` - Site footer component
- `components/Header.js` - Main site header
- `components/HeroSection.js` - Homepage hero section
- `components/LoadingSpinner.js` - Loading indicator
- `components/MobileMenu.js` - Mobile navigation menu
- `components/ProductCard.js` - Product display card
- `components/ProductImageGallery.js` - Product image gallery
- `components/ProtectedRoute.js` - Route protection for authenticated users
- `components/RecommendedProducts.js` - Recommended products section
- `components/RelatedProducts.js` - Related products section
- `components/ReviewSection.js` - Product reviews section
- `components/ScrollToTop.js` - Scroll to top utility
- `components/SearchBar.js` - Search functionality
- `components/WhyChooseUs.js` - Features/benefits section

#### Layouts
- `layouts/AdminLayout.js` - Layout wrapper for admin pages
- `layouts/MainLayout.js` - Layout wrapper for main site pages

#### Pages
- `pages/About.js` - About page
- `pages/Blog.js` - Blog listing page
- `pages/BlogPost.js` - Individual blog post page
- `pages/BrandDetail.js` - Brand detail page
- `pages/Brands.js` - Brands listing page
- `pages/Cart.js` - Shopping cart page
- `pages/Checkout.js` - Checkout process page
- `pages/Contact.js` - Contact page
- `pages/EditProfile.js` - User profile editing
- `pages/ForgotPassword.js` - Password recovery page
- `pages/Home.js` - Homepage
- `pages/Login.js` - User login page
- `pages/NotFound.js` - 404 error page
- `pages/Orders.js` - User orders page
- `pages/PrivacyPolicy.js` - Privacy policy page
- `pages/ProductDetail.js` - Product detail page
- `pages/ProductList.js` - Product listing page
- `pages/Products.js` - Products browse page
- `pages/Profile.js` - User profile page
- `pages/Register.js` - User registration page
- `pages/ResetPassword.js` - Password reset page
- `pages/Terms.js` - Terms and conditions page

#### Error Pages
- `pages/errors/ServerError.js` - 500 server error page
- `pages/errors/Forbidden.js` - 403 forbidden page
- `pages/errors/NotFound.js` - 404 not found page

#### Admin Pages
- `pages/admin/Brands.js` - Admin brands management
- `pages/admin/Categories.js` - Admin categories management
- `pages/admin/Dashboard.js` - Admin dashboard
- `pages/admin/Orders.js` - Admin orders management
- `pages/admin/Products.js` - Admin products management
- `pages/admin/Users.js` - Admin user management

#### Services
- `services/api.js` - API configuration and base setup
- `services/auth.service.js` - Authentication service
- `services/category.service.js` - Category data service
- `services/index.js` - Services export file
- `services/order.service.js` - Order management service
- `services/payment.service.js` - Payment processing service
- `services/product.service.js` - Product data service

#### Store (Redux)
- `store/index.js` - Redux store configuration
- `store/slices/authSlice.js` - Authentication state management
- `store/slices/cartSlice.js` - Shopping cart state management
- `store/slices/productSlice.js` - Product state management
- `store/slices/uiSlice.js` - UI state management

#### Styles
- `styles/global.css` - Global CSS styles

#### Utils
- `utils/theme.js` - Theme configuration

## Backend Structure

### Root Files
- `backend/package.json` - Project dependencies and scripts
- `backend/package-lock.json` - Dependency lock file
- `backend/.env.example` - Environment variables template

### Source Files (`backend/src/`)

#### Core Files
- `server.js` - Main Express server entry point

#### Configuration
- `config/database.js` - MongoDB database configuration
- `config/security.js` - Security configuration
- `config/firebase.js` - Firebase configuration using environment variables

#### Controllers
- `controllers/auth.controller.js` - Authentication controller
- `controllers/category.controller.js` - Category management
- `controllers/dashboard.controller.js` - Admin dashboard data
- `controllers/order.controller.js` - Order management
- `controllers/payment.controller.js` - Payment processing
- `controllers/product-analytics.controller.js` - Product analytics
- `controllers/product.controller.js` - Product management
- `controllers/user.controller.js` - User management

#### Middleware
- `middleware/auth.middleware.js` - Authentication middleware
- `middleware/errorHandler.js` - Error handling middleware

#### Models
- `models/brand.model.js` - Brand data model
- `models/category.model.js` - Category data model
- `models/index.js` - Models export file
- `models/order.model.js` - Order data model
- `models/product.model.js` - Product data model
- `models/user.model.js` - User data model

#### Routes
- `routes/auth.routes.js` - Authentication routes
- `routes/category.routes.js` - Category API routes
- `routes/dashboard.routes.js` - Admin dashboard routes
- `routes/order.routes.js` - Order management routes
- `routes/payment.routes.js` - Payment processing routes
- `routes/product.routes.js` - Product API routes
- `routes/user.routes.js` - User management routes

#### Utils
- `utils/adminSeeder.js` - Admin user seeding utility
- `utils/createAdminUser.js` - Admin user creation utility
- `utils/email.js` - Email sending utility
- `utils/fileUpload.js` - File upload handling
- `utils/logger.js` - Logging utility

#### Public
- `public/uploads/products/` - Product image uploads directory

#### Logs
- `logs/` - Application logs directory
