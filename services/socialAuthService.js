const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getFirestore } = require('../config/firebase');
const authService = require('./authService');

/**
 * Social Auth Service - Handles Google and Apple authentication
 * Verifies tokens from providers, creates/updates users, returns session tokens
 * 
 * Flow:
 * 1. Frontend sends idToken from Google/Apple
 * 2. Backend verifies token with provider
 * 3. Check if user exists by provider + providerId
 * 4. If exists → login, if not → register
 * 5. Create session and return tokens
 */
class SocialAuthService {
  constructor() {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    this.appleClientId = process.env.APPLE_CLIENT_ID;
    this.appleIssuer = 'https://appleid.apple.com';
  }

  /**
   * Authenticate with Google
   * @param {string} idToken - Google ID token from Flutter
   * @param {Object} deviceInfo - Device information from request
   * @returns {Object} - Auth result with tokens
   */
  async authenticateGoogle(idToken, deviceInfo = {}) {
    try {
      // Step 1: Verify Google ID token
      const ticket = await this.googleClient.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      
      if (!payload) {
        return {
          success: false,
          error: 'Unauthorized',
          message: 'Invalid Google token',
          code: 401
        };
      }

      // Extract user info from verified token
      const providerId = payload.sub; // Google's unique user ID
      const email = payload.email;
      const name = payload.name || payload.given_name || 'User';
      const photoURL = payload.picture || '';

      // Step 2: Check for existing user by provider + providerId
      const db = getFirestore();
      const usersRef = db.collection('Users');
      
      // First, try to find by provider + providerId (most reliable)
      const providerQuery = await usersRef
        .where('Provider', '==', 'google')
        .where('ProviderID', '==', providerId)
        .get();

      let userDoc = null;
      let userId = null;

      if (!providerQuery.empty) {
        // User found by provider ID
        userDoc = providerQuery.docs[0];
        userId = userDoc.id;
      } else {
        // Check if email exists with different provider
        const emailQuery = await usersRef.where('Email', '==', email).get();
        
        if (!emailQuery.empty) {
          const existingDoc = emailQuery.docs[0];
          const existingData = existingDoc.data();
          
          // Same email, different provider - handle account linking
          if (existingData.Provider && existingData.Provider !== 'google') {
            return {
              success: false,
              error: 'Conflict',
              message: `This email is already registered with ${existingData.Provider}. Please use that method to sign in.`,
              code: 409,
              existingProvider: existingData.Provider
            };
          }
          
          // Same provider but different ID (shouldn't happen, but handle it)
          userDoc = existingDoc;
          userId = existingDoc.id;
          
          // Update provider info
          await userDoc.ref.update({
            Provider: 'google',
            ProviderID: providerId,
            UpdatedAt: new Date()
          });
        }
      }

      let isNewUser = false;

      if (!userDoc) {
        // Create new user
        isNewUser = true;
        userId = uuidv4();
        
        const newUserDoc = {
          Username: name,
          Email: email,
          Provider: 'google',
          ProviderID: providerId,
          PhotoURL: photoURL,
          IsActive: true,
          CreatedAt: new Date(),
          UpdatedAt: new Date()
        };

        await usersRef.doc(userId).set(newUserDoc);
        userDoc = await usersRef.doc(userId).get();
      } else {
        // Update last login info
        await userDoc.ref.update({
          UpdatedAt: new Date(),
          LastLoginAt: new Date()
        });
      }

      const userData = userDoc.data();

      // Step 3: Generate tokens
      const { accessToken, refreshToken, expiresAt } = authService.generateTokens(userId);
      
      // Step 4: Create session
      const session = await authService.createSession(userId, accessToken, refreshToken, {
        userAgent: deviceInfo.userAgent,
        ipAddress: deviceInfo.ipAddress
      });

      // Step 5: Log security event
      await authService.logSecurityEvent(userId, isNewUser ? 'REGISTER_SUCCESS' : 'LOGIN_SUCCESS', {
        method: 'google',
        providerId: providerId,
        sessionId: session.id,
        deviceName: session.DeviceName,
        ipAddress: deviceInfo.ipAddress
      });

      return {
        success: true,
        message: isNewUser ? 'User registered with Google successfully' : 'User logged in with Google successfully',
        data: {
          userID: userId,
          username: userData.Username,
          email: userData.Email,
          provider: 'google',
          sessionToken: accessToken,
          refreshToken,
          expiresAt,
          deviceName: session.DeviceName,
          isNewUser
        }
      };

    } catch (error) {
      console.error('Google authentication error:', error);
      
      // Handle specific Google errors
      if (error.message && error.message.includes('Token used too late')) {
        return {
          success: false,
          error: 'Unauthorized',
          message: 'Token expired. Please sign in again.',
          code: 401
        };
      }
      
      if (error.message && error.message.includes('audience')) {
        return {
          success: false,
          error: 'Unauthorized',
          message: 'Invalid token audience',
          code: 401
        };
      }

      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Authenticate with Apple
   * @param {string} idToken - Apple ID token (JWT) from Flutter
   * @param {Object} deviceInfo - Device information from request
   * @param {string} authorizationCode - Optional: Apple authorization code
   * @returns {Object} - Auth result with tokens
   */
  async authenticateApple(idToken, deviceInfo = {}, authorizationCode = null) {
    try {
      // Step 1: Verify Apple ID token
      const decodedToken = jwt.decode(idToken, { complete: false });
      
      if (!decodedToken) {
        return {
          success: false,
          error: 'Unauthorized',
          message: 'Invalid Apple token format',
          code: 401
        };
      }

      // Verify token claims
      const now = Math.floor(Date.now() / 1000);
      
      if (decodedToken.exp && decodedToken.exp < now) {
        return {
          success: false,
          error: 'Unauthorized',
          message: 'Apple token expired',
          code: 401
        };
      }

      // Verify issuer
      if (decodedToken.iss !== this.appleIssuer) {
        return {
          success: false,
          error: 'Unauthorized',
          message: 'Invalid token issuer',
          code: 401
        };
      }

      // Verify audience (your app's client ID)
      if (decodedToken.aud !== this.appleClientId) {
        return {
          success: false,
          error: 'Unauthorized',
          message: 'Invalid token audience',
          code: 401
        };
      }

      // Note: Full signature verification requires fetching Apple's public keys
      // and verifying the JWT signature. For production, implement full verification.
      // For now, we do basic claim verification.

      // Extract user info
      const providerId = decodedToken.sub; // Apple's unique user ID (most reliable!)
      const email = decodedToken.email;
      
      // Apple only sends name on first authentication - might be null
      let name = 'User';
      if (decodedToken.name) {
        name = `${decodedToken.name.firstName || ''} ${decodedToken.name.lastName || ''}`.trim();
      }

      if (!email) {
        // Apple may provide private relay email - handle gracefully
        console.log('Apple sign in without email (private relay or subsequent sign in)');
      }

      // Step 2: Check for existing user by provider + providerId (CRITICAL for Apple)
      const db = getFirestore();
      const usersRef = db.collection('Users');
      
      // For Apple, providerId is the ONLY reliable identifier
      const providerQuery = await usersRef
        .where('Provider', '==', 'apple')
        .where('ProviderID', '==', providerId)
        .get();

      let userDoc = null;
      let userId = null;

      if (!providerQuery.empty) {
        userDoc = providerQuery.docs[0];
        userId = userDoc.id;
      } else if (email) {
        // Check by email only if we have it
        const emailQuery = await usersRef.where('Email', '==', email).get();
        
        if (!emailQuery.empty) {
          const existingDoc = emailQuery.docs[0];
          const existingData = existingDoc.data();
          
          // Same email, different provider
          if (existingData.Provider && existingData.Provider !== 'apple') {
            return {
              success: false,
              error: 'Conflict',
              message: `This email is already registered with ${existingData.Provider}. Please use that method to sign in.`,
              code: 409,
              existingProvider: existingData.Provider
            };
          }
          
          userDoc = existingDoc;
          userId = existingDoc.id;
          
          // Update provider info
          await userDoc.ref.update({
            Provider: 'apple',
            ProviderID: providerId,
            UpdatedAt: new Date()
          });
        }
      }

      let isNewUser = false;

      if (!userDoc) {
        // Create new user
        isNewUser = true;
        userId = uuidv4();
        
        const newUserDoc = {
          Username: name,
          Email: email || null, // Apple may not provide email
          Provider: 'apple',
          ProviderID: providerId, // CRITICAL: This is the reliable identifier
          IsActive: true,
          CreatedAt: new Date(),
          UpdatedAt: new Date()
        };

        await usersRef.doc(userId).set(newUserDoc);
        userDoc = await usersRef.doc(userId).get();
      } else {
        // Update last login
        await userDoc.ref.update({
          UpdatedAt: new Date(),
          LastLoginAt: new Date()
        });
      }

      const userData = userDoc.data();

      // Step 3: Generate tokens
      const { accessToken, refreshToken, expiresAt } = authService.generateTokens(userId);
      
      // Step 4: Create session
      const session = await authService.createSession(userId, accessToken, refreshToken, {
        userAgent: deviceInfo.userAgent,
        ipAddress: deviceInfo.ipAddress
      });

      // Step 5: Log security event
      await authService.logSecurityEvent(userId, isNewUser ? 'REGISTER_SUCCESS' : 'LOGIN_SUCCESS', {
        method: 'apple',
        providerId: providerId,
        sessionId: session.id,
        deviceName: session.DeviceName,
        ipAddress: deviceInfo.ipAddress,
        hasEmail: !!email
      });

      return {
        success: true,
        message: isNewUser ? 'User registered with Apple successfully' : 'User logged in with Apple successfully',
        data: {
          userID: userId,
          username: userData.Username,
          email: userData.Email,
          provider: 'apple',
          sessionToken: accessToken,
          refreshToken,
          expiresAt,
          deviceName: session.DeviceName,
          isNewUser
        }
      };

    } catch (error) {
      console.error('Apple authentication error:', error);
      
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Get Apple public keys for JWT signature verification
   * In production, fetch from: https://appleid.apple.com/auth/keys
   * @returns {Object} - Public keys
   */
  async getApplePublicKeys() {
    try {
      const response = await fetch('https://appleid.apple.com/auth/keys');
      const data = await response.json();
      return data.keys;
    } catch (error) {
      console.error('Failed to fetch Apple public keys:', error);
      throw error;
    }
  }
}

module.exports = new SocialAuthService();
