const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { 
  updatePersonalInfo, 
  getPersonalInfo,
  updateEmergencyContacts,
  getEmergencyContacts
} = require('../controllers/userProfileController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * User Profile Routes - Personal Information and Emergency Contacts
 * All routes require authentication
 */

/**
 * @route PUT /api/app/profile/personal-info
 * @description Update user personal information (Full Name, Gender, Address)
 * @access Private
 */
router.put('/profile/personal-info', [
  authenticateToken,
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters')
], updatePersonalInfo);

/**
 * @route GET /api/app/profile/personal-info
 * @description Get user personal information
 * @access Private
 */
router.get('/profile/personal-info', authenticateToken, getPersonalInfo);

/**
 * @route PUT /api/app/profile/emergency-contacts
 * @description Update user emergency contacts (supports multiple contacts array or primary/secondary format)
 * @access Private
 */
router.put('/profile/emergency-contacts', [
  authenticateToken,
  // Support both old format (primaryContact, secondaryContact) and new format (contacts array)
  body('contacts')
    .optional()
    .isArray({ min: 1, max: 10 })
    .withMessage('Contacts must be an array with 1-10 items'),
  body('contacts.*.fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Contact full name must be between 2 and 100 characters'),
  body('contacts.*.phoneNumber')
    .optional()
    .trim()
    .matches(/^\+?[0-9]{10,15}$/)
    .withMessage('Contact phone number must be valid (10-15 digits)'),
  body('contacts.*.relationship')
    .optional()
    .isIn(['Father', 'Mother', 'Friend', 'Sister', 'Brother', 'Spouse', 'Other'])
    .withMessage('Invalid relationship type'),
  // Old format support (backward compatibility)
  body('primaryContact')
    .optional()
    .isObject()
    .withMessage('Primary contact must be an object'),
  body('primaryContact.fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Primary contact full name must be between 2 and 100 characters'),
  body('primaryContact.phoneNumber')
    .optional()
    .trim()
    .matches(/^\+?[0-9]{10,15}$/)
    .withMessage('Primary contact phone number must be valid (10-15 digits)'),
  body('primaryContact.relationship')
    .optional()
    .isIn(['Father', 'Mother', 'Friend', 'Sister', 'Brother', 'Spouse', 'Other'])
    .withMessage('Invalid relationship type'),
  body('secondaryContact')
    .optional()
    .isObject()
    .withMessage('Secondary contact must be an object'),
  body('secondaryContact.fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Secondary contact full name must be between 2 and 100 characters'),
  body('secondaryContact.phoneNumber')
    .optional()
    .trim()
    .matches(/^\+?[0-9]{10,15}$/)
    .withMessage('Secondary contact phone number must be valid (10-15 digits)'),
  body('secondaryContact.relationship')
    .optional()
    .isIn(['Father', 'Mother', 'Friend', 'Sister', 'Brother', 'Spouse', 'Other'])
    .withMessage('Invalid relationship type')
], updateEmergencyContacts);

/**
 * @route GET /api/app/profile/emergency-contacts
 * @description Get user emergency contacts
 * @access Private
 */
router.get('/profile/emergency-contacts', authenticateToken, getEmergencyContacts);

module.exports = router;
