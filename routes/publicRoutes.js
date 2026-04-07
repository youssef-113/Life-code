const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

/**
 * Public Routes - Web-based access to user emergency information
 * No authentication required - designed for emergency responders and public access
 */

/**
 * @route GET /api/app/public/user/:userID
 * @description Public: Get user emergency information by user ID
 *              Designed for web-based access via barcode/QR code scanning
 * @access Public (no auth required)
 * @param {string} userID - User ID from barcode/QR code
 */
router.get('/public/user/:userID', publicController.getUserProfile);

module.exports = router;
