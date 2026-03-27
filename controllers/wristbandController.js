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

module.exports = {
  registerWristband,
  activateWristband,
  revokeWristband,
  getWristbands
};
