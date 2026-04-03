const wristbandService = require('../services/wristbandService');
const { validationResult } = require('express-validator');

/**
 * Wristband Controller - Handles wristband registration and management
 */

/**
 * Register a new wristband
 * @route POST /api/app/wristband/register
 * @access Private
 */
const registerWristband = async (req, res) => {
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

    const userID = req.user?.userID;
    if (!userID) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
        code: 401
      });
    }

    const { qrCode, nfcTag } = req.body;

    if (!qrCode && !nfcTag) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'At least one of qrCode or nfcTag is required',
        code: 400
      });
    }

    const result = await wristbandService.registerWristband(userID, { qrCode, nfcTag });

    const statusCode = result.success ? 201 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Register wristband controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

/**
 * Activate a wristband
 * @route POST /api/app/wristband/activate
 * @access Private
 */
const activateWristband = async (req, res) => {
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

    const userID = req.user?.userID;
    if (!userID) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
        code: 401
      });
    }

    const { wristbandId } = req.body;
    if (!wristbandId) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'wristbandId is required',
        code: 400
      });
    }

    const result = await wristbandService.activateWristband(userID, wristbandId);

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Activate wristband controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

/**
 * Revoke a wristband
 * @route POST /api/app/wristband/revoke
 * @access Private
 */
const revokeWristband = async (req, res) => {
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

    const userID = req.user?.userID;
    if (!userID) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
        code: 401
      });
    }

    const { wristbandId, reason } = req.body;
    if (!wristbandId) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'wristbandId is required',
        code: 400
      });
    }

    const result = await wristbandService.revokeWristband(userID, wristbandId, reason);

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Revoke wristband controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

/**
 * Get all wristbands for user
 * @route GET /api/app/wristband/list
 * @access Private
 */
const getWristbands = async (req, res) => {
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

    const result = await wristbandService.getWristbands(userID);

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Get wristbands controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

/**
 * Get primary wristband for user
 * @route GET /api/app/wristband/primary
 * @access Private
 */
const getPrimaryWristband = async (req, res) => {
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

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Get primary wristband controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

/**
 * Set a wristband as primary
 * @route PUT /api/app/wristband/:wristbandId/primary
 * @access Private
 */
const setPrimaryWristband = async (req, res) => {
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

    const { wristbandId } = req.params;
    if (!wristbandId) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'wristbandId is required',
        code: 400
      });
    }

    const result = await wristbandService.setPrimaryWristband(userID, wristbandId);

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Set primary wristband controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

/**
 * Get wristband by ID with user info
 * @route GET /api/app/wristband/:wristbandId/full
 * @access Private
 */
const getWristbandWithUser = async (req, res) => {
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

    const { wristbandId } = req.params;
    if (!wristbandId) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'wristbandId is required',
        code: 400
      });
    }

    const result = await wristbandService.getWristbandWithUser(wristbandId);

    // Verify ownership
    if (result.success && result.data?.wristband?.UserID !== userID) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to access this wristband',
        code: 403
      });
    }

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Get wristband with user controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

/**
 * Get user ID from QR/NFC identifier
 * @route POST /api/app/wristband/resolve-user
 * @access Private
 */
const getUserIdFromBand = async (req, res) => {
  try {
    const { identifier, type } = req.body;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'identifier is required',
        code: 400
      });
    }

    if (!type || !['qr', 'nfc'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'type must be either "qr" or "nfc"',
        code: 400
      });
    }

    const result = await wristbandService.getUserIdFromBand(identifier, type);

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Get user ID from band controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

module.exports = {
  registerWristband,
  activateWristband,
  revokeWristband,
  getWristbands,
  getPrimaryWristband,
  setPrimaryWristband,
  getWristbandWithUser,
  getUserIdFromBand
};
