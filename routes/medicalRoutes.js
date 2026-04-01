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
 * 
 * Data Structure:
 * - personalInfo: { name, gender, address }
 * - emergencyContact: { primary: {...}, secondary: [...] }
 * - medicalProfile: { bloodType, medicalConditions }
 * - allergies: [{ allergyType, severity, notes }]
 * - medications: [{ medicationName, dosage, schedule, notes }]
 * - surgeries: [{ surgeryName, surgeryDate, notes }]
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
  body('personalInfo')
    .isObject()
    .withMessage('personalInfo must be an object'),
  body('personalInfo.name')
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be between 1 and 100 characters'),
  body('personalInfo.gender')
    .optional()
    .trim()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  body('personalInfo.address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),
  body('emergencyContact')
    .optional()
    .isObject()
    .withMessage('emergencyContact must be an object'),
  body('emergencyContact.primary')
    .optional()
    .isObject()
    .withMessage('primary emergency contact must be an object'),
  body('emergencyContact.primary.fullName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Full name must not exceed 100 characters'),
  body('emergencyContact.primary.phoneNumber')
    .optional()
    .trim()
    .matches(/^[+]?[0-9\s-]{8,20}$/)
    .withMessage('Phone number must be valid'),
  body('emergencyContact.primary.relationship')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Relationship must not exceed 50 characters'),
  body('emergencyContact.secondary')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Secondary contacts must be an array with max 5 items'),
  body('medicalProfile')
    .optional()
    .isObject()
    .withMessage('medicalProfile must be an object'),
  body('medicalProfile.bloodType')
    .optional()
    .isIn(BLOOD_TYPES)
    .withMessage('Invalid blood type. Must be one of: ' + BLOOD_TYPES.join(', ')),
  body('medicalProfile.medicalConditions')
    .optional()
    .isArray({ max: 50 })
    .withMessage('Medical conditions must be an array with max 50 items'),
  body('medicalProfile.medicalConditions.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Each condition must not exceed 200 characters'),
  body('allergies')
    .optional()
    .isArray({ max: 50 })
    .withMessage('Allergies must be an array with max 50 items'),
  body('allergies.*.allergyType')
    .optional()
    .trim()
    .notEmpty()
    .isLength({ max: 100 })
    .withMessage('Allergy type is required and must not exceed 100 characters'),
  body('allergies.*.severity')
    .optional()
    .trim()
    .isIn(['Mild', 'Moderate', 'Severe'])
    .withMessage('Severity must be Mild, Moderate, or Severe'),
  body('allergies.*.notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  body('medications')
    .optional()
    .isArray({ max: 50 })
    .withMessage('Medications must be an array with max 50 items'),
  body('medications.*.medicationName')
    .optional()
    .trim()
    .notEmpty()
    .isLength({ max: 100 })
    .withMessage('Medication name is required and must not exceed 100 characters'),
  body('medications.*.dosage')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Dosage must not exceed 100 characters'),
  body('medications.*.schedule')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Schedule must not exceed 100 characters'),
  body('medications.*.notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  body('surgeries')
    .optional()
    .isArray({ max: 50 })
    .withMessage('Surgeries must be an array with max 50 items'),
  body('surgeries.*.surgeryName')
    .optional()
    .trim()
    .notEmpty()
    .isLength({ max: 200 })
    .withMessage('Surgery name is required and must not exceed 200 characters'),
  body('surgeries.*.surgeryDate')
    .optional()
    .isISO8601()
    .withMessage('Surgery date must be a valid date'),
  body('surgeries.*.notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
], createMedicalInfo);

/**
 * @route PUT /api/app/medical
 * @description Update medical information
 * @access Private
 */
router.put('/medical', [
  authenticateToken,
  body('personalInfo')
    .optional()
    .isObject()
    .withMessage('personalInfo must be an object'),
  body('personalInfo.name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('personalInfo.gender')
    .optional()
    .trim()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  body('personalInfo.address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),
  body('emergencyContact')
    .optional()
    .isObject()
    .withMessage('emergencyContact must be an object'),
  body('emergencyContact.primary')
    .optional()
    .isObject()
    .withMessage('primary emergency contact must be an object'),
  body('emergencyContact.primary.fullName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Full name must not exceed 100 characters'),
  body('emergencyContact.primary.phoneNumber')
    .optional()
    .trim()
    .matches(/^[+]?[0-9\s-]{8,20}$/)
    .withMessage('Phone number must be valid'),
  body('emergencyContact.primary.relationship')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Relationship must not exceed 50 characters'),
  body('emergencyContact.secondary')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Secondary contacts must be an array with max 5 items'),
  body('medicalProfile')
    .optional()
    .isObject()
    .withMessage('medicalProfile must be an object'),
  body('medicalProfile.bloodType')
    .optional()
    .isIn(BLOOD_TYPES)
    .withMessage('Invalid blood type. Must be one of: ' + BLOOD_TYPES.join(', ')),
  body('medicalProfile.medicalConditions')
    .optional()
    .isArray({ max: 50 })
    .withMessage('Medical conditions must be an array with max 50 items'),
  body('medicalProfile.medicalConditions.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Each condition must not exceed 200 characters'),
  body('allergies')
    .optional()
    .isArray({ max: 50 })
    .withMessage('Allergies must be an array with max 50 items'),
  body('allergies.*.allergyType')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Allergy type must not exceed 100 characters'),
  body('allergies.*.severity')
    .optional()
    .trim()
    .isIn(['Mild', 'Moderate', 'Severe'])
    .withMessage('Severity must be Mild, Moderate, or Severe'),
  body('allergies.*.notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  body('medications')
    .optional()
    .isArray({ max: 50 })
    .withMessage('Medications must be an array with max 50 items'),
  body('medications.*.medicationName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Medication name must not exceed 100 characters'),
  body('medications.*.dosage')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Dosage must not exceed 100 characters'),
  body('medications.*.schedule')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Schedule must not exceed 100 characters'),
  body('medications.*.notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  body('surgeries')
    .optional()
    .isArray({ max: 50 })
    .withMessage('Surgeries must be an array with max 50 items'),
  body('surgeries.*.surgeryName')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Surgery name must not exceed 200 characters'),
  body('surgeries.*.surgeryDate')
    .optional()
    .isISO8601()
    .withMessage('Surgery date must be a valid date'),
  body('surgeries.*.notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters')
], updateMedicalInfo);

/**
 * @route GET /api/app/medical
 * @description Get medical information
 * @access Private
 */
router.get('/medical', authenticateToken, getMedicalInfo);

module.exports = router;
