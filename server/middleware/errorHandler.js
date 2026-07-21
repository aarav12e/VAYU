/**
 * Async Handler Wrapper to eliminate try/catch boilerplate in controllers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Global HTTP Error Handler Middleware
 */
const globalErrorHandler = (err, req, res, _next) => {
  console.error(`❌ API Error [${req.method} ${req.originalUrl}]:`, err.message || err);

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = {
  asyncHandler,
  globalErrorHandler,
};
