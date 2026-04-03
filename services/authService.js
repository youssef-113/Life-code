const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { getFirestore, getAuth, createUserInFirebase, getUserByEmail, getUserByUid } = require('../config/firebase');

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '15d'; // Access tokens valid for 15 days
const REFRESH_TOKEN_EXPIRES_IN = '15d'; // Refresh tokens valid for 15 days

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
    const { username, email, password, userAgent, ipAddress } = userData;
    const db = getFirestore();
    
    try {
      // Check if user already exists in Firestore
      const usersRef = db.collection('Users');
      const existingUserQuery = await usersRef.where('Email', '==', email).get();
      
      if (!existingUserQuery.empty) {
        await this.logSecurityEvent(null, 'REGISTER_FAILED', { email, reason: 'Email already exists' });
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
        await this.logSecurityEvent(null, 'REGISTER_FAILED', { email, reason: 'Firebase error', error: firebaseResult.error });
        return {
          success: false,
          error: 'Firebase Error',
          message: firebaseResult.error,
          code: 500
        };
      }

      const uid = firebaseResult.userRecord.uid;

      // Create user document in Firestore with Providers array for account linking
      const userDoc = {
        Username: username,
        Email: email,
        Providers: [
          {
            provider: 'email',
            providerId: null, // No external provider ID for email/password
            linkedAt: new Date()
          }
        ],
        PrimaryProvider: 'email',
        IsActive: true,
        CreatedAt: new Date(),
        UpdatedAt: new Date()
      };

      await db.collection('Users').doc(uid).set(userDoc);

      // Generate tokens
      const { accessToken, refreshToken, expiresAt } = this.generateTokens(uid);

      // Create session with device info
      const session = await this.createSession(uid, accessToken, refreshToken, {
        userAgent,
        ipAddress
      });

      // Log security event
      await this.logSecurityEvent(uid, 'REGISTER_SUCCESS', { 
        sessionId: session.id,
        email,
        method: 'email',
        deviceName: session.DeviceName,
        ipAddress
      });

      return {
        success: true,
        message: 'User registered successfully',
        data: {
          userID: uid,
          username,
          email,
          providers: userDoc.Providers,
          primaryProvider: 'email',
          sessionToken: accessToken,
          refreshToken,
          expiresAt,
          deviceName: session.DeviceName,
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
   * Login user
   * @param {Object} credentials - Login credentials
   * @param {Object} deviceInfo - Device information
   * @returns {Object} - User data with tokens
   */
  async loginUser(credentials) {
    const { email, password, ipAddress } = credentials;
    const db = getFirestore();
    const { trackFailedAttempt, clearFailedAttempts } = require('../middleware/accountLockMiddleware');
    
    try {
      // Get user from Firestore
      const usersRef = db.collection('Users');
      const userQuery = await usersRef.where('Email', '==', email).get();
      
      if (userQuery.empty) {
        // Track failed attempt for non-existent user (anti-enumeration)
        await trackFailedAttempt(email, ipAddress);
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
          // Track failed attempt and get delay info
          const lockInfo = await trackFailedAttempt(email, ipAddress);
          
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
          await this.logSecurityEvent(uid, 'LOGIN_FAILED', { reason: errorCode, email, remainingAttempts: lockInfo.remainingAttempts });
          
          // Return with progressive delay hint and remaining attempts
          return {
            success: false,
            error: 'Authentication Failed',
            message: errorMessage,
            code: 401,
            remainingAttempts: lockInfo.remainingAttempts,
            delayMs: lockInfo.delayMs,
            locked: lockInfo.locked
          };
        }

        // Clear failed attempts on successful login
        await clearFailedAttempts(email);
        console.log('Password verified successfully for:', email);
      } catch (firebaseError) {
        console.error('Firebase Auth request error:', firebaseError);
        await trackFailedAttempt(email, ipAddress);
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

      // Check for suspicious login (new device or location)
      const suspiciousLoginCheck = await this.detectSuspiciousLogin(uid, credentials);

      // Create session (matching schema: UserSessions)
      const session = await this.createSession(uid, accessToken, refreshToken, {
        userAgent: credentials.userAgent,
        ipAddress: credentials.ipAddress
      });

      // Log security event with device info
      await this.logSecurityEvent(uid, 'LOGIN_SUCCESS', { 
        sessionId: session.id,
        deviceName: session.DeviceName,
        deviceType: session.DeviceType,
        ipAddress: credentials.ipAddress,
        suspicious: suspiciousLoginCheck.suspicious
      });

      // If suspicious login, send alert (could integrate with email/notification service)
      if (suspiciousLoginCheck.suspicious) {
        console.log(`⚠️ Suspicious login detected for user ${uid}: ${suspiciousLoginCheck.reason}`);
        await this.logSecurityEvent(uid, 'SUSPICIOUS_LOGIN', {
          reason: suspiciousLoginCheck.reason,
          sessionId: session.id,
          deviceName: session.DeviceName,
          ipAddress: credentials.ipAddress
        });
      }

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
          sessionID: session.id,
          deviceName: session.DeviceName,
          suspiciousLogin: suspiciousLoginCheck.suspicious ? {
            detected: true,
            reason: suspiciousLoginCheck.reason
          } : null
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

      // Update session with token rotation tracking
      await sessionDoc.ref.update({
        SessionToken: accessToken,
        RefreshToken: newRefreshToken,
        LastUsed: new Date(),
        RefreshTokenRotatedAt: new Date()
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
    const expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days

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
      DeviceName: this.parseDeviceName(requestOptions.userAgent),
      DeviceType: this.parseDeviceType(requestOptions.userAgent),
      IsActive: true,
      CreatedAt: new Date(),
      ExpiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days (matches refresh token)
      LastUsed: new Date(),
      RefreshTokenRotatedAt: new Date() // Track when refresh token was last rotated
    };

    const sessionRef = await db.collection('UserSessions').add(sessionData);
    
    return {
      id: sessionRef.id,
      ...sessionData
    };
  }

  /**
   * Parse device name from user agent
   */
  parseDeviceName(userAgent) {
    if (!userAgent) return 'Unknown Device';
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('iPad')) return 'iPad';
    if (userAgent.includes('Android')) return 'Android Device';
    if (userAgent.includes('Windows')) return 'Windows PC';
    if (userAgent.includes('Mac')) return 'Mac';
    if (userAgent.includes('Linux')) return 'Linux';
    return 'Unknown Device';
  }

  /**
   * Parse device type from user agent
   */
  parseDeviceType(userAgent) {
    if (!userAgent) return 'unknown';
    const ua = userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad|ipod/.test(ua)) return 'mobile';
    if (/tablet|ipad/.test(ua)) return 'tablet';
    return 'desktop';
  }

  /**
   * Detect suspicious login patterns
   * @param {string} uid - User ID
   * @param {Object} credentials - Login credentials with device info
   * @returns {Object} - { suspicious: boolean, reason: string }
   */
  async detectSuspiciousLogin(uid, credentials) {
    const db = getFirestore();
    
    try {
      // Get recent sessions for this user (avoid composite index by filtering in memory)
      const sessionsRef = db.collection('UserSessions');
      const userSessions = await sessionsRef
        .where('UserID', '==', uid)
        .where('IsActive', '==', true)
        .get();

      // Sort in memory to avoid composite index requirement
      const recentSessions = userSessions.docs
        .sort((a, b) => {
          const aTime = a.data().CreatedAt?.toDate?.() || new Date(a.data().CreatedAt);
          const bTime = b.data().CreatedAt?.toDate?.() || new Date(b.data().CreatedAt);
          return bTime - aTime;
        })
        .slice(0, 10);

      // First login from this user - not suspicious
      if (recentSessions.length === 0) {
        return { suspicious: false, reason: null };
      }

      const currentDevice = this.parseDeviceName(credentials.userAgent);
      const currentIP = credentials.ipAddress;

      // Check for new device
      const knownDevices = new Set();
      const knownIPs = new Set();

      recentSessions.docs.forEach(doc => {
        const data = doc.data();
        if (data.DeviceName) knownDevices.add(data.DeviceName);
        if (data.IPAddress) knownIPs.add(data.IPAddress);
      });

      // New device detected
      if (!knownDevices.has(currentDevice)) {
        return { 
          suspicious: true, 
          reason: `New device detected: ${currentDevice}` 
        };
      }

      // New location/IP detected (could integrate with geo-IP service for better detection)
      if (currentIP && !knownIPs.has(currentIP)) {
        return { 
          suspicious: true, 
          reason: `New location detected: ${currentIP}` 
        };
      }

      // Check for rapid successive logins from different devices (potential account takeover)
      const lastSession = recentSessions.docs[0].data();
      const lastLoginTime = lastSession.CreatedAt?.toDate?.() || new Date(lastSession.CreatedAt);
      const timeSinceLastLogin = Date.now() - lastLoginTime.getTime();
      const lastDevice = lastSession.DeviceName;

      // If less than 5 minutes and different device
      if (timeSinceLastLogin < 5 * 60 * 1000 && lastDevice !== currentDevice) {
        return { 
          suspicious: true, 
          reason: 'Rapid login from different device - possible account takeover' 
        };
      }

      return { suspicious: false, reason: null };
    } catch (error) {
      console.error('Suspicious login detection error:', error);
      // Don't block login on detection error
      return { suspicious: false, reason: null };
    }
  }

  /**
   * Log security event with enhanced tracking
   * @param {string} uid - User ID (nullable)
   * @param {string} actionType - Action type
   * @param {Object} metadata - Additional metadata
   */
  async logSecurityEvent(uid, actionType, metadata = {}) {
    const db = getFirestore();
    
    // Determine severity based on action type
    const severityMap = {
      'LOGIN_SUCCESS': 'info',
      'LOGIN_FAILED': 'warning',
      'LOGOUT': 'info',
      'TOKEN_REFRESHED': 'info',
      'SUSPICIOUS_LOGIN': 'critical',
      'UNAUTHORIZED_ACCESS': 'critical',
      'SESSION_REVOKED': 'info',
      'PASSWORD_CHANGED': 'warning',
      'ACCOUNT_DELETED': 'warning',
      'RATE_LIMIT_EXCEEDED': 'warning'
    };

    const severity = severityMap[actionType] || 'info';
    
    const logData = {
      UserID: uid || null,
      ActionType: actionType,
      Severity: severity,
      IPAddress: metadata.ipAddress || 'unknown',
      UserAgent: metadata.userAgent || 'unknown',
      DeviceName: metadata.deviceName || this.parseDeviceName(metadata.userAgent),
      DeviceType: metadata.deviceType || this.parseDeviceType(metadata.userAgent),
      Metadata: metadata,
      Timestamp: new Date(),
      // For analytics queries
      Date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      Hour: new Date().getHours() // 0-23 for hourly analytics
    };

    await db.collection('SecurityLogs').add(logData);
    
    // Log to console for real-time monitoring
    const logPrefix = severity === 'critical' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${logPrefix} [${severity.toUpperCase()}] ${actionType} - User: ${uid || 'unknown'} - IP: ${metadata.ipAddress || 'unknown'}`);
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
