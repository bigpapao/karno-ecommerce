/**
 * Google Analytics Utility
 * 
 * This file contains functions for initializing and using Google Analytics in the application.
 * It uses react-ga4 for tracking page views, events, and user interactions.
 */
import React from 'react';
import ReactGA from 'react-ga4';
import { ANALYTICS, FEATURES } from './config';
import api from '../services/api';

/**
 * Initialize Google Analytics
 * @param {boolean} debug - Whether to enable debug mode
 */
export const initializeGA = (debug = false) => {
  // Only initialize if analytics is enabled
  if (FEATURES?.ANALYTICS_ENABLED) {
    // Choose between production and development measurement ID
    const gaId = process.env.NODE_ENV === 'production' 
      ? ANALYTICS.GA_MEASUREMENT_ID 
      : ANALYTICS.GA_DEV_MEASUREMENT_ID;
    
    ReactGA.initialize(gaId, {
      gaOptions: {
        // Disable automatic page view tracking - we'll handle it manually
        // to better control when and what gets tracked
        send_page_view: false
      },
      debug: debug || ANALYTICS.DEBUG
    });
    
    // eslint-disable-next-line no-console
    // Google Analytics initialized in production mode
  }
};

/**
 * Track a page view
 * @param {string} path - The page path to track
 * @param {string} title - The page title
 */
export const trackPageView = (path, title) => {
  if (!path || !FEATURES?.ANALYTICS_ENABLED) {
    return;
  }
  
  ReactGA.send({
    hitType: 'pageview',
    page: path,
    title: title
  });
};

/**
 * Track an event
 * @param {string} category - Event category
 * @param {string} action - Event action
 * @param {string} label - Event label (optional)
 * @param {number} value - Event value (optional)
 */
export const trackEvent = (category, action, label = null, value = null) => {
  if (!FEATURES?.ANALYTICS_ENABLED) {
    return;
  }
  
  ReactGA.event({
    category,
    action,
    ...(label && { label }),
    ...(value !== null && { value })
  });
};

/**
 * Track product view
 * @param {string|number} productId - Product ID
 * @param {string} productName - Product name
 * @param {number} price - Product price
 */
export const trackProductView = (productId, productName, price) => {
  trackEvent('Product', 'View', productName, productId);
  
  // Also track as e-commerce event
  if (FEATURES?.ANALYTICS_ENABLED) {
    ReactGA.gtag('event', 'view_item', {
      items: [{
        item_id: productId,
        item_name: productName,
        price: price || 0
      }]
    });
  }
};

/**
 * Track adding product to cart
 * @param {string|number} productId - Product ID
 * @param {string} productName - Product name
 * @param {number} price - Product price
 * @param {number} quantity - Quantity added
 */
export const trackAddToCart = (productId, productName, price, quantity) => {
  trackEvent('Ecommerce', 'Add to Cart', productName);
  
  // E-commerce specific event
  if (FEATURES?.ANALYTICS_ENABLED) {
    ReactGA.gtag('event', 'add_to_cart', {
      currency: 'IRR',
      value: price * quantity,
      items: [{
        item_id: productId,
        item_name: productName,
        price: price,
        quantity: quantity
      }]
    });
  }
};

/**
 * Track checkout steps
 * @param {number} step - Checkout step number
 * @param {string} option - Checkout option (e.g. shipping method)
 */
export const trackCheckout = (step, option) => {
  trackEvent('Checkout', 'Step', `Step ${step}: ${option}`);
  
  // E-commerce checkout step tracking
  if (FEATURES?.ANALYTICS_ENABLED) {
    ReactGA.gtag('event', 'begin_checkout', {
      checkout_step: step,
      checkout_option: option
    });
  }
};

/**
 * Track purchase completion
 * @param {string} transactionId - Transaction ID
 * @param {number} revenue - Total revenue
 * @param {Array} items - Purchased items
 */
