const emergencyContactService = require('../services/emergencyContactService');
const { validationResult } = require('express-validator');

/**
 * Emergency Contact Controller - Handles emergency contact operations
 */

/**
 * Add a new emergency contact
 * @route POST /api/app/emergency/contact
 * @access Private
 */
const addContact = async (req, res) => {
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
      ContactName,
      phoneNumbers,
      relationship,
      isPrimary,
      notes
    } = req.body;

    if (!ContactName || !phoneNumbers || !Array.isArray(phoneNumbers)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'fullName and phoneNumbers array are required',
        code: 400
      });
    }

    const result = await emergencyContactService.addContact(userID, {
      ContactName,
      phoneNumbers,
      relationship,
      isPrimary,
      notes
    });

    const statusCode = result.success ? 201 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Add contact controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

/**
 * Update an existing emergency contact
 * @route PUT /api/app/emergency/contact/:id
 * @access Private
 */
const updateContact = async (req, res) => {
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

    const userID = req.user?.userID;
    if (!userID) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
        code: 401
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Contact ID is required',
        code: 400
      });
    }

    const result = await emergencyContactService.updateContact(userID, id, req.body);

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Update contact controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

/**
 * Delete an emergency contact
 * @route DELETE /api/app/emergency/contact/:id
 * @access Private
 */
const deleteContact = async (req, res) => {
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

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Contact ID is required',
        code: 400
      });
    }

    const result = await emergencyContactService.deleteContact(userID, id);

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Delete contact controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

/**
 * Get all emergency contacts
 * @route GET /api/app/emergency/contacts
 * @access Private
 */
const getContacts = async (req, res) => {
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

    const result = await emergencyContactService.getContacts(userID);

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Get contacts controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

/**
 * Get a single emergency contact
 * @route GET /api/app/emergency/contact/:id
 * @access Private
 */
const getContact = async (req, res) => {
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

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Contact ID is required',
        code: 400
      });
    }

    const result = await emergencyContactService.getContact(userID, id);

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Get contact controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

/**
 * Set a contact as primary
 * @route PUT /api/app/emergency/contact/:id/primary
 * @access Private
 */
const setPrimary = async (req, res) => {
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

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Contact ID is required',
        code: 400
      });
    }

    const result = await emergencyContactService.setPrimary(userID, id);

    const statusCode = result.success ? 200 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Set primary contact controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

/**
 * Add multiple emergency contacts at once
 * @route POST /api/app/emergency/contacts/bulk
 * @access Private
 */
const addMultipleContacts = async (req, res) => {
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

    const userID = req.user?.userID;
    if (!userID) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated',
        code: 401
      });
    }

    const { contacts } = req.body;

    if (!contacts || !Array.isArray(contacts)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'contacts must be an array of contact objects',
        code: 400
      });
    }

    const result = await emergencyContactService.addMultipleContacts(userID, contacts);

    const statusCode = result.success ? 201 : result.code || 500;
    return res.status(statusCode).json(result);

  } catch (error) {
    console.error('Add multiple contacts controller error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'An unexpected error occurred',
      code: 500
    });
  }
};

module.exports = {
  addContact,
  updateContact,
  deleteContact,
  getContacts,
  getContact,
  setPrimary,
  addMultipleContacts
};
