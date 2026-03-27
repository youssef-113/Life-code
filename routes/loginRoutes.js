const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { 
  loginUser, 
  logoutUser, 
  logoutAllDevices, 
  refreshToken,
  getActiveSessions,
  revokeSession
} = require('../controllers/loginController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * Login Routes - Authentication endpoints
 */

/**
 * @route POST /api/app/login
 * @description Login user with email/password
 * @access Public
 */
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], loginUser);

/**
 * @route POST /api/app/logout
 * @description Logout current session
 * @access Private
 */
router.post('/logout', authenticateToken, logoutUser);

/**
 * @route POST /api/app/logout-all
 * @description Logout from all devices
 * @access Private
 */
router.post('/logout-all', authenticateToken, logoutAllDevices);

/**
 * @route POST /api/app/refresh
 * @description Refresh access token
 * @access Public (requires refresh token)
 */
router.post('/refresh', [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
], refreshToken);

/**
 * @route GET /api/app/sessions
 * @description Get all active sessions for user
 * @access Private
 */
router.get('/sessions', authenticateToken, getActiveSessions);

/**
 * @route DELETE /api/app/sessions/:sessionId
 * @description Revoke specific session
 * @access Private
 */
router.delete('/sessions/:sessionId', authenticateToken, revokeSession);

module.exports = router;
