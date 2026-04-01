const { validationResult } = require('express-validator');
const socialAuthService = require('../services/socialAuthService');

/**
 * Social Auth Controller - Handles Google and Apple authentication
 * Unified endpoints: Login OR Register automatically
 * 
 * Endpoints:
 * - POST /api/app/auth/google - Authenticate with Google
 * - POST /api/app/auth/apple - Authenticate with Apple
 * 
 * Request Body:
 * {
 *   "idToken": "GOOGLE_OR_APPLE_ID_TOKEN"
 * }
 * 
 * Response (same as normal login):
 * {
 *   "success": true,
 *   "message": "User logged in with Google successfully",
 *   "data": {
 *     "userID": "...",
 *     "username": "...",
 *     "email": "...",
 *     "provider": "google",
 *     "sessionToken": "...",
 *     "refreshToken": "...",
 *     "expiresAt": "...",
 *     "deviceName": "...",
 *     "isNewUser": false
 *   }
 * }
 */

/**
 * Authenticate with Google
 * @route POST /api/app/auth/google
 * @access Public
 */
const authGoogle = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: errors.array()[0].msg,
        code: 400
      });
    }

    const { idToken } = req.body;

    // Get device info from request
    const deviceInfo = {
      userAgent: req.headers['user-agent'] || 'Unknown',
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown'
    };

    // Call social auth service
    const result = await socialAuthService.authenticateGoogle(idToken, deviceInfo);

    const statusCode = result.success 
      ? (result.data?.isNewUser ? 201 : 200) 
      : result.code || 500;

    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Google auth controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

/**
 * Authenticate with Apple
 * @route POST /api/app/auth/apple
 * @access Public
 */
const authApple = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: errors.array()[0].msg,
        code: 400
      });
    }

    const { idToken, authorizationCode } = req.body;

    // Get device info from request
    const deviceInfo = {
      userAgent: req.headers['user-agent'] || 'Unknown',
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown'
    };

    // Call social auth service
    const result = await socialAuthService.authenticateApple(idToken, deviceInfo, authorizationCode);

    const statusCode = result.success 
      ? (result.data?.isNewUser ? 201 : 200) 
      : result.code || 500;

    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Apple auth controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

module.exports = {
  authGoogle,
  authApple
};
