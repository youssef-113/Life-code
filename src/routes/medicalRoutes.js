/**
 * Medical Information Routes
 * Defines routes for medical info management
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getMedicalInfo,
  createOrUpdateMedicalInfo,
  updateMedicalInfo,
  patchMedicalInfo,
  deleteMedicalInfo
} from '../controllers/medicalController.js';

const router = Router();

/**
 * @route   GET /api/medical
 * @desc    Get current user's medical information
 * @access  Private
 */
router.get('/', authenticate, getMedicalInfo);

/**
 * @route   POST /api/medical
 * @desc    Create or update medical information
 * @access  Private
 * @body    { bloodType?, chronicDiseases?, allergies?, medications?, notes? }
 */
router.post('/', authenticate, createOrUpdateMedicalInfo);

/**
 * @route   PUT /api/medical
 * @desc    Update medical information
 * @access  Private
 * @body    { bloodType?, chronicDiseases?, allergies?, medications?, notes? }
 */
router.put('/', authenticate, updateMedicalInfo);

/**
 * @route   PATCH /api/medical
 * @desc    Partial update of medical information
 * @access  Private
 * @body    { bloodType?, chronicDiseases?, allergies?, medications?, notes? }
 */
router.patch('/', authenticate, patchMedicalInfo);

/**
 * @route   DELETE /api/medical
 * @desc    Delete medical information
 * @access  Private
 */
router.delete('/', authenticate, deleteMedicalInfo);

export default router;
