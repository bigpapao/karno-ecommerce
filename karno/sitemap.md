# Karno Web Application - Complete Sitemap

## Frontend Routes

### Public Routes
/                       → frontend/src/pages/Home.js
/login                  → frontend/src/pages/Login.js
/register               → frontend/src/pages/Register.js
/phone-login            → frontend/src/pages/PhoneLogin.js
/forgot-password        → frontend/src/pages/ForgotPassword.js
/reset-password/:token  → frontend/src/pages/ResetPassword.js
/verify-email/:token    → frontend/src/pages/VerifyEmail.js

### Products & Catalog
/products               → frontend/src/pages/Products.js
  /products/:id         → frontend/src/pages/ProductDetail.js
/brands                 → frontend/src/pages/Brands.js
  /brands/:brandSlug    → frontend/src/pages/BrandDetail.js
/models                 → frontend/src/pages/Models.js
  /models/:id           → frontend/src/pages/ModelDetail.js

### Shopping Experience
/cart                   → frontend/src/pages/Cart.js
/checkout               → frontend/src/pages/Checkout.js (Protected, CheckoutGuard.js)

### User Account (Protected)
/profile                → frontend/src/pages/Profile.js (Protected, ProtectedRoute.js)
  /profile/edit         → frontend/src/pages/EditProfile.js (Protected)
/orders                 → frontend/src/pages/Orders.js (Protected)
  /orders/:orderId      → frontend/src/pages/OrderDetail.js (Protected)
/addresses              → frontend/src/pages/Addresses.js (Protected)

### Other Public Pages
/contact                → frontend/src/pages/Contact.js
/500                    → frontend/src/pages/errors/ServerError.js
/403                    → frontend/src/pages/errors/Forbidden.js
/* (catchall)           → frontend/src/pages/NotFoundPage.js

### Admin Panel (Protected)
/admin                  → frontend/src/pages/admin/Dashboard.js (AdminRoute.js)
  /admin/products       → frontend/src/pages/admin/Products.js (AdminRoute.js)
  /admin/orders         → frontend/src/pages/admin/Orders.js (AdminRoute.js)
  /admin/users          → frontend/src/pages/admin/Users.js (AdminRoute.js)
  /admin/categories     → frontend/src/pages/admin/Categories.js (AdminRoute.js)
  /admin/brands         → frontend/src/pages/admin/Brands.js (AdminRoute.js)
  /admin/settings       → frontend/src/pages/admin/Settings.js (AdminRoute.js)

## Backend API Routes

### Authentication & User
/api/auth/login                → backend/src/controllers/auth.core.controller.js
/api/auth/register             → backend/src/controllers/auth.core.controller.js
/api/auth/request-verification → backend/src/controllers/auth.core.controller.js
/api/auth/verify-phone         → backend/src/controllers/auth.core.controller.js
/api/auth/refresh-token        → backend/src/controllers/auth.core.controller.js
/api/auth/logout               → backend/src/controllers/auth.core.controller.js
/api/auth/verify-email/:token  → backend/src/controllers/auth.core.controller.js
/api/auth/profile              → backend/src/controllers/auth.profile.controller.js
/api/auth/forgot-password      → backend/src/controllers/auth.profile.controller.js
/api/auth/reset-password       → backend/src/controllers/auth.profile.controller.js

### Cart & Checkout
/api/cart                      → backend/src/controllers/cart.controller.js
  /api/cart/items              → backend/src/controllers/cart.controller.js
  /api/cart/guest/:sessionId   → backend/src/controllers/cart.controller.js
  /api/cart/merge/:sessionId   → backend/src/controllers/cart.controller.js
  /api/cart/promos             → backend/src/controllers/cart.controller.js
/api/checkout                  → backend/src/controllers/checkout.controller.js
  /api/checkout/payment        → backend/src/controllers/payment.controller.js

### Products & Catalog
/api/products                  → backend/src/controllers/product.controller.js
  /api/products/:id            → backend/src/controllers/product.controller.js
  /api/products/featured       → backend/src/controllers/product.controller.js
  /api/products/search         → backend/src/controllers/product.controller.js
/api/brands                    → backend/src/controllers/brand.controller.js
  /api/brands/:id              → backend/src/controllers/brand.controller.js
/api/categories                → backend/src/controllers/category.controller.js
  /api/categories/:id          → backend/src/controllers/category.controller.js
/api/models                    → backend/src/controllers/model.controller.js
  /api/models/:id              → backend/src/controllers/model.controller.js

### Orders
/api/orders                    → backend/src/controllers/order.controller.js
  /api/orders/:id              → backend/src/controllers/order.controller.js
  /api/orders/:id/status       → backend/src/controllers/order.controller.js

## Core Layout Components
- Main Layout: frontend/src/layouts/MainLayout.js (Used for public and user pages)
- Admin Layout: frontend/src/layouts/AdminLayout.js (Used for admin panel)

## Authentication & Protection Components
- ProtectedRoute: frontend/src/components/ProtectedRoute.js
- AdminRoute: frontend/src/components/AdminRoute.js
- CheckoutGuard: frontend/src/components/CheckoutGuard.js
- AuthModal: frontend/src/components/AuthModal.js
- OTPVerificationModal: frontend/src/components/OTPVerificationModal.js 