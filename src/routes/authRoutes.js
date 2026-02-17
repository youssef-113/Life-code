/**
 * Authentication Routes
 * Defines routes for user authentication and session management
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  login,
  logout,
  logoutAll,
  refreshToken,
  getSessions,
  revokeSession
} from '../controllers/authController.js';

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and create session
 * @access  Public
 * @body    { email: string, idToken: string }
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and deactivate session
 * @access  Public
 * @body    { sessionToken: string }
 */
router.post('/logout', logout);

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout from all active sessions
 * @access  Private (requires authentication)
 */
router.post('/logout-all', authenticate, logoutAll);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 * @body    { refreshToken: string }
 */
router.post('/refresh', refreshToken);

/**
 * @route   GET /api/auth/sessions
 * @desc    Get all active sessions for current user
 * @access  Private
 */
router.get('/sessions', authenticate, getSessions);

/**
 * @route   DELETE /api/auth/sessions/:sessionId
 * @desc    Revoke a specific session
 * @access  Private
 */
router.delete('/sessions/:sessionId', authenticate, revokeSession);

export default router;
