/**
 * Authentication Middleware
 * Provides JWT verification and session validation for protected routes
 */

import jwt from 'jsonwebtoken';
import { db } from '../config/firebase.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key';

/**
 * Verify JWT token and validate session
 * This middleware protects private routes by:
 * 1. Extracting the Bearer token from Authorization header
 * 2. Verifying the JWT signature
 * 3. Checking if the session exists and is active in Firestore
 * 4. Attaching user info to the request object
 */
export const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided or invalid format. Use: Bearer <token>'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token is empty.'
      });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please login again.'
        });
      }
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token format.'
        });
      }
      throw jwtError;
    }

    // Validate session in Firestore
    const sessionQuery = await db.collection('userSessions')
      .where('sessionToken', '==', token)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (sessionQuery.empty) {
      return res.status(401).json({
        success: false,
        message: 'Session is invalid or has been revoked.'
      });
    }

    const sessionDoc = sessionQuery.docs[0];
    const sessionData = sessionDoc.data();

    // Check if session has expired
    if (sessionData.expiresAt && sessionData.expiresAt.toMillis() < Date.now()) {
      // Deactivate expired session
      await sessionDoc.ref.update({ isActive: false });
      
      return res.status(401).json({
        success: false,
        message: 'Session has expired. Please login again.'
      });
    }

    // Update last used timestamp
    await sessionDoc.ref.update({
      lastUsed: new Date()
    });

    // Attach user and session info to request object
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      sessionId: sessionDoc.id
    };

    next();

  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user info if token is valid, but doesn't block the request
 * Useful for routes that work with or without authentication
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Validate session
      const sessionQuery = await db.collection('userSessions')
        .where('sessionToken', '==', token)
        .where('isActive', '==', true)
        .limit(1)
        .get();

      if (!sessionQuery.empty) {
        const sessionDoc = sessionQuery.docs[0];
        req.user = {
          uid: decoded.uid,
          email: decoded.email,
          sessionId: sessionDoc.id
        };
        
        // Update last used
        await sessionDoc.ref.update({ lastUsed: new Date() });
      } else {
        req.user = null;
      }
    } catch {
      req.user = null;
    }

    next();

  } catch (error) {
    req.user = null;
    next();
  }
};

/**
 * Generate JWT access token
 * @param {Object} payload - Token payload containing user info
 * @returns {string} JWT token
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

/**
 * Decode token without verification (for debugging)
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};
