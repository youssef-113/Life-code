const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { registerUser } = require('../controllers/registerController');
const { registerLimiter } = require('../middleware/rateLimitMiddleware');

/**
 * Register Routes - User registration endpoints
 * 
 * Note: Google and Apple authentication now handled by socialAuthRoutes
 * Use POST /api/app/auth/google and POST /api/app/auth/apple instead
 */

/**
 * @route POST /api/app/register
 * @description Register new user with email/password
 * @access Public
 */
router.post('/register', registerLimiter, [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
], registerUser);

module.exports = router;
