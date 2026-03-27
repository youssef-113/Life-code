const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { 
  createMedicalInfo,
  updateMedicalInfo,
  getMedicalInfo
} = require('../controllers/medicalController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * Medical Information Routes - Medical profile management
 * All routes require authentication
 */

// Valid blood types
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/**
 * @route POST /api/app/medical
 * @description Create medical information
 * @access Private
 */
router.post('/medical', [
  authenticateToken,
  body('bloodType')
    .isIn(BLOOD_TYPES)
    .withMessage('Invalid blood type. Must be one of: ' + BLOOD_TYPES.join(', ')),
  body('height')
    .isFloat({ min: 50, max: 300 })
    .withMessage('Height must be a positive number between 50 and 300 cm'),
  body('weight')
    .isFloat({ min: 10, max: 500 })
    .withMessage('Weight must be a positive number between 10 and 500 kg'),
  body('chronicDiseases')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Chronic diseases must not exceed 1000 characters'),
  body('allergies')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Allergies must not exceed 1000 characters'),
  body('medications')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Medications must not exceed 1000 characters'),
  body('surgeries')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Surgeries must not exceed 1000 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes must not exceed 2000 characters'),
  body('emergencyInstructions')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Emergency instructions must not exceed 1000 characters')
], createMedicalInfo);

/**
 * @route PUT /api/app/medical
 * @description Update medical information
 * @access Private
 */
router.put('/medical', [
  authenticateToken,
  body('bloodType')
    .optional()
    .isIn(BLOOD_TYPES)
    .withMessage('Invalid blood type. Must be one of: ' + BLOOD_TYPES.join(', ')),
  body('height')
    .optional()
    .isFloat({ min: 50, max: 300 })
    .withMessage('Height must be a positive number between 50 and 300 cm'),
  body('weight')
    .optional()
    .isFloat({ min: 10, max: 500 })
    .withMessage('Weight must be a positive number between 10 and 500 kg'),
  body('chronicDiseases')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Chronic diseases must not exceed 1000 characters'),
  body('allergies')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Allergies must not exceed 1000 characters'),
  body('medications')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Medications must not exceed 1000 characters'),
  body('surgeries')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Surgeries must not exceed 1000 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes must not exceed 2000 characters'),
  body('emergencyInstructions')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Emergency instructions must not exceed 1000 characters')
], updateMedicalInfo);

/**
 * @route GET /api/app/medical
 * @description Get medical information
 * @access Private
 */
router.get('/medical', authenticateToken, getMedicalInfo);

module.exports = router;
