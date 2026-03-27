const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  changePassword,
  uploadPhoto,
  deleteAccount,
  updatePreferences,
  getPreferences,
  getCompleteProfile
} = require('../controllers/userAccountController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * User Account Routes - Password, Photo, Account, Preferences
 * All routes require authentication
 */

/**
 * @route POST /api/app/user/password
 * @description Change user password
 * @access Private
 */
router.post('/user/password', [
  authenticateToken,
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
], changePassword);

/**
 * @route POST /api/app/user/photo
 * @description Upload/update profile photo
 * @access Private
 */
router.post('/user/photo', [
  authenticateToken,
  body('photo')
    .optional()
    .notEmpty()
    .withMessage('Photo data must not be empty'),
  body('photoURL')
    .optional()
    .isURL()
    .withMessage('Photo URL must be a valid URL')
], uploadPhoto);

/**
 * @route DELETE /api/app/user/account
 * @description Delete (deactivate) user account
 * @access Private
 */
router.delete('/user/account', authenticateToken, deleteAccount);

/**
 * @route PUT /api/app/user/preferences
 * @description Update notification and privacy preferences
 * @access Private
 */
router.put('/user/preferences', [
  authenticateToken,
  body('pushNotifications')
    .optional()
    .isBoolean()
    .withMessage('pushNotifications must be a boolean'),
  body('emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('emailNotifications must be a boolean'),
  body('showMedicalOnScan')
    .optional()
    .isBoolean()
    .withMessage('showMedicalOnScan must be a boolean'),
  body('showContactsOnScan')
    .optional()
    .isBoolean()
    .withMessage('showContactsOnScan must be a boolean'),
  body('showPhotoOnScan')
    .optional()
    .isBoolean()
    .withMessage('showPhotoOnScan must be a boolean')
], updatePreferences);

/**
 * @route GET /api/app/user/preferences
 * @description Get user notification and privacy preferences
 * @access Private
 */
router.get('/user/preferences', authenticateToken, getPreferences);

/**
 * @route GET /api/app/user/complete
 * @description Get complete user profile (user + medical + contacts + wristbands)
 * @access Private
 */
router.get('/user/complete', authenticateToken, getCompleteProfile);

module.exports = router;
