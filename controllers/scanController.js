const scanService = require('../services/scanService');
const { validationResult } = require('express-validator');

/**
 * Scan Controller - Handles public QR/NFC scans and scan history
 */

/**
 * Scan QR code (public endpoint — no auth required)
 * @route POST /api/app/scan/qr
 * @access Public
 */
const scanQR = async (req, res) => {
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

    const { qrCode, latitude, longitude, location, scannerType } = req.body;

    if (!qrCode) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'qrCode is required',
        code: 400
      });
    }

    const result = await scanService.scanQR(qrCode, {
      latitude,
      longitude,
      location,
      scannerType,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Scan QR controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

/**
 * Scan NFC tag (public endpoint — no auth required)
 * @route POST /api/app/scan/nfc
 * @access Public
 */
const scanNFC = async (req, res) => {
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

    const { nfcTag, latitude, longitude, location, scannerType } = req.body;

    if (!nfcTag) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'nfcTag is required',
        code: 400
      });
    }

    const result = await scanService.scanNFC(nfcTag, {
      latitude,
      longitude,
      location,
      scannerType,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Scan NFC controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

/**
 * Get scan history for authenticated user
 * @route GET /api/app/scan/history
 * @access Private
 */
const getScanHistory = async (req, res) => {
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

    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;

    // Validate pagination params
    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Limit must be between 1 and 100',
        code: 400
      });
    }

    if (page < 1) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Page must be at least 1',
        code: 400
      });
    }

    const result = await scanService.getScanHistory(userID, limit, page);

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Get scan history controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

module.exports = {
  scanQR,
  scanNFC,
  getScanHistory
};
