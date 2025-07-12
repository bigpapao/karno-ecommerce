import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthModalProvider } from './contexts/AuthModalContext';
import AppInitializer from './components/AppInitializer';

import { ThemeProvider } from '@mui/material/styles';
import { Provider } from 'react-redux';
import store from './store';
import theme from './theme';

import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { DirectionProvider } from './contexts/DirectionContext';
import ScrollToTop from './components/ScrollToTop';
import GoogleAnalytics from './components/GoogleAnalytics';
import LoadingSpinner from './components/LoadingSpinner';
import CheckoutGuard from './components/CheckoutGuard';

import NotFoundPage from './pages/NotFoundPage';

// Layouts
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

// Core pages - immediate loading
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ServerError from './pages/errors/ServerError';
import Forbidden from './pages/errors/Forbidden';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Lazy-loaded pages for better performance
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Categories = lazy(() => import('./pages/Categories'));
const CategoryDemo = lazy(() => import('./pages/CategoryDemo'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const Brands = lazy(() => import('./pages/Brands'));
const BrandDetail = lazy(() => import('./pages/BrandDetail'));
const Models = lazy(() => import('./pages/Models'));
const ModelDetail = lazy(() => import('./pages/ModelDetail'));
const Contact = lazy(() => import('./pages/Contact'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Profile = lazy(() => import('./pages/Profile'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const Addresses = lazy(() => import('./pages/Addresses'));
const ContactUs = lazy(() => import('./pages/ContactUs'));

// Lazy-loaded admin pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('./pages/admin/Products'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminCategories = lazy(() => import('./pages/admin/Categories'));
const AdminBrands = lazy(() => import('./pages/admin/Brands'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics'));


// Service worker registration for PWA capabilities
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => console.log('SW registered'))
      .catch(error => console.log('SW error', error));
  });
}

function App() {

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ErrorBoundary>
          <DirectionProvider>
            <AuthProvider>
              <CartProvider>
                <AuthModalProvider>
                  <AppInitializer>
                    <ScrollToTop />
                    <GoogleAnalytics debug={process.env.NODE_ENV === 'development'} />
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<MainLayout />}>
                      <Route index element={<Home />} />
                      <Route path="login" element={<Login />} />
                      <Route path="register" element={<Register />} />
                      <Route path="forgot-password" element={<Navigate to="/login" replace />} />
                      <Route path="reset-password/:token" element={<Navigate to="/login" replace />} />
                      <Route path="verify-email/:token" element={<Navigate to="/login" replace />} />
                      
                      {/* Lazy-loaded routes with suspense fallback */}
                      <Route path="products" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <Products />
                        </Suspense>
                      } />
                      <Route path="products/:id" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <ProductDetail />
                        </Suspense>
                      } />
                      <Route path="categories" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <Categories />
                        </Suspense>
                      } />
                      <Route path="category-demo" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <CategoryDemo />
                        </Suspense>
                      } />
                      <Route path="search" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <SearchResults />
                        </Suspense>
                      } />
                      <Route path="brands" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <Brands />
                        </Suspense>
                      } />
                      <Route path="brands/:brandSlug" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <BrandDetail />
                        </Suspense>
                      } />
                      <Route path="models" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <Models />
                        </Suspense>
                      } />
                      <Route path="models/:id" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <ModelDetail />
                        </Suspense>
                      } />
                      <Route path="contact" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <Contact />
                        </Suspense>
                      } />
                      <Route path="contact-us" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <ContactUs />
                        </Suspense>
                      } />
                      <Route path="cart" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <Cart />
                        </Suspense>
                      } />
                      <Route path="500" element={<ServerError />} />
                      <Route path="403" element={<Forbidden />} />
                      
                      <Route path="*" element={<NotFoundPage />} />
                      
                      {/* Protected Routes with outlet */}
                      <Route element={<ProtectedRoute />}>
                        <Route path="checkout" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <CheckoutGuard>
                              <Checkout />
                            </CheckoutGuard>
                          </Suspense>
                        } />
                        <Route path="profile" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <Profile />
                          </Suspense>
                        } />
                        <Route path="profile/edit" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <EditProfile />
                          </Suspense>
                        } />
                        <Route path="orders" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <Orders />
                          </Suspense>
                        } />
                        <Route path="orders/:orderId" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <OrderDetail />
                          </Suspense>
                        } />
                        <Route path="addresses" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <Addresses />
                          </Suspense>
                        } />
                      </Route>
                    </Route>

                    {/* Admin Routes */}
                    <Route 
                      path="/admin" 
                      element={
                        <AdminRoute>
                          <AdminLayout />
                        </AdminRoute>
                      }
                    >
                      <Route index element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <AdminDashboard />
                        </Suspense>
                      } />
                      <Route path="products" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <AdminProducts />
                        </Suspense>
                      } />
                      <Route path="orders" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <AdminOrders />
                        </Suspense>
                      } />
                      <Route path="users" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <AdminUsers />
                        </Suspense>
                      } />
                      <Route path="categories" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <AdminCategories />
                        </Suspense>
                      } />
                      <Route path="brands" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <AdminBrands />
                        </Suspense>
                      } />
                      <Route path="settings" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <AdminSettings />
                        </Suspense>
                      } />
                      <Route path="analytics" element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <AdminAnalytics />
                        </Suspense>
                      } />
                    </Route>
                  </Routes>
                  </AppInitializer>
                </AuthModalProvider>
              </CartProvider>
            </AuthProvider>
          </DirectionProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