export const trackPurchase = (transactionId, revenue, items) => {
  // E-commerce purchase tracking
  if (FEATURES?.ANALYTICS_ENABLED) {
    ReactGA.gtag('event', 'purchase', {
      transaction_id: transactionId,
      value: revenue,
      currency: 'IRR',
      items: items
    });
  }
};

/**
 * Track search queries
 * @param {string} searchTerm - Search term
 */
export const trackSearch = (searchTerm) => {
  trackEvent('Search', 'Query', searchTerm);
};

/**
 * Track user registration
 * @param {string} method - Registration method
 */
export const trackUserRegistration = (method) => {
  trackEvent('User', 'Signup', method);
};

/**
 * Track user login
 * @param {string} method - Login method
 */
export const trackUserLogin = (method) => {
  trackEvent('User', 'Login', method);
};

/**
 * Track error events
 * @param {string} category - Error category
 * @param {string} message - Error message
 */
export const trackError = (category, message) => {
  trackEvent('Error', category, message);
};

/**
 * Track filter usage
 * @param {string} filterType - Type of filter
 * @param {string} filterValue - Filter value
 */
export const trackFilterUse = (filterType, filterValue) => {
  trackEvent('Filter', filterType, filterValue);
};

/**
 * Track brand page views
 * @param {string|number} brandId - Brand ID
 * @param {string} brandName - Brand name
 */
export const trackBrandView = (brandId, brandName) => {
  trackEvent('Brand', 'View', brandName, brandId);
};

