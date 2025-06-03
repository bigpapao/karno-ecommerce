/**
 * Async Error Handler
 *
 * Wraps async controller functions to catch errors and pass them to the next middleware.
 * This eliminates the need for try-catch blocks in controller functions.
 *
 * @param {Function} fn - The async controller function to wrap
 * @returns {Function} - Middleware function that calls the controller and catches any errors
 */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
