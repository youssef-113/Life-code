const rateLimit = require('express-rate-limit');

/**
 * Rate Limiting Middleware - Protects against brute force attacks
 */

// Login rate limiter - Strict (5 attempts per 15 minutes)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Too many login attempts. Please try again after 15 minutes.',
    code: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Key by IP + email to prevent distributed attacks
  keyGenerator: (req) => {
    const email = req.body?.email || 'unknown';
    return `${req.ip}-${email}`;
  },
  // Skip successful requests (don't count against limit)
  skipSuccessfulRequests: true,
  // Log when limit is reached
  handler: (req, res) => {
    console.log(`Rate limit exceeded for login: ${req.ip} - ${req.body?.email}`);
    res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      message: 'Too many login attempts. Please try again after 15 minutes.',
      code: 429
    });
  }
});

// Register rate limiter - Moderate (3 registrations per hour per IP)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Too many registration attempts. Please try again after 1 hour.',
    code: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    console.log(`Rate limit exceeded for registration: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      message: 'Too many registration attempts. Please try again after 1 hour.',
      code: 429
    });
  }
});

// Password reset rate limiter - Very strict (3 attempts per hour)
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Too many password reset attempts. Please try again after 1 hour.',
    code: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = req.body?.email || 'unknown';
    return `pwdreset-${req.ip}-${email}`;
  }
});

// General API rate limiter - Lenient (100 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Too many requests. Please slow down.',
    code: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.userID || req.ip
});

// Refresh token rate limiter (10 refreshes per 15 minutes)
const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Too many token refresh attempts.',
    code: 429
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  apiLimiter,
  refreshTokenLimiter
};
