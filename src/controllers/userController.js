/**
 * User Controller
 * Handles user profile retrieval and updates
 */

import { db, Timestamp } from '../config/firebase.js';
import { ApiError, asyncHandler, sanitizeString } from '../middleware/errorHandler.js';

/**
 * GET /api/users/me
 * Get current user's profile
 * 
 * Headers: Authorization: Bearer <token>
 * Response: { success: true, data: { user } }
 */
export const getMyProfile = asyncHandler(async (req, res) => {
  const userId = req.user.uid;

  // Get user document
  const userDoc = await db.collection('users').doc(userId).get();

  if (!userDoc.exists) {
    throw new ApiError(404, 'User profile not found');
  }

  const userData = userDoc.data();

  // Format timestamps for JSON response
  const formattedUser = {
    uid: userId,
    username: userData.username,
    email: userData.email,
    gender: userData.gender,
    nationalId: userData.nationalId,
    photoUrl: userData.photoUrl,
    isActive: userData.isActive,
    createdAt: userData.createdAt?.toDate()?.toISOString(),
    updatedAt: userData.updatedAt?.toDate()?.toISOString()
  };

  res.status(200).json({
    success: true,
    data: { user: formattedUser }
  });
});

/**
 * PUT /api/users/me
 * Update current user's profile
 * 
 * Headers: Authorization: Bearer <token>
 * Request body: { username?, gender?, nationalId?, photoUrl? }
 * Response: { success: true, data: { user } }
 */
export const updateMyProfile = asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const { username, gender, nationalId, photoUrl } = req.body;

  // Get current user data
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new ApiError(404, 'User profile not found');
  }

  const currentData = userDoc.data();

  // Build update object with only provided fields
  const updates = {
    updatedAt: Timestamp.now()
  };

  // Validate and update username
  if (username !== undefined) {
    const sanitizedUsername = sanitizeString(username);
    if (sanitizedUsername.length < 2 || sanitizedUsername.length > 50) {
      throw new ApiError(400, 'Username must be between 2 and 50 characters');
    }
    updates.username = sanitizedUsername;
  }

  // Validate and update gender
  if (gender !== undefined) {
    const validGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
    if (gender !== null && !validGenders.includes(gender)) {
      throw new ApiError(400, `Gender must be one of: ${validGenders.join(', ')}`);
    }
    updates.gender = gender;
  }

  // Validate and update national ID
  if (nationalId !== undefined) {
    if (nationalId !== null) {
      const sanitizedNationalId = sanitizeString(nationalId);
      // Basic validation - adjust based on your country's ID format
      if (sanitizedNationalId.length < 5 || sanitizedNationalId.length > 20) {
        throw new ApiError(400, 'National ID must be between 5 and 20 characters');
      }
      updates.nationalId = sanitizedNationalId;
    } else {
      updates.nationalId = null;
    }
  }

  // Validate and update photo URL
  if (photoUrl !== undefined) {
    if (photoUrl !== null) {
      try {
        new URL(photoUrl); // Validate URL format
        updates.photoUrl = photoUrl;
      } catch {
        throw new ApiError(400, 'Invalid photo URL format');
      }
    } else {
      updates.photoUrl = null;
    }
  }

  // Only update if there are changes
  if (Object.keys(updates).length === 1 && updates.updatedAt) {
    return res.status(200).json({
      success: true,
      message: 'No changes to update',
      data: { 
        user: {
          uid: userId,
          ...currentData,
          createdAt: currentData.createdAt?.toDate()?.toISOString(),
          updatedAt: currentData.updatedAt?.toDate()?.toISOString()
        }
      }
    });
  }

  // Apply updates
  await userRef.update(updates);

  // Get updated user data
  const updatedDoc = await userRef.get();
  const updatedData = updatedDoc.data();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        uid: userId,
        username: updatedData.username,
        email: updatedData.email,
        gender: updatedData.gender,
        nationalId: updatedData.nationalId,
        photoUrl: updatedData.photoUrl,
        isActive: updatedData.isActive,
        createdAt: updatedData.createdAt?.toDate()?.toISOString(),
        updatedAt: updatedData.updatedAt?.toDate()?.toISOString()
      }
    }
  });
});

/**
 * DELETE /api/users/me
 * Deactivate current user's account (soft delete)
 * 
 * Headers: Authorization: Bearer <token>
 * Response: { success: true, message: string }
 */
export const deactivateAccount = asyncHandler(async (req, res) => {
  const userId = req.user.uid;

  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new ApiError(404, 'User not found');
  }

  // Soft delete - mark as inactive
  await userRef.update({
    isActive: false,
    updatedAt: Timestamp.now()
  });

  // Deactivate all sessions
  const sessionsQuery = await db.collection('userSessions')
    .where('userId', '==', userId)
    .where('isActive', '==', true)
    .get();

  const batch = db.batch();
  sessionsQuery.docs.forEach(doc => {
    batch.update(doc.ref, { isActive: false });
  });
  await batch.commit();

  res.status(200).json({
    success: true,
    message: 'Account deactivated successfully'
  });
});

/**
 * GET /api/users/me/complete
 * Get complete user profile including medical info and emergency contacts
 * 
 * Headers: Authorization: Bearer <token>
 * Response: { success: true, data: { user, medicalInfo, emergencyContacts } }
 */
export const getCompleteProfile = asyncHandler(async (req, res) => {
  const userId = req.user.uid;

  // Get user data
  const userDoc = await db.collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    throw new ApiError(404, 'User profile not found');
  }

  const userData = userDoc.data();

  // Get medical info
  const medicalQuery = await db.collection('medicalInfo')
    .where('userId', '==', userId)
    .limit(1)
    .get();

  let medicalInfo = null;
  if (!medicalQuery.empty) {
    const medicalData = medicalQuery.docs[0].data();
    medicalInfo = {
      id: medicalQuery.docs[0].id,
      bloodType: medicalData.bloodType,
      chronicDiseases: medicalData.chronicDiseases,
      allergies: medicalData.allergies,
      medications: medicalData.medications,
      notes: medicalData.notes,
      updatedAt: medicalData.updatedAt?.toDate()?.toISOString()
    };
  }

  // Get emergency contacts
  const contactsQuery = await db.collection('emergencyContacts')
    .where('userId', '==', userId)
    .orderBy('isPrimary', 'desc')
    .orderBy('createdAt', 'desc')
    .get();

  const emergencyContacts = contactsQuery.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      contactName: data.contactName,
      relation: data.relation,
      phoneNumber: data.phoneNumber,
      secondaryPhone: data.secondaryPhone,
      isPrimary: data.isPrimary,
      createdAt: data.createdAt?.toDate()?.toISOString()
    };
  });

  res.status(200).json({
    success: true,
    data: {
      user: {
        uid: userId,
        username: userData.username,
        email: userData.email,
        gender: userData.gender,
        nationalId: userData.nationalId,
        photoUrl: userData.photoUrl,
        isActive: userData.isActive,
        createdAt: userData.createdAt?.toDate()?.toISOString(),
        updatedAt: userData.updatedAt?.toDate()?.toISOString()
      },
      medicalInfo,
      emergencyContacts
    }
  });
});
