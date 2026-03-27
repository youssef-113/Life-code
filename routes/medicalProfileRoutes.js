const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getMedicalProfile,
  updateGeneralInfo,
  updateConditions,
  updateAllergies,
  updateMedications,
  updateSurgeries,
  updateEmergencyInstructions
} = require('../controllers/medicalProfileController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { resolveProfileId } = require('../middleware/profileMiddleware');

/**
 * Medical Profile Routes - Medical Profile screen endpoints
 * All routes require authentication
 * Matches the Medical Profile UI with section-based data
 */

/**
 * @route GET /api/app/medical/profile
 * @description Get the full Medical Profile dashboard
 * @returns userHeader, profileCompletion%, quickStats, sections (with data + counts)
 * @access Private
 */
router.get('/medical/profile', [authenticateToken, resolveProfileId], getMedicalProfile);

/**
 * @route PUT /api/app/medical/general-info
 * @description Update General Information section
 * @fields Username, DateOfBirth, Gender, BloodType, Height, Weight, NationalID, PhoneNumber, MedicalConditions
 * @access Private
 */
router.put('/medical/general-info', [
  authenticateToken,
  resolveProfileId,
  body('Username')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Username must be between 2 and 100 characters'),
  body('DateOfBirth')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('DateOfBirth must be in YYYY-MM-DD format'),
  body('Gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be one of: male, female, other'),
  body('BloodType')
    .optional()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('BloodType must be A+, A-, B+, B-, AB+, AB-, O+, or O-'),
  body('Height')
    .optional()
    .isFloat({ min: 0, max: 999.99 })
    .withMessage('Height must be a positive number up to 999.99'),
  body('Weight')
    .optional()
    .isFloat({ min: 0, max: 999.99 })
    .withMessage('Weight must be a positive number up to 999.99'),
  body('NationalID')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('NationalID must not exceed 20 characters'),
  body('PhoneNumber')
    .optional()
    .trim()
    .matches(/^\+?[0-9]{10,15}$/)
    .withMessage('PhoneNumber must be valid E.164 format'),
  body('MedicalConditions')
    .optional()
    .isArray()
    .withMessage('MedicalConditions must be an array of strings'),
  body('MedicalConditions.*')
    .if(body('MedicalConditions').exists())
    .isString()
    .trim()
    .withMessage('Each condition must be a string')
], updateGeneralInfo);

/**
 * @route PUT /api/app/medical/conditions
 * @description Update Medical Conditions section
 * @fields ChronicDiseases, Notes
 * @access Private
 */
router.put('/medical/conditions', [
  authenticateToken,
  resolveProfileId,
  body('ChronicDiseases')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('ChronicDiseases must not exceed 5000 characters'),
  body('Notes')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Notes must not exceed 5000 characters')
], updateConditions);

/**
 * @route PUT /api/app/medical/allergies
 * @description Update Allergies section
 * @fields HasAllergies (boolean), AllergiesList (array of objects with type, severity)
 * @access Private
 */
router.put('/medical/allergies', [
  authenticateToken,
  resolveProfileId,
  body('HasAllergies')
    .optional()
    .isBoolean()
    .withMessage('HasAllergies must be a boolean'),
  body('AllergiesList')
    .optional()
    .isArray()
    .withMessage('AllergiesList must be an array'),
  body('AllergiesList.*.type')
    .if(body('AllergiesList').exists())
    .trim()
    .notEmpty()
    .withMessage('Allergy type is required'),
  body('AllergiesList.*.severity')
    .if(body('AllergiesList').exists())
    .trim()
    .isIn(['Mild', 'Moderate', 'Severe'])
    .withMessage('Allergy severity must be Mild, Moderate, or Severe')
], updateAllergies);

/**
 * @route PUT /api/app/medical/medications
 * @description Update Current Medications section
 * @fields HasMedications (boolean), MedicationsList (array of objects with name, dosage, schedule)
 * @access Private
 */
router.put('/medical/medications', [
  authenticateToken,
  resolveProfileId,
  body('HasMedications')
    .optional()
    .isBoolean()
    .withMessage('HasMedications must be a boolean'),
  body('MedicationsList')
    .optional()
    .isArray()
    .withMessage('MedicationsList must be an array'),
  body('MedicationsList.*.name')
    .if(body('MedicationsList').exists())
    .trim()
    .notEmpty()
    .withMessage('Medication name is required'),
  body('MedicationsList.*.dosage')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Medication dosage must not exceed 100 characters'),
  body('MedicationsList.*.schedule')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Medication schedule must not exceed 100 characters')
], updateMedications);

/**
 * @route PUT /api/app/medical/surgeries
 * @description Update Surgical History section
 * @fields HasSurgeries (boolean), SurgeriesList (array of objects with type, date, notes)
 * @access Private
 */
router.put('/medical/surgeries', [
  authenticateToken,
  resolveProfileId,
  body('HasSurgeries')
    .optional()
    .isBoolean()
    .withMessage('HasSurgeries must be a boolean'),
  body('SurgeriesList')
    .optional()
    .isArray()
    .withMessage('SurgeriesList must be an array'),
  body('SurgeriesList.*.type')
    .if(body('SurgeriesList').exists())
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Surgery type is required and must not exceed 200 characters'),
  body('SurgeriesList.*.date')
    .if(body('SurgeriesList').exists())
    .trim()
    .notEmpty()
    .withMessage('Surgery date is required'),
  body('SurgeriesList.*.notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters')
], updateSurgeries);

/**
 * @route PUT /api/app/medical/emergency-instructions
 * @description Update Emergency Instructions
 * @fields EmergencyInstructions
 * @access Private
 */
router.put('/medical/emergency-instructions', [
  authenticateToken,
  resolveProfileId,
  body('EmergencyInstructions')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Emergency instructions must not exceed 5000 characters')
], updateEmergencyInstructions);

module.exports = router;
