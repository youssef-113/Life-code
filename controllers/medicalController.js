const medicalService = require('../services/medicalService');
const { validationResult } = require('express-validator');

/**
 * Medical Controller - Handles medical information operations
 */

/**
 * Create medical information
 * @route POST /api/app/medical
 * @access Private
 */
const createMedicalInfo = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: errors.array()[0].msg,
        code: 400
      });
    }

    const userID = req.user?.userID;
    if (!userID) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
        code: 401
      });
    }

    const { 
      personalInfo, 
      emergencyContact, 
      medicalProfile, 
      allergies, 
      medications, 
      surgeries 
    } = req.body;

    // Validate required fields
    if (!personalInfo || !personalInfo.name) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Personal info with name is required',
        code: 400
      });
    }

    // Create medical info
    const result = await medicalService.createMedicalInfo(userID, {
      personalInfo,
      emergencyContact,
      medicalProfile,
      allergies,
      medications,
      surgeries
    });

    const statusCode = result.success ? 201 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Create medical info controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

/**
 * Update medical information
 * @route PUT /api/app/medical
 * @access Private
 */
const updateMedicalInfo = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: errors.array()[0].msg,
        code: 400
      });
    }

    const userID = req.user?.userID;
    if (!userID) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
        code: 401
      });
    }

    const { 
      personalInfo, 
      emergencyContact, 
      medicalProfile, 
      allergies, 
      medications, 
      surgeries 
    } = req.body;

    // Check if at least one field is provided
    if (!personalInfo && !emergencyContact && !medicalProfile && 
        allergies === undefined && medications === undefined && surgeries === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'At least one field must be provided for update',
        code: 400
      });
    }

    // Update medical info
    const result = await medicalService.updateMedicalInfo(userID, {
      personalInfo,
      emergencyContact,
      medicalProfile,
      allergies,
      medications,
      surgeries
    });

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Update medical info controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

/**
 * Get medical information
 * @route GET /api/app/medical
 * @access Private
 */
const getMedicalInfo = async (req, res) => {
  try {
    const userID = req.user?.userID;
    if (!userID) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
        code: 401
      });
    }

    const result = await medicalService.getMedicalInfo(userID);

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Get medical info controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

module.exports = {
  createMedicalInfo,
  updateMedicalInfo,
  getMedicalInfo
};
