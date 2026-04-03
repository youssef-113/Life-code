const userProfileService = require('../services/userProfileService');
const { validationResult } = require('express-validator');

/**
 * User Profile Controller - Handles personal info and emergency contacts
 */

/**
 * Update user personal information
 * @route PUT /api/app/profile/personal-info
 * @access Private
 */
const updatePersonalInfo = async (req, res) => {
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

    const { fullName, gender, address } = req.body;

    // Validate required fields
    if (!fullName) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Full name is required',
        code: 400
      });
    }

    // Update personal info
    const result = await userProfileService.updatePersonalInfo(userID, {
      fullName,
      gender,
      address
    });

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
 * Get user personal information
 * @route GET /api/app/profile/personal-info
 * @access Private
 */
const getPersonalInfo = async (req, res) => {
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

    const result = await userProfileService.getPersonalInfo(userID);

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Get personal info controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

/**
 * Update user emergency contacts
 * @route PUT /api/app/profile/emergency-contacts
 * @access Private
 */
const updateEmergencyContacts = async (req, res) => {
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

    // Support both old format (primaryContact, secondaryContact) and new format (contacts array)
    const { primaryContact, secondaryContact, contacts } = req.body;

    // Validate that we have at least one contact
    if (!contacts && !primaryContact) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'At least one emergency contact is required',
        code: 400
      });
    }

    // If contacts array is provided, use it (new format)
    // Otherwise, convert primary/secondary to array (backward compatibility)
    let contactsArray = contacts;
    if (!contactsArray && (primaryContact || secondaryContact)) {
      contactsArray = [];
      if (primaryContact) {
        contactsArray.push({ ...primaryContact, isPrimary: true });
      }
      if (secondaryContact) {
        contactsArray.push({ ...secondaryContact, isPrimary: false });
      }
    }

    // Validate contacts array
    if (!Array.isArray(contactsArray) || contactsArray.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Contacts must be a non-empty array',
        code: 400
      });
    }

    // Validate each contact has required fields
    for (const contact of contactsArray) {
      if (!contact.fullName || !contact.phoneNumber || !contact.relationship) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Each contact must have fullName, phoneNumber, and relationship',
          code: 400
        });
      }
    }

    // Update emergency contacts
    const result = await userProfileService.updateEmergencyContacts(userID, {
      contacts: contactsArray
    });

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Update emergency contacts controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

/**
 * Get user emergency contacts
 * @route GET /api/app/profile/emergency-contacts
 * @access Private
 */
const getEmergencyContacts = async (req, res) => {
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

    const result = await userProfileService.getEmergencyContacts(userID);

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Get emergency contacts controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

module.exports = {
  updatePersonalInfo,
  getPersonalInfo,
  updateEmergencyContacts,
  getEmergencyContacts
};
