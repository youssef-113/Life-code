const authService = require('../services/authService');

/**
 * Auth Middleware - Verifies JWT tokens and session validity
 */

/**
 * Verify JWT token and attach user to request
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No token provided. Authorization header with Bearer token required.',
        code: 401
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify session with auth service
    const verification = await authService.verifySession(token);

    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: verification.error || 'Invalid or expired token',
        code: 401
      });
    }

    // Attach user info to request
    req.user = {
      userID: verification.userID,
      sessionId: verification.sessionId
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Authentication failed',
      code: 500
    });
  }
};

/**
 * Optional authentication - attaches user if token present but doesn't require it
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const verification = await authService.verifySession(token);

      if (verification.valid) {
        req.user = {
          userID: verification.userID,
          sessionId: verification.sessionId
        };
      }
    }

    next();
  } catch (error) {
    // Continue without user info
    next();
  }
};

/**
 * Check if user owns the resource
 * @param {string} resourceUserIdField - Field name containing the resource owner's ID
 */
const requireOwnership = (resourceUserIdField = 'userID') => {
  return async (req, res, next) => {
    try {
      const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
      const currentUserId = req.user?.userID;

      if (!currentUserId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
          code: 401
        });
      }

      if (resourceUserId && resourceUserId !== currentUserId) {
        // Log unauthorized access attempt
        await authService.logSecurityEvent(currentUserId, 'UNAUTHORIZED_ACCESS', {
          attemptedResource: req.originalUrl,
          resourceUserId
        });

        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to access this resource',
          code: 403
        });
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Server Error',
        message: 'Authorization check failed',
        code: 500
      });
    }
  };
};

/**
 * Admin only middleware - checks if user has admin claims
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
const requireAdmin = async (req, res, next) => {
  try {
    const userID = req.user?.userID;

    if (!userID) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 401
      });
    }

    // Check if user has admin role in Firestore
    const userResult = await authService.getUserById(userID);

    if (!userResult.exists || userResult.data.Role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Admin access required',
        code: 403
      });
    }

    req.user.isAdmin = true;
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Admin verification failed',
      code: 500
    });
  }
};

/**
 * Rate limiting middleware helper (to be used with express-rate-limit)
 * Key generator for rate limiting by user ID
 */
const rateLimitKeyGenerator = (req) => {
  return req.user?.userID || req.ip;
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireOwnership,
  requireAdmin,
  rateLimitKeyGenerator
};
