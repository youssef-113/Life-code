const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  addContact,
  updateContact,
  deleteContact,
  getContacts,
  getContact,
  setPrimary,
  addMultipleContacts
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
    .withMessage('Full name must be between 2 and 100 characters'),
  body('phoneNumbers')
    .isArray({ min: 1, max: 5 })
    .withMessage('phoneNumbers must be an array with 1-5 items'),
  body('phoneNumbers.*')
    .trim()
    .matches(/^[+]?[0-9]{10,15}$/)
    .withMessage('Each phone number must be valid (10-15 digits)'),
  body('relationship')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Relationship must be between 1 and 50 characters'),
  body('isPrimary')
    .optional()
    .isBoolean()
    .withMessage('isPrimary must be a boolean'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Notes must not exceed 255 characters')
], addContact);

/**
 * @route POST /api/app/emergency/contacts/bulk
 * @description Add multiple emergency contacts at once
 * @access Private
 */
router.post('/emergency/contacts/bulk', [
  authenticateToken,
  body('contacts')
    .isArray({ min: 1, max: 10 })
    .withMessage('contacts must be an array with 1-10 items'),
  body('contacts.*.ContactName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Contact full name must be between 2 and 100 characters'),
  body('contacts.*.phoneNumbers')
    .isArray({ min: 1, max: 5 })
    .withMessage('phoneNumbers must be an array with 1-5 items'),
  body('contacts.*.phoneNumbers.*')
    .trim()
    .matches(/^[+]?[0-9]{10,15}$/)
    .withMessage('Each phone number must be valid (10-15 digits)'),
  body('contacts.*.relationship')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Relationship must be between 1 and 50 characters'),
  body('contacts.*.isPrimary')
    .optional()
    .isBoolean()
    .withMessage('isPrimary must be a boolean'),
  body('contacts.*.notes')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Notes must not exceed 255 characters')
], addMultipleContacts);

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
    .withMessage('Full name must be between 2 and 100 characters'),
  body('phoneNumbers')
    .optional()
    .isArray({ min: 1, max: 5 })
    .withMessage('phoneNumbers must be an array with 1-5 items'),
  body('phoneNumbers.*')
    .optional()
    .trim()
    .matches(/^[+]?[0-9]{10,15}$/)
    .withMessage('Each phone number must be valid (10-15 digits)'),
  body('relationship')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Relationship must be between 1 and 50 characters'),
  body('isPrimary')
    .optional()
    .isBoolean()
    .withMessage('isPrimary must be a boolean'),
  body('notes')
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
