const medicalProfileService = require('../services/medicalProfileService');
const { validationResult } = require('express-validator');

/**
 * Medical Profile Controller - Handles the Medical Profile screen
 * Endpoints for: dashboard GET, section-by-section PUTs
 * 
 * Data Structure:
 * - personalInfo: { name, gender, address }
 * - emergencyContact: { primary: {...}, secondary: [...] }
 * - medicalProfile: { bloodType, medicalConditions }
 * - allergies: [{ allergyType, severity, notes }]
 * - medications: [{ medicationName, dosage, schedule, notes }]
 * - surgeries: [{ surgeryName, surgeryDate, notes }]
 */

/**
 * Get Medical Profile dashboard
 * Returns: user header, profile completion %, quick stats, all sections data
 * @route GET /api/app/medical/profile
 * @access Private
 */
const getMedicalProfile = async (req, res) => {
  try {
    const userID = req.targetUserID || req.user?.userID;
    if (!userID) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
        code: 401
      });
    }

    const result = await medicalProfileService.getMedicalProfile(userID);

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Get medical profile controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

/**
 * Update Personal Information section
 * Fields: name, gender, address
 * @route PUT /api/app/medical/personal-info
 * @access Private
 */
const updatePersonalInfo = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: errors.array()[0].msg,
        code: 400
      });
    }
    const userID = req.targetUserID || req.user?.userID;
    if (!userID) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
        code: 401
      });
    }

    // Ensure at least one field is provided
    const fields = ['name', 'gender', 'address'];
    const hasField = fields.some(f => req.body[f] !== undefined);
    if (!hasField) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'At least one field must be provided to update',
        code: 400
      });
    }

    const result = await medicalProfileService.updatePersonalInfo(userID, req.body);

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Update personal info controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

/**
 * Update Emergency Contact section
 * Fields: primary (object), secondary (array)
 * @route PUT /api/app/medical/emergency-contact
 * @access Private
 */
const updateEmergencyContact = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: errors.array()[0].msg,
        code: 400
      });
    }
    const userID = req.targetUserID || req.user?.userID;
    if (!userID) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
        code: 401
      });
    }

    const result = await medicalProfileService.updateEmergencyContact(userID, req.body);

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Update emergency contact controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

/**
 * Update Medical Profile section
 * Fields: bloodType, medicalConditions
 * @route PUT /api/app/medical/medical-profile
 * @access Private
 */
const updateMedicalProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: errors.array()[0].msg,
        code: 400
      });
    }
    const userID = req.targetUserID || req.user?.userID;
    if (!userID) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
        code: 401
      });
    }

    const result = await medicalProfileService.updateMedicalProfile(userID, req.body);

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Update medical profile controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

/**
 * Update Allergies section
 * Fields: allergies (array of { allergyType, severity, notes })
 * @route PUT /api/app/medical/allergies
 * @access Private
 */
const updateAllergies = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: errors.array()[0].msg,
        code: 400
      });
    }
    const userID = req.targetUserID || req.user?.userID;
    if (!userID) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
        code: 401
      });
    }

    const result = await medicalProfileService.updateAllergies(userID, req.body);

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Update allergies controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

/**
 * Update Current Medications section
 * Fields: medications (array of { medicationName, dosage, schedule, notes })
 * @route PUT /api/app/medical/medications
 * @access Private
 */
const updateMedications = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: errors.array()[0].msg,
        code: 400
      });
    }
    const userID = req.targetUserID || req.user?.userID;
    if (!userID) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
        code: 401
      });
    }

    const result = await medicalProfileService.updateMedications(userID, req.body);

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Update medications controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

/**
 * Update Surgical History section
 * Fields: surgeries (array of { surgeryName, surgeryDate, notes })
 * @route PUT /api/app/medical/surgeries
 * @access Private
 */
const updateSurgeries = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: errors.array()[0].msg,
        code: 400
      });
    }
    const userID = req.targetUserID || req.user?.userID;
    if (!userID) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
        code: 401
      });
    }

    const result = await medicalProfileService.updateSurgeries(userID, req.body);

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Update surgeries controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

module.exports = {
  getMedicalProfile,
  updatePersonalInfo,
  updateEmergencyContact,
  updateMedicalProfile,
  updateAllergies,
  updateMedications,
  updateSurgeries
};
