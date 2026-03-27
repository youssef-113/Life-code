const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  registerWristband,
  activateWristband,
  revokeWristband,
  getWristbands
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

module.exports = router;
