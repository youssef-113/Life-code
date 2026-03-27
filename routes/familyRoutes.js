const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const {
  getFamilyProfiles,
  addFamilyMember,
  updateFamilyMember,
  deleteFamilyMember
} = require('../controllers/familyController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @route GET /api/app/family
 * @description Get all family profiles (including self)
 * @access Private
 */
router.get('/family', authenticateToken, getFamilyProfiles);

/**
 * @route POST /api/app/family
 * @description Add a new family member dependent
 * @access Private
 */
router.post('/family', [
  authenticateToken,
  body('Name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('Relation')
    .trim()
    .notEmpty()
    .withMessage('Relation is required')
    .isIn(['Spouse', 'Son', 'Daughter', 'Parent', 'Sibling', 'Other'])
    .withMessage('Relation must be a valid type'),
  body('DateOfBirth')
    .optional({ checkFalsy: true })
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date of birth must be YYYY-MM-DD'),
  body('IsChild')
    .optional()
    .isBoolean()
    .withMessage('IsChild must be a boolean')
], addFamilyMember);

/**
 * @route PUT /api/app/family/:id
 * @description Update an existing family member dependent
 * @access Private
 */
router.put('/family/:id', [
  authenticateToken,
  param('id')
    .notEmpty()
    .withMessage('Family Member ID is required'),
  body('Name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('Relation')
    .optional()
    .trim()
    .isIn(['Spouse', 'Son', 'Daughter', 'Parent', 'Sibling', 'Other'])
    .withMessage('Relation must be a valid type'),
  body('DateOfBirth')
    .optional({ checkFalsy: true })
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date of birth must be YYYY-MM-DD'),
  body('IsChild')
    .optional()
    .isBoolean()
    .withMessage('IsChild must be a boolean'),
  body('LostChildMode')
    .optional()
    .isBoolean()
    .withMessage('LostChildMode must be a boolean')
], updateFamilyMember);

/**
 * @route DELETE /api/app/family/:id
 * @description Delete a family member and cascade delete their attached profile info
 * @access Private
 */
router.delete('/family/:id', authenticateToken, deleteFamilyMember);

module.exports = router;
