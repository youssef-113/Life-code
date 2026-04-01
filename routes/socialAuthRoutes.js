const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authGoogle, authApple } = require('../controllers/socialAuthController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * Social Authentication Routes
 * Unified endpoints for Google and Apple Sign-In
 * Handles BOTH login and register automatically
 * 
 * Endpoints:
 * - POST /api/app/auth/google - Authenticate with Google
 * - POST /api/app/auth/apple - Authenticate with Apple
 * - GET /api/app/auth/providers - Get linked providers
 * - DELETE /api/app/auth/providers/:provider - Unlink a provider
 * 
 * Flow:
 * 1. Flutter gets idToken from Google/Apple SDK
 * 2. Sends idToken to backend
 * 3. Backend verifies token with provider
 * 4. If user exists → login, if not → register
 * 5. Returns accessToken, refreshToken, user data
 */

/**
 * @route POST /api/app/auth/google
 * @description Authenticate with Google (Login OR Register automatically)
 * @body { idToken: string }
 * @response { success, message, data: { userID, username, email, providers, sessionToken, refreshToken, expiresAt, isNewUser, accountLinked } }
 * @access Public
 * 
 * Testing with Postman:
 * 1. Get a real Google ID token from your Flutter app
 * 2. POST to /api/app/auth/google
 * 3. Body: { "idToken": "your_google_id_token" }
 */
router.post('/auth/google', [
  body('idToken')
    .notEmpty()
    .withMessage('idToken is required')
    .isString()
    .withMessage('idToken must be a string')
], authGoogle);

/**
 * @route POST /api/app/auth/apple
 * @description Authenticate with Apple (Login OR Register automatically)
 * @body { idToken: string, authorizationCode?: string }
 * @response { success, message, data: { userID, username, email, providers, sessionToken, refreshToken, expiresAt, isNewUser, accountLinked } }
 * @access Public
 * 
 * Testing with Postman:
 * 1. Get a real Apple ID token from your Flutter app
 * 2. POST to /api/app/auth/apple
 * 3. Body: { "idToken": "your_apple_id_token" }
 * 
 * Note: Apple may not provide email on subsequent sign-ins
 * We use ProviderID (Apple's unique user ID) as the reliable identifier
 */
router.post('/auth/apple', [
  body('idToken')
    .notEmpty()
    .withMessage('idToken is required')
    .isString()
    .withMessage('idToken must be a string'),
  body('authorizationCode')
    .optional()
    .isString()
    .withMessage('authorizationCode must be a string')
], authApple);

/**
 * @route GET /api/app/auth/providers
 * @description Get user's linked authentication providers
 * @access Private
 */
router.get('/auth/providers', authenticateToken, async (req, res) => {
  try {
    const userID = req.user?.userID;
    if (!userID) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
        code: 401
      });
    }

    const socialAuthService = require('../services/socialAuthService');
    const providers = await socialAuthService.getLinkedProviders(userID);

    return res.status(200).json({
      success: true,
      data: {
        userID,
        providers,
        count: providers.length
      }
    });
  } catch (error) {
    console.error('Get providers error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
});

/**
 * @route DELETE /api/app/auth/providers/:provider
 * @description Unlink an authentication provider from account
 * @access Private
 * 
 * Note: Cannot unlink the only remaining provider
 */
router.delete('/auth/providers/:provider', authenticateToken, async (req, res) => {
  try {
    const userID = req.user?.userID;
    if (!userID) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
        code: 401
      });
    }

    const { provider } = req.params;
    
    if (!['google', 'apple', 'email'].includes(provider)) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid provider. Must be google, apple, or email',
        code: 400
      });
    }

    const socialAuthService = require('../services/socialAuthService');
    const result = await socialAuthService.unlinkProvider(userID, provider);

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);
  } catch (error) {
    console.error('Unlink provider error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
});

module.exports = router;
