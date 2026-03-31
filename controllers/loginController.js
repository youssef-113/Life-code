const authService = require('../services/authService');
const { validationResult } = require('express-validator');

/**
 * Login Controller - Handles user login and session management
 */

/**
 * Login user with email/password
 * @route POST /api/app/login
 * @access Public
 */
const loginUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: errors.array()[0].msg,
        code: 400
      });
    }

    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Email and password are required',
        code: 400
      });
    }

    // Login user
    const result = await authService.loginUser({ 
      email, 
      password,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip || req.connection.remoteAddress
    });

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Login controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

/**
 * Logout user - invalidate current session
 * @route POST /api/app/logout
 * @access Private (requires authentication)
 */
const logoutUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No token provided',
        code: 401
      });
    }

    const token = authHeader.split(' ')[1];
    const userID = req.user?.userID;

    if (!userID) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid session',
        code: 401
      });
    }

    const result = await authService.logoutUser(userID, token);

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Logout controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

/**
 * Logout from all devices
 * @route POST /api/app/logout-all
 * @access Private (requires authentication)
 */
const logoutAllDevices = async (req, res) => {
  try {
    const userID = req.user?.userID;

    if (!userID) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid session',
        code: 401
      });
    }

    const db = require('../config/firebase').getFirestore();
    
    // Get all active sessions
    const sessionsRef = db.collection('UserSessions');
    const activeSessionsQuery = await sessionsRef
      .where('UserID', '==', userID)
      .where('IsActive', '==', true)
      .get();

    if (activeSessionsQuery.empty) {
      return res.status(200).json({
        success: true,
        message: 'No active sessions found',
        data: { sessionsLoggedOut: 0 }
      });
    }

    // Batch update all sessions to inactive
    const batch = db.batch();
    let sessionCount = 0;

    activeSessionsQuery.docs.forEach(doc => {
      batch.update(doc.ref, {
        IsActive: false,
        LoggedOutAt: new Date()
      });
      sessionCount++;
    });

    await batch.commit();

    // Log security event
    await authService.logSecurityEvent(userID, 'LOGOUT', { 
      sessionsLoggedOut: sessionCount,
      logoutType: 'all_devices'
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out from all devices successfully',
      data: {
        sessionsLoggedOut: sessionCount,
        loggedOutAt: new Date()
      }
    });

  } catch (error) {
    console.error('Logout all controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

/**
 * Refresh access token
 * @route POST /api/app/refresh
 * @access Public (requires refresh token)
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Refresh token is required',
        code: 400
      });
    }

    const result = await authService.refreshTokens(refreshToken);

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Refresh token controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

/**
 * Get active sessions for user
 * @route GET /api/app/sessions
 * @access Private (requires authentication)
 */
const getActiveSessions = async (req, res) => {
  try {
    const userID = req.user?.userID;

    if (!userID) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid session',
        code: 401
      });
    }

    const db = require('../config/firebase').getFirestore();
    
    const sessionsRef = db.collection('UserSessions');
    const sessionsQuery = await sessionsRef
      .where('UserID', '==', userID)
      .where('IsActive', '==', true)
      .orderBy('LastUsed', 'desc')
      .get();

    const sessions = sessionsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      SessionToken: undefined, // Don't expose tokens
      RefreshToken: undefined
    }));

    return res.status(200).json({
      success: true,
      data: {
        sessions,
        totalActiveSessions: sessions.length
      }
    });

  } catch (error) {
    console.error('Get sessions controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

/**
 * Revoke specific session
 * @route DELETE /api/app/sessions/:sessionId
 * @access Private (requires authentication)
 */
const revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userID = req.user?.userID;

    if (!userID) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid session',
        code: 401
      });
    }

    const db = require('../config/firebase').getFirestore();
    
    const sessionDoc = await db.collection('UserSessions').doc(sessionId).get();

    if (!sessionDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Session not found',
        code: 404
      });
    }

    // Verify ownership
    if (sessionDoc.data().UserID !== userID) {
      await authService.logSecurityEvent(userID, 'UNAUTHORIZED_ACCESS', { 
        attemptedSessionId: sessionId 
      });
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to revoke this session',
        code: 403
      });
    }

    // Revoke session
    await sessionDoc.ref.update({
      IsActive: false,
      RevokedAt: new Date()
    });

    await authService.logSecurityEvent(userID, 'SESSION_REVOKED', { 
      sessionId,
      revokedAt: new Date()
    });

    return res.status(200).json({
      success: true,
      message: 'Session revoked successfully',
      data: {
        sessionId,
        revokedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Revoke session controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

module.exports = {
  loginUser,
  logoutUser,
  logoutAllDevices,
  refreshToken,
  getActiveSessions,
  revokeSession
};
