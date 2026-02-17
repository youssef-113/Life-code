/**
 * Authentication Controller
 * Handles user login, logout, and session management
 */

import { v4 as uuidv4 } from 'uuid';
import { db, auth, Timestamp } from '../config/firebase.js';
import { generateToken } from '../middleware/auth.js';
import { ApiError, asyncHandler, validateRequiredFields } from '../middleware/errorHandler.js';
import { 
  logLoginSuccess, 
  logLoginFailed, 
  logLogout,
  getClientIp,
  getUserAgent 
} from '../utils/securityLogger.js';

/**
 * POST /api/auth/login
 * Authenticate user via Firebase Auth and create a new session
 * 
 * Request body: { email: string, idToken: string }
 * - idToken: Firebase ID token from client-side Firebase Auth
 * 
 * Response: { success: true, data: { user, session, tokens } }
 */
export const login = asyncHandler(async (req, res) => {
  // Validate required fields
  validateRequiredFields(req.body, ['email', 'idToken']);

  const { email, idToken } = req.body;

  // Verify Firebase ID token
  let decodedToken;
  try {
    decodedToken = await auth.verifyIdToken(idToken);
  } catch (error) {
    await logLoginFailed({
      req,
      reason: 'Invalid Firebase ID token',
      metadata: { error: error.message }
    });
    throw new ApiError(401, 'Invalid authentication token. Please login again.');
  }

  const uid = decodedToken.uid;

  // Verify that the email matches the token
  if (decodedToken.email !== email) {
    await logLoginFailed({
      userId: uid,
      req,
      reason: 'Email mismatch with token'
    });
    throw new ApiError(401, 'Email does not match the authenticated user.');
  }

  // Check if user exists in Firestore, if not create a new user record
  const userRef = db.collection('users').doc(uid);
  const userDoc = await userRef.get();

  let userData;
  const now = Timestamp.now();

  if (!userDoc.exists) {
    // Create new user record
    userData = {
      username: email.split('@')[0], // Default username from email
      email: email,
      gender: null,
      nationalId: null,
      photoUrl: decodedToken.picture || null,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    await userRef.set(userData);
    console.log(`New user created: ${uid}`);
  } else {
    userData = userDoc.data();
    
    // Check if user account is active
    if (userData.isActive === false) {
      await logLoginFailed({
        userId: uid,
        req,
        reason: 'Account is deactivated'
      });
      throw new ApiError(403, 'Your account has been deactivated. Please contact support.');
    }
  }

  // Generate JWT access token
  const accessToken = generateToken({
    uid: uid,
    email: email,
    type: 'access'
  });

  // Generate refresh token
  const refreshToken = uuidv4();

  // Calculate expiration date (24 hours from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  // Create session record
  const sessionData = {
    userId: uid,
    sessionToken: accessToken,
    refreshToken: refreshToken,
    userAgent: getUserAgent(req),
    ipAddress: getClientIp(req),
    isActive: true,
    createdAt: now,
    expiresAt: Timestamp.fromDate(expiresAt),
    lastUsed: now
  };

  const sessionRef = await db.collection('userSessions').add(sessionData);

  // Log successful login
  await logLoginSuccess({
    userId: uid,
    req,
    metadata: { sessionId: sessionRef.id }
  });

  // Return success response
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        uid: uid,
        ...userData,
        createdAt: userData.createdAt?.toDate()?.toISOString(),
        updatedAt: userData.updatedAt?.toDate()?.toISOString()
      },
      session: {
        id: sessionRef.id,
        expiresAt: expiresAt.toISOString(),
        createdAt: now.toDate().toISOString()
      },
      tokens: {
        accessToken: accessToken,
        refreshToken: refreshToken,
        tokenType: 'Bearer',
        expiresIn: 86400 // 24 hours in seconds
      }
    }
  });
});

/**
 * POST /api/auth/logout
 * Logout user and deactivate session
 * 
 * Request body: { sessionToken: string }
 * Response: { success: true, message: string }
 */
