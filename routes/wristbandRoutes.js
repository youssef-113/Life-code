const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  registerWristband,
  activateWristband,
  revokeWristband,
  getWristbands,
  getPrimaryWristband,
  setPrimaryWristband,
  getWristbandWithUser,
  getUserIdFromBand,
  getBandIdentity,
  getWristbandByBandId
} = require('../controllers/wristbandController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * Wristband Routes - Wristband registration and management
 * All routes require authentication
 */

/**
 * @route POST /api/app/wristband/register
 * @description Register a new wristband (upsert: re-activates if same user)
 * @access Private
 */
router.post('/wristband/register', [
  authenticateToken,
  body('qrCode')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('QR code must not be empty if provided'),
  body('nfcTag')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('NFC tag must not be empty if provided')
], registerWristband);

/**
 * @route POST /api/app/wristband/activate
 * @description Activate a wristband
 * @access Private
 */
router.post('/wristband/activate', [
  authenticateToken,
  body('wristbandId')
    .notEmpty()
    .withMessage('wristbandId is required')
], activateWristband);

/**
 * @route POST /api/app/wristband/revoke
 * @description Revoke/deactivate a wristband
 * @access Private
 */
router.post('/wristband/revoke', [
  authenticateToken,
  body('wristbandId')
    .notEmpty()
    .withMessage('wristbandId is required'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must not exceed 500 characters')
], revokeWristband);

/**
 * @route GET /api/app/wristband/list
 * @description Get all wristbands for authenticated user
 * @access Private
 */
router.get('/wristband/list', authenticateToken, getWristbands);

/**
 * @route GET /api/app/wristband/primary
 * @description Get the primary wristband for authenticated user
 * @access Private
 */
router.get('/wristband/primary', authenticateToken, getPrimaryWristband);

/**
 * @route PUT /api/app/wristband/:wristbandId/primary
 * @description Set a wristband as primary
 * @access Private
 */
router.put('/wristband/:wristbandId/primary', authenticateToken, setPrimaryWristband);

/**
 * @route GET /api/app/wristband/:wristbandId/full
 * @description Get wristband with full user info
 * @access Private
 */
router.get('/wristband/:wristbandId/full', authenticateToken, getWristbandWithUser);

/**
 * @route POST /api/app/wristband/resolve-user
 * @description Resolve user ID from QR code or NFC tag
 * @access Private
 */
router.post('/wristband/resolve-user', [
  authenticateToken,
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('identifier is required'),
  body('type')
    .isIn(['qr', 'nfc'])
    .withMessage('type must be either "qr" or "nfc"')
], getUserIdFromBand);

/**
 * @route GET /api/app/wristband/my-band
 * @description Get the BandID, QRCode, and NFCTag that are stored directly
 *              on the authenticated user's record (the user side of the
 *              two-way identity link)
 * @access Private
 */
router.get('/wristband/my-band', authenticateToken, getBandIdentity);

/**
 * @route GET /api/app/wristband/:bandId/info
 * @description Get a wristband document by its Firestore Band ID
 *              (direct lookup — ownership is enforced)
 * @access Private
 */
router.get('/wristband/:bandId/info', authenticateToken, getWristbandByBandId);

module.exports = router;
