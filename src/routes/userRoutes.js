/**
 * User Routes
 * Defines routes for user profile management
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getMyProfile,
  updateMyProfile,
  deactivateAccount,
  getCompleteProfile
} from '../controllers/userController.js';

const router = Router();

/**
 * @route   GET /api/users/me
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/me', authenticate, getMyProfile);

/**
 * @route   GET /api/users/me/complete
 * @desc    Get complete profile including medical info and emergency contacts
 * @access  Private
 */
router.get('/me/complete', authenticate, getCompleteProfile);

/**
 * @route   PUT /api/users/me
 * @desc    Update current user's profile
 * @access  Private
 * @body    { username?, gender?, nationalId?, photoUrl? }
 */
router.put('/me', authenticate, updateMyProfile);

/**
 * @route   PATCH /api/users/me
 * @desc    Partial update of current user's profile (alias for PUT)
 * @access  Private
 */
router.patch('/me', authenticate, updateMyProfile);

/**
 * @route   DELETE /api/users/me
 * @desc    Deactivate current user's account (soft delete)
 * @access  Private
 */
router.delete('/me', authenticate, deactivateAccount);

export default router;
