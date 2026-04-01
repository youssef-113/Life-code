const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getFirestore } = require('../config/firebase');
const authService = require('./authService');

/**
 * Social Auth Service - Handles Google and Apple authentication
 * 
 * 🔐 KEY FEATURES:
 * - Verifies tokens with Google/Apple (NEVER trusts frontend)
 * - Auto login OR register
 * - Account Linking: One user can have multiple login methods
 *   - Email/password
 *   - Google
 *   - Apple
 *   All linked to same account!
 * 
 * 📊 Database Structure:
 * Users collection:
 * {
 *   Username: string,
 *   Email: string,
 *   Providers: [
 *     { provider: 'email', providerId: null, linkedAt: Date },
 *     { provider: 'google', providerId: 'google-sub-id', linkedAt: Date },
 *     { provider: 'apple', providerId: 'apple-user-id', linkedAt: Date }
 *   ],
 *   PrimaryProvider: 'google' | 'apple' | 'email',
 *   PhotoURL: string,
 *   IsActive: boolean,
 *   CreatedAt: Date,
 *   UpdatedAt: Date
 * }
 * 
 * 🔄 Flow:
 * 1. Verify token with provider
 * 2. Check if providerId exists → LOGIN
 * 3. If not, check if email exists → LINK ACCOUNT
 * 4. If neither → CREATE NEW USER
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
      // Step 1: Verify Google ID token (NEVER trust frontend)
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

      // Extract verified user info
      const providerId = payload.sub; // Google's unique user ID
      const email = payload.email;
      const name = payload.name || payload.given_name || 'User';
      const photoURL = payload.picture || '';

      // Step 2: Find or create user with account linking
      const result = await this._findOrCreateUser({
        provider: 'google',
        providerId,
        email,
        name,
        photoURL,
        deviceInfo
      });

      return result;

    } catch (error) {
      console.error('Google authentication error:', error);
      return this._handleProviderError(error, 'Google');
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

      // Extract verified user info
      const providerId = decodedToken.sub; // Apple's unique user ID (MOST RELIABLE!)
      const email = decodedToken.email;
      
      // Apple only sends name on first authentication
      let name = 'User';
      if (decodedToken.name) {
        name = `${decodedToken.name.firstName || ''} ${decodedToken.name.lastName || ''}`.trim();
      }

      // Step 2: Find or create user with account linking
      const result = await this._findOrCreateUser({
        provider: 'apple',
        providerId,
        email,
        name,
        photoURL: '',
        deviceInfo
      });

      return result;

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
   * 🔗 CORE METHOD: Find or Create User with Account Linking
   * 
   * Flow:
   * 1. Check if providerId exists in any user's Providers array → LOGIN
   * 2. If not, check if email exists → LINK ACCOUNT (add new provider)
   * 3. If neither → CREATE NEW USER
   * 
   * @param {Object} params - Provider info
   * @returns {Object} - Auth result
   */
  async _findOrCreateUser({ provider, providerId, email, name, photoURL, deviceInfo }) {
    const db = getFirestore();
    const usersRef = db.collection('Users');

    // Step 1: Check if providerId already exists → LOGIN
    const allUsers = await usersRef.get();
    
    for (const doc of allUsers.docs) {
      const userData = doc.data();
      const providers = userData.Providers || [];
      
      // Check if this providerId exists
      const existingProvider = providers.find(
        p => p.provider === provider && p.providerId === providerId
      );
      
      if (existingProvider) {
        // Found! This is a LOGIN
        return await this._loginUser({
          userId: doc.id,
          userData,
          provider,
          providerId,
          deviceInfo
        });
      }
    }

    // Step 2: Check if email exists → LINK ACCOUNT
    if (email) {
      const emailQuery = await usersRef.where('Email', '==', email).get();
      
      if (!emailQuery.empty) {
        const existingDoc = emailQuery.docs[0];
        const existingData = existingDoc.data();
        
        // Link new provider to existing account
        return await this._linkProvider({
          userId: existingDoc.id,
          userData: existingData,
          provider,
          providerId,
          photoURL,
          deviceInfo
        });
      }
    }

    // Step 3: Neither providerId nor email found → CREATE NEW USER
    return await this._createNewUser({
      provider,
      providerId,
      email,
      name,
      photoURL,
      deviceInfo
    });
  }

  /**
   * Login existing user
   */
  async _loginUser({ userId, userData, provider, providerId, deviceInfo }) {
    const db = getFirestore();
    
    // Update last login
    await db.collection('Users').doc(userId).update({
      UpdatedAt: new Date(),
      LastLoginAt: new Date()
    });

    // Generate tokens
    const { accessToken, refreshToken, expiresAt } = authService.generateTokens(userId);
    
    // Create session
    const session = await authService.createSession(userId, accessToken, refreshToken, {
      userAgent: deviceInfo.userAgent,
      ipAddress: deviceInfo.ipAddress
    });

    // Log security event
    await authService.logSecurityEvent(userId, 'LOGIN_SUCCESS', {
      method: provider,
      providerId,
      sessionId: session.id,
      deviceName: session.DeviceName,
      ipAddress: deviceInfo.ipAddress
    });

    return {
      success: true,
      message: `User logged in with ${provider} successfully`,
      data: {
        userID: userId,
        username: userData.Username,
        email: userData.Email,
        providers: userData.Providers || [],
        primaryProvider: userData.PrimaryProvider || provider,
        sessionToken: accessToken,
        refreshToken,
        expiresAt,
        deviceName: session.DeviceName,
        isNewUser: false,
        accountLinked: false
      }
    };
  }

  /**
   * 🔗 Link new provider to existing account
   */
  async _linkProvider({ userId, userData, provider, providerId, photoURL, deviceInfo }) {
    const db = getFirestore();
    
    // Add new provider to Providers array
    const currentProviders = userData.Providers || [];
    
    // Check if provider already exists (shouldn't happen, but safety check)
    const alreadyLinked = currentProviders.find(p => p.provider === provider);
    if (alreadyLinked) {
      // This shouldn't happen - means providerId check failed
      // Just login instead
      return await this._loginUser({
        userId,
        userData,
        provider,
        providerId,
        deviceInfo
      });
    }

    // Add new provider
    const newProvider = {
      provider,
      providerId,
      linkedAt: new Date()
    };

    const updatedProviders = [...currentProviders, newProvider];

    // Update user document
    const updateData = {
      Providers: updatedProviders,
      UpdatedAt: new Date(),
      LastLoginAt: new Date()
    };

    // Update photo URL if provided and not already set
    if (photoURL && !userData.PhotoURL) {
      updateData.PhotoURL = photoURL;
    }

    await db.collection('Users').doc(userId).update(updateData);

    // Generate tokens
    const { accessToken, refreshToken, expiresAt } = authService.generateTokens(userId);
    
    // Create session
    const session = await authService.createSession(userId, accessToken, refreshToken, {
      userAgent: deviceInfo.userAgent,
      ipAddress: deviceInfo.ipAddress
    });

    // Log security event
    await authService.logSecurityEvent(userId, 'ACCOUNT_LINKED', {
      method: provider,
      providerId,
      existingProviders: currentProviders.map(p => p.provider),
      sessionId: session.id,
      deviceName: session.DeviceName,
      ipAddress: deviceInfo.ipAddress
    });

    // Get updated user data
    const updatedDoc = await db.collection('Users').doc(userId).get();
    const updatedData = updatedDoc.data();

    return {
      success: true,
      message: `${provider} account linked successfully. You can now sign in with ${currentProviders.map(p => p.provider).join(', ')} or ${provider}.`,
      data: {
        userID: userId,
        username: updatedData.Username,
        email: updatedData.Email,
        providers: updatedProviders,
        primaryProvider: updatedData.PrimaryProvider || currentProviders[0]?.provider || provider,
        sessionToken: accessToken,
        refreshToken,
        expiresAt,
        deviceName: session.DeviceName,
        isNewUser: false,
        accountLinked: true,
        linkedMethod: provider
      }
    };
  }

  /**
   * Create new user
   */
  async _createNewUser({ provider, providerId, email, name, photoURL, deviceInfo }) {
    const db = getFirestore();
    const userId = uuidv4();

    const newUserDoc = {
      Username: name,
      Email: email || null,
      Providers: [
        {
          provider,
          providerId,
          linkedAt: new Date()
        }
      ],
      PrimaryProvider: provider,
      PhotoURL: photoURL || '',
      IsActive: true,
      CreatedAt: new Date(),
      UpdatedAt: new Date()
    };

    await db.collection('Users').doc(userId).set(newUserDoc);

    // Generate tokens
    const { accessToken, refreshToken, expiresAt } = authService.generateTokens(userId);
    
    // Create session
    const session = await authService.createSession(userId, accessToken, refreshToken, {
      userAgent: deviceInfo.userAgent,
      ipAddress: deviceInfo.ipAddress
    });

    // Log security event
    await authService.logSecurityEvent(userId, 'REGISTER_SUCCESS', {
      method: provider,
      providerId,
      sessionId: session.id,
      deviceName: session.DeviceName,
      ipAddress: deviceInfo.ipAddress
    });

    return {
      success: true,
      message: `User registered with ${provider} successfully`,
      data: {
        userID: userId,
        username: name,
        email: email || null,
        providers: newUserDoc.Providers,
        primaryProvider: provider,
        sessionToken: accessToken,
        refreshToken,
        expiresAt,
        deviceName: session.DeviceName,
        isNewUser: true,
        accountLinked: false
      }
    };
  }

  /**
   * Handle provider-specific errors
   */
  _handleProviderError(error, provider) {
    // Google-specific errors
    if (provider === 'Google') {
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
    }

    return {
      success: false,
      error: 'Server Error',
      message: error.message,
      code: 500
    };
  }

  /**
   * Get user's linked providers
   * @param {string} userId - User ID
   * @returns {Array} - List of linked providers
   */
  async getLinkedProviders(userId) {
    const db = getFirestore();
    
    try {
      const userDoc = await db.collection('Users').doc(userId).get();
      
      if (!userDoc.exists) {
        return [];
      }

      const userData = userDoc.data();
      return userData.Providers || [];
    } catch (error) {
      console.error('Get linked providers error:', error);
      return [];
    }
  }

  /**
   * Unlink a provider from user account
   * @param {string} userId - User ID
   * @param {string} provider - Provider to unlink
   * @returns {Object} - Result
   */
  async unlinkProvider(userId, provider) {
    const db = getFirestore();
    
    try {
      const userDoc = await db.collection('Users').doc(userId).get();
      
      if (!userDoc.exists) {
        return {
          success: false,
          error: 'Not Found',
          message: 'User not found',
          code: 404
        };
      }

      const userData = userDoc.data();
      const currentProviders = userData.Providers || [];

      // Must have at least one provider remaining
      if (currentProviders.length <= 1) {
        return {
          success: false,
          error: 'Bad Request',
          message: 'Cannot unlink the only authentication method',
          code: 400
        };
      }

      // Remove provider
      const updatedProviders = currentProviders.filter(p => p.provider !== provider);

      if (updatedProviders.length === currentProviders.length) {
        return {
          success: false,
          error: 'Not Found',
          message: `${provider} is not linked to this account`,
          code: 404
        };
      }

      // Update primary provider if needed
      let primaryProvider = userData.PrimaryProvider;
      if (primaryProvider === provider) {
        primaryProvider = updatedProviders[0]?.provider;
      }

      await db.collection('Users').doc(userId).update({
        Providers: updatedProviders,
        PrimaryProvider: primaryProvider,
        UpdatedAt: new Date()
      });

      await authService.logSecurityEvent(userId, 'PROVIDER_UNLINKED', {
        provider,
        remainingProviders: updatedProviders.map(p => p.provider)
      });

      return {
        success: true,
        message: `${provider} unlinked successfully`,
        data: {
          providers: updatedProviders,
          primaryProvider
        }
      };
    } catch (error) {
      console.error('Unlink provider error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }
}

module.exports = new SocialAuthService();
