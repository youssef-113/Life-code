/**
 * Global Error Handling Middleware
 * Centralizes error handling for all API routes
 */

/**
 * Custom API Error class
 * Allows for structured error responses with status codes
 */
export class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      message: this.message,
      ...(this.details && { details: this.details }),
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
    };
  }
}

/**
 * Async handler wrapper
 * Eliminates need for try-catch in every async controller
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global error handler middleware
 * Must be registered after all routes
 */
export const globalErrorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle ApiError instances
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Handle Firebase errors
  if (err.code && err.code.startsWith('auth/')) {
    const statusCode = err.code === 'auth/user-not-found' ? 404 : 401;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Authentication error'
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token has expired'
    });
  }

  // Handle validation errors (e.g., from express-validator)
  if (err.name === 'ValidationError' || err.array) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: err.array ? err.array() : err.message
    });
  }

  // Handle Firestore errors
  if (err.code && (err.code.includes('firestore') || err.code.includes('firebase'))) {
    return res.status(500).json({
      success: false,
      message: 'Database error occurred',
      ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 
    ? 'Internal server error' 
    : err.message || 'Something went wrong';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { 
      error: err.message,
      stack: err.stack 
    })
  });
};

/**
 * 404 Not Found handler
 * Handles requests to undefined routes
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
};

/**
 * Request validation helper
 * Validates required fields in request body
 * @param {Object} body - Request body
 * @param {Array} requiredFields - List of required field names
 * @throws {ApiError} If validation fails
 */
export const validateRequiredFields = (body, requiredFields) => {
  const missingFields = requiredFields.filter(field => {
    const value = body[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    throw new ApiError(
      400,
      'Missing required fields',
      { missingFields }
    );
  }
};

/**
 * Sanitize string input
 * Removes potentially dangerous characters
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
export const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};
