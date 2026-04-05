const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { scanQR, scanNFC, getScanHistory, scanByBandId } = require('../controllers/scanController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * Scan Routes - Public QR/NFC scanning and private scan history
 */

/**
 * @route POST /api/app/scan/qr
 * @description Public: Scan a QR code to get user emergency information
 * @access Public (no auth required)
 */
router.post('/scan/qr', [
  body('qrCode')
    .trim()
    .notEmpty()
    .withMessage('QR code is required'),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Location must not exceed 500 characters'),
  body('scannerType')
    .optional()
    .isIn(['emergency', 'hospital', 'public', 'personal'])
    .withMessage('Scanner type must be one of: emergency, hospital, public, personal')
], scanQR);

/**
 * @route POST /api/app/scan/nfc
 * @description Public: Scan an NFC tag to get user emergency information
 * @access Public (no auth required)
 */
router.post('/scan/nfc', [
  body('nfcTag')
    .trim()
    .notEmpty()
    .withMessage('NFC tag is required'),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Location must not exceed 500 characters'),
  body('scannerType')
    .optional()
    .isIn(['emergency', 'hospital', 'public', 'personal'])
    .withMessage('Scanner type must be one of: emergency, hospital, public, personal')
], scanNFC);

/**
 * @route GET /api/app/scan/history
 * @description Get scan history for authenticated user (paginated)
 * @access Private
 * @query {number} limit - Results per page (default: 50, max: 100)
 * @query {number} page - Page number (default: 1)
 */
router.get('/scan/history', authenticateToken, getScanHistory);

/**
 * @route POST /api/app/scan/band
 * @description Public: Scan using the Band ID (Firestore document ID).
 *              NFC chips can store this ID directly.
 *              Returns the same emergency data as QR/NFC scan.
 * @access Public (no auth required)
 */
router.post('/scan/band', [
  body('bandId')
    .trim()
    .notEmpty()
    .withMessage('bandId is required'),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Location must not exceed 500 characters'),
  body('scannerType')
    .optional()
    .isIn(['emergency', 'hospital', 'public', 'personal'])
    .withMessage('Scanner type must be one of: emergency, hospital, public, personal')
], scanByBandId);

module.exports = router;
