import eventService from '../services/recommendation/event.service.js';

/**
 * Middleware to track user events for product views, searches, etc.
 * This middleware doesn't block the response
 */
export const trackEvent = (eventType) => async (req, res, next) => {
  try {
    // Only track events for authenticated users
    if (!req.user || !req.user._id) {
      return next();
    }

    // Set up event data
    const eventData = {
      userId: req.user._id,
      eventType,
      sessionId: req.cookies?.sessionId || req.sessionID,
      referrer: req.get('Referrer'),
      metadata: {},
    };

    // Add specific data based on event type
    switch (eventType) {
      case 'view':
        // For product views
        eventData.productId = req.params.id || req.params.productId;
        eventData.metadata.source = req.query.source;
        break;

      case 'add_to_cart':
        // For add to cart events
        eventData.productId = req.body.productId;
        eventData.metadata.quantity = req.body.quantity;
        eventData.metadata.variant = req.body.variant;
        break;

      case 'purchase':
        // For purchase events
        // This might be called from the order controller after payment confirmation
        eventData.productId = req.body.productId || req.params.productId;
        eventData.metadata.orderId = req.body.orderId || req.params.orderId;
        eventData.metadata.quantity = req.body.quantity;
        break;

      case 'search':
        // For search events
        eventData.searchQuery = req.query.q || req.body.query;
        eventData.metadata.filters = req.query.filters || req.body.filters;
        eventData.metadata.results = req.responseData?.count;
        break;

      case 'category_view':
        // For category browsing
        eventData.categoryId = req.params.id || req.params.categoryId;
        break;
    }

    // Track the event asynchronously (don't await)
    // This ensures the tracking doesn't block the response
    eventService.trackEvent(eventData)
      .catch((err) => console.error('Failed to track event:', err));

    // Continue with the request
    next();
  } catch (error) {
    // Log error but don't interrupt the user flow
    console.error('Error in event tracking middleware:', error);
    next();
  }
};

export default { trackEvent };
