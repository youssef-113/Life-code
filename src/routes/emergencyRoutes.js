/**
 * Emergency Contacts Routes
 * Defines routes for emergency contacts management
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getEmergencyContacts,
  getEmergencyContactById,
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  setPrimaryContact
} from '../controllers/emergencyController.js';

const router = Router();

/**
 * @route   GET /api/emergency
 * @desc    Get all emergency contacts for current user
 * @access  Private
 */
router.get('/', authenticate, getEmergencyContacts);

/**
 * @route   POST /api/emergency
 * @desc    Create a new emergency contact
 * @access  Private
 * @body    { contactName, relation?, phoneNumber, secondaryPhone?, isPrimary? }
 */
router.post('/', authenticate, createEmergencyContact);

/**
 * @route   GET /api/emergency/:contactId
 * @desc    Get a specific emergency contact
 * @access  Private
 */
router.get('/:contactId', authenticate, getEmergencyContactById);

/**
 * @route   PUT /api/emergency/:contactId
 * @desc    Update an emergency contact
 * @access  Private
 * @body    { contactName?, relation?, phoneNumber?, secondaryPhone?, isPrimary? }
 */
router.put('/:contactId', authenticate, updateEmergencyContact);

/**
 * @route   PATCH /api/emergency/:contactId
 * @desc    Partial update of emergency contact (alias for PUT)
 * @access  Private
 */
router.patch('/:contactId', authenticate, updateEmergencyContact);

/**
 * @route   DELETE /api/emergency/:contactId
 * @desc    Delete an emergency contact
 * @access  Private
 */
router.delete('/:contactId', authenticate, deleteEmergencyContact);

/**
 * @route   PUT /api/emergency/:contactId/primary
 * @desc    Set a contact as the primary emergency contact
 * @access  Private
 */
router.put('/:contactId/primary', authenticate, setPrimaryContact);

export default router;
