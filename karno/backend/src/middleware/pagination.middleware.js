/**
 * Pagination Middleware
 * Adds pagination parameters to the request object
 */

export const paginationMiddleware = (req, res, next) => {
  // Default values
  const defaultLimit = 10;
  const defaultPage = 1;
  const maxLimit = 100;

  // Get pagination parameters from query
  const page = parseInt(req.query.page, 10) || defaultPage;
  const limit = parseInt(req.query.limit, 10) || defaultLimit;

  // Validate and sanitize parameters
  const sanitizedPage = Math.max(1, page);
  const sanitizedLimit = Math.min(Math.max(1, limit), maxLimit);

  // Calculate skip value
  const skip = (sanitizedPage - 1) * sanitizedLimit;

  // Add pagination parameters to request
  req.pagination = {
    page: sanitizedPage,
    limit: sanitizedLimit,
    skip,
  };

  next();
};
