const medicalProfileService = require('../services/medicalProfileService');
const { validationResult } = require('express-validator');

/**
 * Medical Profile Controller - Handles the Medical Profile screen
 * Endpoints for: dashboard GET, section-by-section PUTs
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
 * Update General Information section
 * Fields: Username, DateOfBirth, Gender, BloodType, Height, Weight, NationalID, PhoneNumber
 * @route PUT /api/app/medical/general-info
 * @access Private
 */
const updateGeneralInfo = async (req, res) => {
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
    const fields = ['Username', 'DateOfBirth', 'Gender', 'BloodType', 'Height', 'Weight', 'NationalID', 'PhoneNumber', 'MedicalConditions'];
    const hasField = fields.some(f => req.body[f] !== undefined);
    if (!hasField) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'At least one field must be provided to update',
        code: 400
      });
    }

    const result = await medicalProfileService.updateGeneralInfo(userID, req.body);

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Update general info controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

/**
 * Update Medical Conditions section
 * Fields: ChronicDiseases, Notes
 * @route PUT /api/app/medical/conditions
 * @access Private
 */
const updateConditions = async (req, res) => {
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

    const result = await medicalProfileService.updateConditions(userID, req.body);

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Update conditions controller error:', error);
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
 * Fields: Allergies
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
 * Fields: Medications
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
 * Fields: Surgeries
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

/**
 * Update Emergency Instructions
 * Fields: EmergencyInstructions
 * @route PUT /api/app/medical/emergency-instructions
 * @access Private
 */
const updateEmergencyInstructions = async (req, res) => {
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

    const result = await medicalProfileService.updateEmergencyInstructions(userID, req.body);

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Update emergency instructions controller error:', error);
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
  updateGeneralInfo,
  updateConditions,
  updateAllergies,
  updateMedications,
  updateSurgeries,
  updateEmergencyInstructions
};
