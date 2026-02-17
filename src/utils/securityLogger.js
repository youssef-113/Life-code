/**
 * Security Logger Utility
 * Logs all authentication-related actions to the securityLogs collection
 */

import { db, Timestamp } from '../config/firebase.js';

/**
 * Action types for security logging
 */
export const SecurityActionTypes = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  SESSION_REVOKED: 'SESSION_REVOKED',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  TOKEN_REFRESHED: 'TOKEN_REFRESHED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY'
};

/**
 * Log a security event
 * @param {Object} params - Log parameters
 * @param {string} params.userId - Firebase UID (can be null for failed logins)
 * @param {string} params.actionType - Type of security action
 * @param {string} params.ipAddress - Client IP address
 * @param {string} params.userAgent - Client user agent
 * @param {Object} params.metadata - Additional metadata (optional)
 */
export const logSecurityEvent = async ({
  userId = null,
  actionType,
  ipAddress,
  userAgent,
  metadata = {}
}) => {
  try {
    const logEntry = {
      userId,
      actionType,
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      timestamp: Timestamp.now(),
      ...metadata
    };

    await db.collection('securityLogs').add(logEntry);
    
    // Also log to console for immediate visibility
    console.log(`[SECURITY] ${actionType}:`, {
      userId,
      ipAddress: logEntry.ipAddress,
      timestamp: new Date().toISOString(),
      ...metadata
    });

  } catch (error) {
    // Don't throw - logging failures shouldn't break the application
    console.error('Failed to log security event:', error.message);
  }
};

/**
 * Get client IP address from request
 * Handles various proxy configurations
 * @param {Object} req - Express request object
 * @returns {string} Client IP address
 */
export const getClientIp = (req) => {
  // Check for forwarded IP (when behind proxy/load balancer)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }

  // Check other common headers
  return req.headers['x-real-ip'] || 
         req.headers['x-client-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         req.ip ||
         'unknown';
};

/**
 * Get sanitized user agent string
 * @param {Object} req - Express request object
 * @returns {string} User agent string
 */
export const getUserAgent = (req) => {
  const userAgent = req.headers['user-agent'];
  if (!userAgent) return 'unknown';
  
  // Truncate if too long (Firestore has limits)
  return userAgent.substring(0, 500);
};

/**
 * Log login success
 * @param {Object} params - Parameters
 */
export const logLoginSuccess = async ({ userId, req, metadata = {} }) => {
  await logSecurityEvent({
    userId,
    actionType: SecurityActionTypes.LOGIN_SUCCESS,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
    metadata
  });
};

/**
 * Log login failure
 * @param {Object} params - Parameters
 */
export const logLoginFailed = async ({ userId = null, req, reason, metadata = {} }) => {
  await logSecurityEvent({
    userId,
    actionType: SecurityActionTypes.LOGIN_FAILED,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
    metadata: { reason, ...metadata }
  });
};

/**
 * Log logout
 * @param {Object} params - Parameters
 */
export const logLogout = async ({ userId, req, metadata = {} }) => {
  await logSecurityEvent({
    userId,
    actionType: SecurityActionTypes.LOGOUT,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
    metadata
  });
};

/**
 * Log password change
 * @param {Object} params - Parameters
 */
export const logPasswordChanged = async ({ userId, req, metadata = {} }) => {
  await logSecurityEvent({
    userId,
    actionType: SecurityActionTypes.PASSWORD_CHANGED,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
    metadata
  });
};

/**
 * Log session revocation
 * @param {Object} params - Parameters
 */
export const logSessionRevoked = async ({ userId, req, sessionId, metadata = {} }) => {
  await logSecurityEvent({
    userId,
    actionType: SecurityActionTypes.SESSION_REVOKED,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
    metadata: { sessionId, ...metadata }
  });
};

/**
 * Log unauthorized access attempt
 * @param {Object} params - Parameters
 */
export const logUnauthorizedAccess = async ({ userId = null, req, resource, metadata = {} }) => {
  await logSecurityEvent({
    userId,
    actionType: SecurityActionTypes.UNAUTHORIZED_ACCESS,
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
    metadata: { resource, ...metadata }
  });
};

/**
 * Get recent security logs for a user
 * @param {string} userId - Firebase UID
 * @param {number} limit - Maximum number of logs to retrieve
 * @returns {Array} Security logs
 */
export const getUserSecurityLogs = async (userId, limit = 50) => {
  try {
    const logsQuery = await db.collection('securityLogs')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return logsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()?.toISOString()
    }));
  } catch (error) {
    console.error('Error fetching security logs:', error);
    return [];
  }
};
