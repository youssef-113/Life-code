const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { getFirestore, getAuth, createUserInFirebase, getUserByEmail, getUserByUid } = require('../config/firebase');

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '2h';
const REFRESH_TOKEN_EXPIRES_IN = '30d';

/**
 * Auth Service - Handles all authentication operations
 */
class AuthService {
  
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Object} - User data with tokens
   */
  async registerUser(userData) {
    const { username, email, password } = userData;
    const db = getFirestore();
    
    try {
      // Check if user already exists in Firestore
      const usersRef = db.collection('Users');
      const existingUserQuery = await usersRef.where('Email', '==', email).get();
      
      if (!existingUserQuery.empty) {
        return {
          success: false,
          error: 'Validation Error',
          message: 'Email already exists',
          code: 400
        };
      }

      // Create user in Firebase Auth
      const firebaseResult = await createUserInFirebase(email, password, username);
      
      if (!firebaseResult.success) {
        return {
          success: false,
          error: 'Firebase Error',
          message: firebaseResult.error,
          code: 500
        };
      }

      const uid = firebaseResult.userRecord.uid;

      // Create user document in Firestore (minimal fields - profile fields will be added later)
      const userDoc = {
        Username: username,
        Email: email,
        IsActive: true,
        CreatedAt: new Date(),
        UpdatedAt: new Date()
      };

      await db.collection('Users').doc(uid).set(userDoc);

      // Generate tokens
      const { accessToken, refreshToken, expiresAt } = this.generateTokens(uid);

      // Create session
      const session = await this.createSession(uid, accessToken, refreshToken);

      // Log security event
      await this.logSecurityEvent(uid, 'LOGIN_SUCCESS', { sessionId: session.id });

      return {
        success: true,
        message: 'User registered successfully',
        data: {
          userID: uid,
          username,
          email,
          sessionToken: accessToken,
          refreshToken,
          expiresAt,
          createdAt: userDoc.CreatedAt
        }
      };
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Register user with Google OAuth
   * @param {Object} userData - Google user data
   * @returns {Object} - User data with tokens
   */
  async registerWithGoogle(userData) {
    const { googleID, email, username, photoURL, gender } = userData;
    const db = getFirestore();
    
    try {
      // Check if user already exists
      const usersRef = db.collection('Users');
      const existingUserQuery = await usersRef.where('Email', '==', email).get();
      
      if (!existingUserQuery.empty) {
        // User exists - login instead
        const existingDoc = existingUserQuery.docs[0];
        const uid = existingDoc.id;
        
        // Generate tokens for existing user
        const { accessToken, refreshToken, expiresAt } = this.generateTokens(uid);
        await this.createSession(uid, accessToken, refreshToken);
        await this.logSecurityEvent(uid, 'LOGIN_SUCCESS', { method: 'google' });

        return {
          success: true,
          message: 'User logged in with Google successfully',
          data: {
            userID: uid,
            username: existingDoc.data().Username,
            email,
            googleID,
            sessionToken: accessToken,
            refreshToken,
            expiresAt
          }
        };
      }

      // Create new user with Google ID
      const uid = uuidv4();
      
      const userDoc = {
        Username: username,
        Email: email,
        GoogleID: googleID,
        Gender: gender || 'prefer_not_to_say',
        PhotoURL: photoURL || '',
        IsActive: true,
        CreatedAt: new Date(),
        UpdatedAt: new Date()
      };

      await db.collection('Users').doc(uid).set(userDoc);

      // Generate tokens
      const { accessToken, refreshToken, expiresAt } = this.generateTokens(uid);
      await this.createSession(uid, accessToken, refreshToken);
      await this.logSecurityEvent(uid, 'LOGIN_SUCCESS', { method: 'google' });

      return {
        success: true,
        message: 'User registered with Google successfully',
        data: {
          userID: uid,
          username,
          email,
          googleID,
          sessionToken: accessToken,
          refreshToken,
          expiresAt
        }
      };
    } catch (error) {
      console.error('Google register error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Register user with Apple Sign In
   * @param {Object} userData - Apple user data
   * @returns {Object} - User data with tokens
   */
  async registerWithApple(userData) {
    const { appleID, email, name } = userData;
    const db = getFirestore();
    
    try {
      // Check if user already exists
      const usersRef = db.collection('Users');
      const existingUserQuery = await usersRef.where('Email', '==', email).get();
      
      if (!existingUserQuery.empty) {
        // User exists - login instead
        const existingDoc = existingUserQuery.docs[0];
        const uid = existingDoc.id;
        
        // Generate tokens for existing user
        const { accessToken, refreshToken, expiresAt } = this.generateTokens(uid);
        await this.createSession(uid, accessToken, refreshToken);
        await this.logSecurityEvent(uid, 'LOGIN_SUCCESS', { method: 'apple' });

        return {
          success: true,
          message: 'User logged in with Apple successfully',
          data: {
            userID: uid,
            username: existingDoc.data().Username,
            email,
            appleID,
            sessionToken: accessToken,
            refreshToken,
            expiresAt
          }
        };
      }

      // Create new user with Apple ID
      const uid = uuidv4();
      
      const userDoc = {
        Username: name,
        Email: email,
        AppleID: appleID,
        IsActive: true,
        CreatedAt: new Date(),
        UpdatedAt: new Date()
      };

      await db.collection('Users').doc(uid).set(userDoc);

      // Generate tokens
      const { accessToken, refreshToken, expiresAt } = this.generateTokens(uid);
      await this.createSession(uid, accessToken, refreshToken);
      await this.logSecurityEvent(uid, 'LOGIN_SUCCESS', { method: 'apple' });

      return {
        success: true,
        message: 'User registered with Apple successfully',
        data: {
          userID: uid,
          username: name,
          email,
          appleID,
          sessionToken: accessToken,
          refreshToken,
          expiresAt
        }
      };
    } catch (error) {
      console.error('Apple register error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @param {Object} deviceInfo - Device information
   * @returns {Object} - User data with tokens
   */
  async loginUser(credentials) {
    const { email, password } = credentials;
    const db = getFirestore();
    
    try {
      // Get user from Firestore
      const usersRef = db.collection('Users');
      const userQuery = await usersRef.where('Email', '==', email).get();
      
      if (userQuery.empty) {
        await this.logSecurityEvent(null, 'LOGIN_FAILED', { email, reason: 'User not found' });
        return {
          success: false,
          error: 'Authentication Failed',
          message: 'Invalid email or password',
          code: 401
        };
      }

      const userDoc = userQuery.docs[0];
      const userData = userDoc.data();
      const uid = userDoc.id;

      // Check if account is active
      if (!userData.IsActive) {
        await this.logSecurityEvent(uid, 'LOGIN_FAILED', { reason: 'Account deactivated' });
        return {
          success: false,
          error: 'Authentication Failed',
          message: 'Account is deactivated',
          code: 401
        };
      }

      // Verify password with Firebase Auth REST API
      const apiKey = process.env.FIREBASE_API_KEY;
      if (!apiKey) {
        console.error('FIREBASE_API_KEY not configured');
        return {
          success: false,
          error: 'Server Error',
          message: 'Authentication service not configured',
          code: 500
        };
      }

      try {
        const response = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email,
              password: password,
              returnSecureToken: false
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          // Map Firebase error codes to user-friendly messages
          const errorMap = {
            'INVALID_PASSWORD': 'Wrong password. Please try again.',
            'EMAIL_NOT_FOUND': 'No account found with this email.',
            'USER_DISABLED': 'This account has been disabled.',
            'INVALID_EMAIL': 'Invalid email address format.',
            'MISSING_PASSWORD': 'Password is required.',
            'MISSING_EMAIL': 'Email is required.'
          };

          const errorCode = data.error?.message || 'UNKNOWN_ERROR';
          const errorMessage = errorMap[errorCode] || 'Invalid email or password';

          console.log('Firebase Auth error:', errorCode, '→', errorMessage);
          await this.logSecurityEvent(uid, 'LOGIN_FAILED', { reason: errorCode, email });
          return {
            success: false,
            error: 'Authentication Failed',
            message: errorMessage,
            code: 401
          };
        }

        console.log('Password verified successfully for:', email);
      } catch (firebaseError) {
        console.error('Firebase Auth request error:', firebaseError);
        await this.logSecurityEvent(uid, 'LOGIN_FAILED', { reason: 'Auth service error' });
        return {
          success: false,
          error: 'Authentication Failed',
          message: 'Invalid email or password',
          code: 401
        };
      }

      // Generate tokens
      const { accessToken, refreshToken, expiresAt } = this.generateTokens(uid);

      // Create session (matching schema: UserSessions)
      const session = await this.createSession(uid, accessToken, refreshToken);

      // Log security event
      await this.logSecurityEvent(uid, 'LOGIN_SUCCESS', { 
        sessionId: session.id
      });

      return {
        success: true,
        message: 'Login successful',
        data: {
          userID: uid,
          username: userData.Username,
          email: userData.Email,
          sessionToken: accessToken,
          refreshToken,
          expiresAt,
          sessionID: session.id
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Logout user - invalidate session
   * @param {string} uid - User ID
   * @param {string} sessionToken - Session token
   * @returns {Object} - Logout result
   */
  async logoutUser(uid, sessionToken) {
    const db = getFirestore();
    
    try {
      // Find and deactivate session
      const sessionsRef = db.collection('UserSessions');
      const sessionQuery = await sessionsRef
        .where('UserID', '==', uid)
        .where('SessionToken', '==', sessionToken)
        .where('IsActive', '==', true)
        .get();

      if (!sessionQuery.empty) {
        const sessionDoc = sessionQuery.docs[0];
        await sessionDoc.ref.update({
          IsActive: false,
          LoggedOutAt: new Date()
        });

        await this.logSecurityEvent(uid, 'LOGOUT', { sessionId: sessionDoc.id });

        return {
          success: true,
          message: 'Logged out successfully',
          data: {
            loggedOutAt: new Date()
          }
        };
      }

      return {
        success: false,
        error: 'Not Found',
        message: 'Session not found',
        code: 404
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Object} - New tokens
   */
  async refreshTokens(refreshToken) {
    const db = getFirestore();
    
    try {
      // Find session with refresh token
      const sessionsRef = db.collection('UserSessions');
      const sessionQuery = await sessionsRef
        .where('RefreshToken', '==', refreshToken)
        .where('IsActive', '==', true)
        .get();

      if (sessionQuery.empty) {
        return {
          success: false,
          error: 'Unauthorized',
          message: 'Invalid or expired refresh token',
          code: 401
        };
      }

      const sessionDoc = sessionQuery.docs[0];
      const sessionData = sessionDoc.data();
      const uid = sessionData.UserID;

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken, expiresAt } = this.generateTokens(uid);

      // Update session
      await sessionDoc.ref.update({
        SessionToken: accessToken,
        RefreshToken: newRefreshToken,
        LastUsed: new Date()
      });

      await this.logSecurityEvent(uid, 'TOKEN_REFRESHED', { sessionId: sessionDoc.id });

      return {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          sessionToken: accessToken,
          refreshToken: newRefreshToken,
          expiresAt
        }
      };
    } catch (error) {
      console.error('Refresh token error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Generate JWT tokens
   * @param {string} uid - User ID
   * @returns {Object} - Tokens and expiry
   */
  generateTokens(uid) {
    const accessToken = jwt.sign(
      { userID: uid },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    return { accessToken, refreshToken, expiresAt };
  }

  /**
   * Create session in Firestore (matching schema: UserSessions)
   * @param {string} uid - User ID
   * @param {string} accessToken - Access token
   * @param {string} refreshToken - Refresh token
   * @param {Object} requestOptions - Request info for logging
   * @returns {Object} - Session data
   */
  async createSession(uid, accessToken, refreshToken, requestOptions = {}) {
    const db = getFirestore();
    
    // Match schema: UserSessions collection fields
    const sessionData = {
      UserID: uid,
      SessionToken: accessToken,
      RefreshToken: refreshToken,
      UserAgent: requestOptions.userAgent || 'Unknown',
      IPAddress: requestOptions.ipAddress || 'unknown',
      IsActive: true,
      CreatedAt: new Date(),
      ExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      LastUsed: new Date()
    };

    const sessionRef = await db.collection('UserSessions').add(sessionData);
    
    return {
      id: sessionRef.id,
      ...sessionData
    };
  }

  /**
   * Log security event
   * @param {string} uid - User ID (nullable)
   * @param {string} actionType - Action type
   * @param {Object} metadata - Additional metadata
   */
  async logSecurityEvent(uid, actionType, metadata = {}) {
    const db = getFirestore();
    
    const logData = {
      UserID: uid || null,
      ActionType: actionType,
      IPAddress: metadata.ipAddress || 'unknown',
      UserAgent: metadata.userAgent || 'unknown',
      Metadata: metadata,
      Timestamp: new Date()
    };

    await db.collection('SecurityLogs').add(logData);
  }

  /**
   * Verify session token
   * @param {string} token - Session token
   * @returns {Object} - Verification result
   */
  async verifySession(token) {
    const db = getFirestore();
    
    try {
      // Verify JWT
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Check session in Firestore
      const sessionsRef = db.collection('UserSessions');
      const sessionQuery = await sessionsRef
        .where('SessionToken', '==', token)
        .where('IsActive', '==', true)
        .limit(1)
        .get();

      if (sessionQuery.empty) {
        return { valid: false, error: 'Session not found or inactive' };
      }

      const sessionDoc = sessionQuery.docs[0];
      const sessionData = sessionDoc.data();

      // Check expiration
      if (new Date() > sessionData.ExpiresAt.toDate()) {
        return { valid: false, error: 'Session expired' };
      }

      // Update last used
      await sessionDoc.ref.update({ LastUsed: new Date() });

      return {
        valid: true,
        userID: decoded.userID,
        sessionId: sessionDoc.id
      };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Get user by ID
   * @param {string} uid - User ID
   * @returns {Object} - User data
   */
  async getUserById(uid) {
    const db = getFirestore();
    
    try {
      const userDoc = await db.collection('Users').doc(uid).get();
      
      if (!userDoc.exists) {
        return { exists: false };
      }

      return {
        exists: true,
        data: { id: userDoc.id, ...userDoc.data() }
      };
    } catch (error) {
      return { exists: false, error: error.message };
    }
  }
}

module.exports = new AuthService();
