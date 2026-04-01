const authService = require('../services/authService');
const { validationResult } = require('express-validator');

/**
 * Register Controller - Handles user registration
 * 
 * Note: Google and Apple authentication now handled by socialAuthController
 * Use POST /api/app/auth/google and POST /api/app/auth/apple instead
 */

/**
 * Register new user with email/password
 * @route POST /api/app/register
 * @access Public
 */
const registerUser = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: errors.array()[0].msg,
        code: 400
      });
    }

    const { name, email, password, confirmPassword } = req.body;

    // Validate required fields
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Name, email, password, and confirmPassword are required',
        code: 400
      });
    }

    // Validate name length
    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Name must be between 2 and 50 characters',
        code: 400
      });
    }

    // Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Passwords do not match',
        code: 400
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Password must be at least 8 characters',
        code: 400
      });
    }

    // Register user
    const result = await authService.registerUser({
      username: name,
      email,
      password,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress
    });

    const statusCode = result.success ? 201 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Register controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

module.exports = {
  registerUser
};
