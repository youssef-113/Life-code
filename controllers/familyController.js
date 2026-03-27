const familyService = require('../services/familyService');
const { validationResult } = require('express-validator');

/**
 * Get all family profiles for the authenticated user
 */
const getFamilyProfiles = async (req, res) => {
  const userID = req.user.uid;

  const result = await familyService.getFamilyProfiles(userID);

  if (result.success) {
    return res.status(200).json(result);
  } else {
    return res.status(result.code || 500).json(result);
  }
};

/**
 * Add a new family member dependent
 */
const addFamilyMember = async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const userID = req.user.uid;
  const data = req.body;

  const result = await familyService.addFamilyMember(userID, data);

  if (result.success) {
    return res.status(201).json(result);
  } else {
    return res.status(result.code || 500).json(result);
  }
};

/**
 * Update an existing family member
 */
const updateFamilyMember = async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const userID = req.user.uid;
  const profileID = req.params.id;
  const data = req.body;

  const result = await familyService.updateFamilyMember(userID, profileID, data);

  if (result.success) {
    return res.status(200).json(result);
  } else {
    return res.status(result.code || 500).json(result);
  }
};

/**
 * Delete a family member and cascade delete their attached profiles
 */
const deleteFamilyMember = async (req, res) => {
  const userID = req.user.uid;
  const profileID = req.params.id;

  const result = await familyService.deleteFamilyMember(userID, profileID);

  if (result.success) {
    return res.status(200).json(result);
  } else {
    return res.status(result.code || 500).json(result);
  }
};

module.exports = {
  getFamilyProfiles,
  addFamilyMember,
  updateFamilyMember,
  deleteFamilyMember
};
