const wristbandService = require('../services/wristbandService');
const authService = require('../services/authService');

/**
 * Band Middleware - Verifies band ownership and access rights
 */

/**
 * Verify user owns the wristband
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
const verifyBandOwnership = async (req, res, next) => {
  try {
    const userID = req.user?.userID;
    const wristbandId = req.params.wristbandId || req.body.wristbandId;

    if (!userID) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
        code: 401
      });
    }

    if (!wristbandId) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'wristbandId is required',
        code: 400
      });
    }

    // Get wristband and verify ownership
    const result = await wristbandService.getWristbandWithUser(wristbandId);

    if (!result.success) {
      return res.status(result.code || 404).json(result);
    }

    if (result.data.wristband.UserID !== userID) {
      // Log unauthorized access attempt
      await authService.logSecurityEvent(userID, 'UNAUTHORIZED_BAND_ACCESS', {
        wristbandId,
        ownerID: result.data.wristband.UserID
      });

      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to access this wristband',
        code: 403
      });
    }

    // Attach wristband data to request for use in controllers
    req.wristband = result.data.wristband;
    next();
  } catch (error) {
    console.error('Band ownership verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Band ownership verification failed',
      code: 500
    });
  }
};

/**
 * Verify user has an active primary wristband
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
const requirePrimaryBand = async (req, res, next) => {
  try {
    const userID = req.user?.userID;

    if (!userID) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
        code: 401
      });
    }

    const result = await wristbandService.getPrimaryWristband(userID);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'User must have an active primary wristband to perform this action',
        code: 400
      });
    }

    // Attach primary wristband to request
    req.primaryWristband = result.data;
    next();
  } catch (error) {
    console.error('Primary band verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Primary band verification failed',
      code: 500
    });
  }
};

/**
 * Verify QR code or NFC tag belongs to requesting user
 * @param {string} type - 'qr' or 'nfc'
 */
const verifyBandIdentifier = (type = 'qr') => {
  return async (req, res, next) => {
    try {
      const userID = req.user?.userID;
      const identifier = req.body.qrCode || req.body.nfcTag || req.body.identifier;

      if (!userID) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated',
          code: 401
        });
      }

      if (!identifier) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: `Band identifier (${type}) is required`,
          code: 400
        });
      }

      // Resolve user from band identifier
      const result = await wristbandService.getUserIdFromBand(identifier, type);

      if (!result.success) {
        return res.status(result.code || 404).json(result);
      }

      if (result.data.userID !== userID) {
        await authService.logSecurityEvent(userID, 'UNAUTHORIZED_BAND_IDENTIFIER_ACCESS', {
          identifier,
          type,
          ownerID: result.data.userID
        });

        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'This band does not belong to you',
          code: 403
        });
      }

      // Attach band info to request
      req.bandInfo = result.data;
      next();
    } catch (error) {
      console.error('Band identifier verification error:', error);
      return res.status(500).json({
        success: false,
        error: 'Server Error',
        message: 'Band identifier verification failed',
        code: 500
      });
    }
  };
};

/**
 * Check if user can register a new band (enforce one active band limit)
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
const canRegisterBand = async (req, res, next) => {
  try {
    const userID = req.user?.userID;

    if (!userID) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
        code: 401
      });
    }

    // This check is already done in the service, but this middleware
    // can be used for early rejection before processing other logic
    next();
  } catch (error) {
    console.error('Can register band check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Band registration check failed',
      code: 500
    });
  }
};

module.exports = {
  verifyBandOwnership,
  requirePrimaryBand,
  verifyBandIdentifier,
  canRegisterBand
};