export const logout = asyncHandler(async (req, res) => {
  // Validate required fields
  validateRequiredFields(req.body, ['sessionToken']);

  const { sessionToken } = req.body;

  // Find the session
  const sessionQuery = await db.collection('userSessions')
    .where('sessionToken', '==', sessionToken)
    .where('isActive', '==', true)
    .limit(1)
    .get();

  if (sessionQuery.empty) {
    // Session not found or already inactive - still return success for idempotency
    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  }

  const sessionDoc = sessionQuery.docs[0];
  const sessionData = sessionDoc.data();
  const userId = sessionData.userId;

  // Deactivate the session
  await sessionDoc.ref.update({
    isActive: false,
    lastUsed: Timestamp.now()
  });

  // Log logout event
  await logLogout({
    userId: userId,
    req,
    metadata: { sessionId: sessionDoc.id }
  });

  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

/**
 * POST /api/auth/logout-all
 * Logout from all sessions (requires authentication)
 * 
 * Headers: Authorization: Bearer <token>
 * Response: { success: true, message: string }
 */
export const logoutAll = asyncHandler(async (req, res) => {
  const userId = req.user.uid;

  // Get all active sessions for the user
  const sessionsQuery = await db.collection('userSessions')
    .where('userId', '==', userId)
    .where('isActive', '==', true)
    .get();

  // Deactivate all sessions
  const batch = db.batch();
  const now = Timestamp.now();

  sessionsQuery.docs.forEach(doc => {
    batch.update(doc.ref, {
      isActive: false,
      lastUsed: now
    });
  });

  await batch.commit();

  // Log logout event
  await logLogout({
    userId: userId,
    req,
    metadata: { 
      logoutAll: true,
      sessionsRevoked: sessionsQuery.size 
    }
  });

  res.status(200).json({
    success: true,
    message: `Logged out from all ${sessionsQuery.size} active session(s)`
  });
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 * 
 * Request body: { refreshToken: string }
 * Response: { success: true, data: { tokens } }
 */
export const refreshToken = asyncHandler(async (req, res) => {
  validateRequiredFields(req.body, ['refreshToken']);

  const { refreshToken } = req.body;

  // Find session by refresh token
  const sessionQuery = await db.collection('userSessions')
    .where('refreshToken', '==', refreshToken)
    .where('isActive', '==', true)
    .limit(1)
    .get();

  if (sessionQuery.empty) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const sessionDoc = sessionQuery.docs[0];
  const sessionData = sessionDoc.data();

  // Check if session has expired
  if (sessionData.expiresAt && sessionData.expiresAt.toMillis() < Date.now()) {
    await sessionDoc.ref.update({ isActive: false });
    throw new ApiError(401, 'Session has expired. Please login again.');
  }

  const userId = sessionData.userId;

  // Get user data
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) {
    throw new ApiError(404, 'User not found');
  }

  const userData = userDoc.data();

  // Generate new access token
  const newAccessToken = generateToken({
    uid: userId,
    email: userData.email,
    type: 'access'
  });

  // Generate new refresh token
  const newRefreshToken = uuidv4();

  // Calculate new expiration
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  // Update session with new tokens
  await sessionDoc.ref.update({
    sessionToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresAt: Timestamp.fromDate(expiresAt),
    lastUsed: Timestamp.now()
  });

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        tokenType: 'Bearer',
        expiresIn: 86400
      }
    }
  });
});

/**
 * GET /api/auth/sessions
 * Get all active sessions for the current user
 * 
 * Headers: Authorization: Bearer <token>
 * Response: { success: true, data: { sessions } }
 */
export const getSessions = asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const currentSessionId = req.user.sessionId;

  const sessionsQuery = await db.collection('userSessions')
    .where('userId', '==', userId)
    .where('isActive', '==', true)
    .orderBy('lastUsed', 'desc')
    .get();

  const sessions = sessionsQuery.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      isCurrent: doc.id === currentSessionId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      createdAt: data.createdAt?.toDate()?.toISOString(),
      lastUsed: data.lastUsed?.toDate()?.toISOString(),
      expiresAt: data.expiresAt?.toDate()?.toISOString()
    };
  });

  res.status(200).json({
    success: true,
    data: { sessions }
  });
});

/**
 * DELETE /api/auth/sessions/:sessionId
 * Revoke a specific session
 * 
 * Headers: Authorization: Bearer <token>
 * Response: { success: true, message: string }
 */
export const revokeSession = asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const { sessionId } = req.params;

  if (!sessionId) {
    throw new ApiError(400, 'Session ID is required');
  }

  const sessionDoc = await db.collection('userSessions').doc(sessionId).get();

  if (!sessionDoc.exists) {
    throw new ApiError(404, 'Session not found');
  }

  const sessionData = sessionDoc.data();

  // Ensure user can only revoke their own sessions
  if (sessionData.userId !== userId) {
    throw new ApiError(403, 'You can only revoke your own sessions');
  }

  // Deactivate the session
  await sessionDoc.ref.update({
    isActive: false,
    lastUsed: Timestamp.now()
  });

  res.status(200).json({
    success: true,
    message: 'Session revoked successfully'
  });
});
