const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  addContact,
  updateContact,
  deleteContact,
  getContacts,
  getContact,
  setPrimary
} = require('../controllers/emergencyContactController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * Emergency Contact Routes - CRUD for emergency contacts
 * All routes require authentication
 */

/**
 * @route POST /api/app/emergency/contact
 * @description Add a new emergency contact
 * @access Private
 */
router.post('/emergency/contact', [
  authenticateToken,
  body('ContactName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Contact name must be between 2 and 100 characters'),
  body('Relation')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Relation must not exceed 50 characters'),
  body('PhoneNumber')
    .trim()
    .matches(/^\+?[0-9]{10,15}$/)
    .withMessage('Phone number must be valid E.164 format (10-15 digits)'),
  body('SecondaryPhone')
    .optional()
    .trim()
    .matches(/^\+?[0-9]{10,15}$/)
    .withMessage('Secondary phone must be valid E.164 format (10-15 digits)'),
  body('Email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Must be a valid email address'),
  body('IsPrimary')
    .optional()
    .isBoolean()
    .withMessage('IsPrimary must be a boolean'),
  body('Priority')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Priority must be an integer between 1 and 10'),
  body('Notes')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Notes must not exceed 255 characters')
], addContact);

/**
 * @route GET /api/app/emergency/contacts
 * @description Get all emergency contacts for authenticated user
 * @access Private
 */
router.get('/emergency/contacts', authenticateToken, getContacts);

/**
 * @route GET /api/app/emergency/contact/:id
 * @description Get a single emergency contact
 * @access Private
 */
router.get('/emergency/contact/:id', authenticateToken, getContact);

/**
 * @route PUT /api/app/emergency/contact/:id
 * @description Update an existing emergency contact
 * @access Private
 */
router.put('/emergency/contact/:id', [
  authenticateToken,
  body('ContactName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Contact name must be between 2 and 100 characters'),
  body('Relation')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Relation must not exceed 50 characters'),
  body('PhoneNumber')
    .optional()
    .trim()
    .matches(/^\+?[0-9]{10,15}$/)
    .withMessage('Phone number must be valid E.164 format (10-15 digits)'),
  body('SecondaryPhone')
    .optional()
    .trim()
    .matches(/^\+?[0-9]{10,15}$/)
    .withMessage('Secondary phone must be valid E.164 format (10-15 digits)'),
  body('Email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Must be a valid email address'),
  body('IsPrimary')
    .optional()
    .isBoolean()
    .withMessage('IsPrimary must be a boolean'),
  body('Priority')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Priority must be an integer between 1 and 10'),
  body('Notes')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Notes must not exceed 255 characters')
], updateContact);

/**
 * @route DELETE /api/app/emergency/contact/:id
 * @description Delete an emergency contact
 * @access Private
 */
router.delete('/emergency/contact/:id', authenticateToken, deleteContact);

/**
 * @route PUT /api/app/emergency/contact/:id/primary
 * @description Set a contact as the primary emergency contact
 * @access Private
 */
router.put('/emergency/contact/:id/primary', authenticateToken, setPrimary);

module.exports = router;