class AnalyticsTracker {
  constructor() {
    this.eventQueue = [];
    this.batchSize = 10;
    this.flushInterval = 5000; // 5 seconds
    this.sessionId = this.generateSessionId();
    this.isEnabled = true;
    
    // Start auto-flush timer
    this.startAutoFlush();
    
    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush(true);
    });
  }
  
  // Generate unique session ID
  generateSessionId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${timestamp}_${random}`;
  }
  
  // Track a single event
  track(eventType, resourceType, resourceId, context = {}, metadata = {}) {
    if (!this.isEnabled) return;
    
    const event = {
      eventType,
      resourceType,
      resourceId,
      sessionId: this.sessionId,
      context: {
        ...context,
        page: window.location.pathname,
        source: context.source || 'direct',
        timestamp: new Date().toISOString()
      },
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    };
    
    this.eventQueue.push(event);
    
    // Auto-flush if queue is full
    if (this.eventQueue.length >= this.batchSize) {
      this.flush();
    }
    
    return event;
  }
  
  // Track category view
  trackCategoryView(categoryId, categoryName, context = {}) {
    return this.track('category_view', 'category', categoryId, context, {
      categoryName,
      timestamp: Date.now()
    });
  }
  
  // Track category click
  trackCategoryClick(categoryId, categoryName, context = {}) {
    return this.track('category_click', 'category', categoryId, context, {
      categoryName,
      clickX: context.clickX,
      clickY: context.clickY,
      position: context.position
    });
  }
  
  // Track category product view (when viewing products in a category)
  trackCategoryProductView(categoryId, categoryName, productId, context = {}) {
    return this.track('category_product_view', 'category', categoryId, context, {
      categoryName,
      productId,
      duration: context.duration
    });
  }
  
  // Track brand view
  trackBrandView(brandId, brandName, context = {}) {
    return this.track('brand_view', 'brand', brandId, context, {
      brandName,
      timestamp: Date.now()
    });
  }
  
  // Track brand click
  trackBrandClick(brandId, brandName, context = {}) {
    return this.track('brand_click', 'brand', brandId, context, {
      brandName,
      clickX: context.clickX,
      clickY: context.clickY,
      position: context.position
    });
  }
  
  // Track brand product view (when viewing products of a brand)
  trackBrandProductView(brandId, brandName, productId, context = {}) {
    return this.track('brand_product_view', 'brand', brandId, context, {
      brandName,
      productId,
      duration: context.duration
    });
  }
  
  // Track search events
  trackCategorySearch(query, results = [], context = {}) {
    return this.track('search_category', 'category', null, {
      ...context,
      searchQuery: query,
      resultCount: results.length
    }, {
      searchResults: results.slice(0, 10), // Limit to first 10 results
      searchDuration: context.searchDuration
    });
  }
  
  trackBrandSearch(query, results = [], context = {}) {
    return this.track('search_brand', 'brand', null, {
      ...context,
      searchQuery: query,
      resultCount: results.length
    }, {
      searchResults: results.slice(0, 10),
      searchDuration: context.searchDuration
    });
  }
  
  // Track filter usage
  trackCategoryFilter(categoryId, filters, context = {}) {
    return this.track('filter_category', 'category', categoryId, context, {
      filters,
      filterCount: Object.keys(filters).length
    });
  }
  
  trackBrandFilter(brandId, filters, context = {}) {
    return this.track('filter_brand', 'brand', brandId, context, {
      filters,
      filterCount: Object.keys(filters).length
    });
  }
  
  // Track scroll depth
  trackScrollDepth(resourceType, resourceId, scrollPercentage) {
    return this.track(`${resourceType}_scroll`, resourceType, resourceId, {
      scrollDepth: scrollPercentage
    }, {
      scrollPercentage,
      pageHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight
    });
  }
  
  // Track time spent on page/section
  trackTimeSpent(resourceType, resourceId, duration, context = {}) {
    return this.track(`${resourceType}_time`, resourceType, resourceId, context, {
      duration,
      engaged: duration > 10000 // Consider 10+ seconds as engaged
    });
  }
  
  // Flush events to server
  async flush(synchronous = false) {
    if (this.eventQueue.length === 0) return;
    
    const events = [...this.eventQueue];
    this.eventQueue = [];
    
    try {
      if (synchronous) {
        // Use sendBeacon for synchronous sending (on page unload)
        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            '/api/analytics/track-batch',
            JSON.stringify({ events })
          );
        }
      } else {
        // Regular async request
        await api.post('/analytics/track-batch', { events });
      }
    } catch (error) {
      // Analytics events failed to send - error logged internally
      // Re-queue events on failure (with limit to prevent infinite growth)
      if (this.eventQueue.length < 100) {
        this.eventQueue.unshift(...events);
      }
    }
  }
  
  // Start auto-flush timer
  startAutoFlush() {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }
  
  // Stop tracking
  disable() {
    this.isEnabled = false;
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
  }
  
  // Enable tracking
  enable() {
    this.isEnabled = true;
    if (!this.flushTimer) {
      this.startAutoFlush();
    }
  }
  
  // Get queue status
  getQueueStatus() {
    return {
      queueSize: this.eventQueue.length,
      isEnabled: this.isEnabled,
      sessionId: this.sessionId
    };
  }
  
  // Manual batch send
  async sendEvents(events) {
    try {
      await api.post('/analytics/track-batch', { events });
      return true;
    } catch (error) {
      // Failed to send events - error handled internally
      return false;
    }
  }
}

// Create singleton instance
const analytics = new AnalyticsTracker();

// React Hook for analytics
export const useAnalytics = () => {
  const trackCategoryView = (categoryId, categoryName, context) => 
    analytics.trackCategoryView(categoryId, categoryName, context);
    
  const trackCategoryClick = (categoryId, categoryName, context) => 
    analytics.trackCategoryClick(categoryId, categoryName, context);
    
  const trackCategoryProductView = (categoryId, categoryName, productId, context) => 
    analytics.trackCategoryProductView(categoryId, categoryName, productId, context);
    
  const trackBrandView = (brandId, brandName, context) => 
    analytics.trackBrandView(brandId, brandName, context);
    
  const trackBrandClick = (brandId, brandName, context) => 
    analytics.trackBrandClick(brandId, brandName, context);
    
  const trackBrandProductView = (brandId, brandName, productId, context) => 
    analytics.trackBrandProductView(brandId, brandName, productId, context);
    
  const trackSearch = (type, query, results, context) => {
    if (type === 'category') {
      return analytics.trackCategorySearch(query, results, context);
    } else if (type === 'brand') {
      return analytics.trackBrandSearch(query, results, context);
    }
  };
  
  const trackFilter = (type, resourceId, filters, context) => {
    if (type === 'category') {
      return analytics.trackCategoryFilter(resourceId, filters, context);
    } else if (type === 'brand') {
      return analytics.trackBrandFilter(resourceId, filters, context);
    }
  };
  
  const trackScrollDepth = (resourceType, resourceId, scrollPercentage) => 
    analytics.trackScrollDepth(resourceType, resourceId, scrollPercentage);
    
  const trackTimeSpent = (resourceType, resourceId, duration, context) => 
    analytics.trackTimeSpent(resourceType, resourceId, duration, context);
  
  return {
    trackCategoryView,
    trackCategoryClick,
    trackCategoryProductView,
    trackBrandView,
    trackBrandClick,
    trackBrandProductView,
  trackSearch,
    trackFilter,
    trackScrollDepth,
    trackTimeSpent,
    flush: () => analytics.flush(),
    getQueueStatus: () => analytics.getQueueStatus()
  };
};

// Higher-order component for automatic view tracking
export const withAnalytics = (WrappedComponent, resourceType) => {
  return function AnalyticsWrapper(props) {
    const analytics = useAnalytics();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useEffect(() => {
      if (props.resourceId && props.resourceName) {
        if (resourceType === 'category') {
          analytics.trackCategoryView(props.resourceId, props.resourceName, {
            source: 'page_load'
          });
        } else if (resourceType === 'brand') {
          analytics.trackBrandView(props.resourceId, props.resourceName, {
            source: 'page_load'
          });
        }
      }
    }, [analytics, props.resourceId, props.resourceName]);
    
    return <WrappedComponent {...props} analytics={analytics} />;
  };
};

// Utility functions for tracking specific interactions
export const trackElementClick = (element, resourceType, resourceId, resourceName) => {
  element.addEventListener('click', (event) => {
    const context = {
      clickX: event.clientX,
      clickY: event.clientY,
      source: 'element_click'
    };
    
    if (resourceType === 'category') {
      analytics.trackCategoryClick(resourceId, resourceName, context);
    } else if (resourceType === 'brand') {
      analytics.trackBrandClick(resourceId, resourceName, context);
    }
  });
};

// Scroll tracking utility
export const setupScrollTracking = (resourceType, resourceId) => {
  let maxScrollDepth = 0;
  let scrollTimeout;
  
  const handleScroll = () => {
    clearTimeout(scrollTimeout);
    
    scrollTimeout = setTimeout(() => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);
      
      if (scrollPercent > maxScrollDepth && scrollPercent % 25 === 0) {
        maxScrollDepth = scrollPercent;
        analytics.trackScrollDepth(resourceType, resourceId, scrollPercent);
      }
    }, 250);
  };
  
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  return () => {
    window.removeEventListener('scroll', handleScroll);
    clearTimeout(scrollTimeout);
  };
};

// Time tracking utility
export const setupTimeTracking = (resourceType, resourceId) => {
  const startTime = Date.now();
  let isActive = true;
  
  const handleVisibilityChange = () => {
    if (document.hidden) {
      isActive = false;
      const duration = Date.now() - startTime;
      analytics.trackTimeSpent(resourceType, resourceId, duration, {
        active: false,
        endReason: 'visibility_hidden'
      });
    } else {
      isActive = true;
    }
  };
  
  const handleBeforeUnload = () => {
    if (isActive) {
      const duration = Date.now() - startTime;
      analytics.trackTimeSpent(resourceType, resourceId, duration, {
        active: true,
        endReason: 'page_unload'
      });
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
};

export default analytics; 