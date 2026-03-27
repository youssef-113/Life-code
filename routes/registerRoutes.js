const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { registerUser, registerWithGoogle, registerWithApple } = require('../controllers/registerController');

/**
 * Register Routes - User registration endpoints
 */

/**
 * @route POST /api/app/register
 * @description Register new user with email/password
 * @access Public
 */
router.post('/register', [
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

/**
 * @route POST /api/app/register/google
 * @description Register user with Google OAuth
 * @access Public
 */
router.post('/register/google', [
  body('googleID')
    .notEmpty()
    .withMessage('Google ID is required'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Username must be between 2 and 50 characters'),
  body('photoURL')
    .optional()
    .isURL()
    .withMessage('Photo URL must be a valid URL'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Invalid gender value')
], registerWithGoogle);

/**
 * @route POST /api/app/register/apple
 * @description Register user with Apple Sign In
 * @access Public
 */
router.post('/register/apple', [
  body('appleID')
    .notEmpty()
    .withMessage('Apple ID is required'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
], registerWithApple);

module.exports = router;
