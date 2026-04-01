const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getMedicalProfile,
  updatePersonalInfo,
  updateEmergencyContact,
  updateMedicalProfile,
  updateAllergies,
  updateMedications,
  updateSurgeries
} = require('../controllers/medicalProfileController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { resolveProfileId } = require('../middleware/profileMiddleware');

/**
 * Medical Profile Routes - Medical Profile screen endpoints
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
 * @route GET /api/app/medical/profile
 * @description Get the full Medical Profile dashboard
 * @returns userHeader, profileCompletion%, quickStats, sections (with data + counts)
 * @access Private
 */
router.get('/medical/profile', [authenticateToken, resolveProfileId], getMedicalProfile);

/**
 * @route PUT /api/app/medical/personal-info
 * @description Update Personal Information section
 * @fields name, gender, address
 * @access Private
 */
router.put('/medical/personal-info', [
  authenticateToken,
  resolveProfileId,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('gender')
    .optional()
    .trim()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters')
], updatePersonalInfo);

/**
 * @route PUT /api/app/medical/emergency-contact
 * @description Update Emergency Contact section
 * @fields primary (object), secondary (array)
 * @access Private
 */
router.put('/medical/emergency-contact', [
  authenticateToken,
  resolveProfileId,
  body('primary')
    .optional()
    .isObject()
    .withMessage('Primary contact must be an object'),
  body('primary.fullName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Full name is required and must not exceed 100 characters'),
  body('primary.phoneNumber')
    .optional()
    .trim()
    .matches(/^[+]?[0-9\s-]{8,20}$/)
    .withMessage('Phone number must be valid'),
  body('primary.relationship')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Relationship must not exceed 50 characters'),
  body('secondary')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Secondary contacts must be an array with max 5 items'),
  body('secondary.*.fullName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Full name must not exceed 100 characters'),
  body('secondary.*.phoneNumber')
    .optional()
    .trim()
    .matches(/^[+]?[0-9\s-]{8,20}$/)
    .withMessage('Phone number must be valid'),
  body('secondary.*.relationship')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Relationship must not exceed 50 characters')
], updateEmergencyContact);

/**
 * @route PUT /api/app/medical/medical-profile
 * @description Update Medical Profile section
 * @fields bloodType, medicalConditions
 * @access Private
 */
router.put('/medical/medical-profile', [
  authenticateToken,
  resolveProfileId,
  body('bloodType')
    .optional()
    .isIn(BLOOD_TYPES)
    .withMessage('Blood type must be A+, A-, B+, B-, AB+, AB-, O+, or O-'),
  body('medicalConditions')
    .optional()
    .isArray({ max: 50 })
    .withMessage('Medical conditions must be an array with max 50 items'),
  body('medicalConditions.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Each condition must not exceed 200 characters')
], updateMedicalProfile);

/**
 * @route PUT /api/app/medical/allergies
 * @description Update Allergies section
 * @fields allergies (array of { allergyType, severity, notes })
 * @access Private
 */
router.put('/medical/allergies', [
  authenticateToken,
  resolveProfileId,
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
    .withMessage('Notes must not exceed 500 characters')
], updateAllergies);

/**
 * @route PUT /api/app/medical/medications
 * @description Update Current Medications section
 * @fields medications (array of { medicationName, dosage, schedule, notes })
 * @access Private
 */
router.put('/medical/medications', [
  authenticateToken,
  resolveProfileId,
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
    .withMessage('Notes must not exceed 500 characters')
], updateMedications);

/**
 * @route PUT /api/app/medical/surgeries
 * @description Update Surgical History section
 * @fields surgeries (array of { surgeryName, surgeryDate, notes })
 * @access Private
 */
router.put('/medical/surgeries', [
  authenticateToken,
  resolveProfileId,
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
], updateSurgeries);

module.exports = router;
