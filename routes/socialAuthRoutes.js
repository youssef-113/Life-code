const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authGoogle, authApple } = require('../controllers/socialAuthController');

/**
 * Social Authentication Routes
 * Unified endpoints for Google and Apple Sign-In
 * Handles BOTH login and register automatically
 * 
 * Endpoints:
 * - POST /api/app/auth/google - Authenticate with Google
 * - POST /api/app/auth/apple - Authenticate with Apple
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
 * @response { success, message, data: { userID, username, email, provider, sessionToken, refreshToken, expiresAt, isNewUser } }
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
 * @response { success, message, data: { userID, username, email, provider, sessionToken, refreshToken, expiresAt, isNewUser } }
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

module.exports = router;
