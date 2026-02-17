/**
 * Medical Information Controller
 * Handles medical info retrieval and updates for authenticated users
 */

import { db, Timestamp } from '../config/firebase.js';
import { ApiError, asyncHandler, sanitizeString } from '../middleware/errorHandler.js';

// Valid blood types
const VALID_BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/**
 * GET /api/medical
 * Get current user's medical information
 * 
 * Headers: Authorization: Bearer <token>
 * Response: { success: true, data: { medicalInfo } }
 */
export const getMedicalInfo = asyncHandler(async (req, res) => {
  const userId = req.user.uid;

  // Query medical info for the user
  const medicalQuery = await db.collection('medicalInfo')
    .where('userId', '==', userId)
    .limit(1)
    .get();

  // If no medical info exists, return null
  if (medicalQuery.empty) {
    return res.status(200).json({
      success: true,
      data: { medicalInfo: null },
      message: 'No medical information found'
    });
  }

  const medicalDoc = medicalQuery.docs[0];
  const medicalData = medicalDoc.data();

  // Format response
  const medicalInfo = {
    id: medicalDoc.id,
    userId: medicalData.userId,
    bloodType: medicalData.bloodType,
    chronicDiseases: medicalData.chronicDiseases,
    allergies: medicalData.allergies,
    medications: medicalData.medications,
    notes: medicalData.notes,
    updatedAt: medicalData.updatedAt?.toDate()?.toISOString()
  };

  res.status(200).json({
    success: true,
    data: { medicalInfo }
  });
});

/**
 * POST /api/medical
 * Create or update user's medical information
 * 
 * Headers: Authorization: Bearer <token>
 * Request body: { bloodType?, chronicDiseases?, allergies?, medications?, notes? }
 * Response: { success: true, data: { medicalInfo } }
 */
export const createOrUpdateMedicalInfo = asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const { bloodType, chronicDiseases, allergies, medications, notes } = req.body;

  // Validate blood type if provided
  if (bloodType !== undefined && bloodType !== null) {
    if (!VALID_BLOOD_TYPES.includes(bloodType)) {
      throw new ApiError(
        400, 
        `Invalid blood type. Must be one of: ${VALID_BLOOD_TYPES.join(', ')}`
      );
    }
  }

  // Build update object
  const updates = {
    updatedAt: Timestamp.now()
  };

  // Add fields if provided (allow null to clear fields)
  if (bloodType !== undefined) updates.bloodType = bloodType;
  if (chronicDiseases !== undefined) {
    updates.chronicDiseases = chronicDiseases !== null 
      ? sanitizeString(chronicDiseases) 
      : null;
  }
  if (allergies !== undefined) {
    updates.allergies = allergies !== null 
      ? sanitizeString(allergies) 
      : null;
  }
  if (medications !== undefined) {
    updates.medications = medications !== null 
      ? sanitizeString(medications) 
      : null;
  }
  if (notes !== undefined) {
    updates.notes = notes !== null 
      ? sanitizeString(notes) 
      : null;
  }

  // Check if medical info already exists
  const medicalQuery = await db.collection('medicalInfo')
    .where('userId', '==', userId)
    .limit(1)
    .get();

  let medicalRef;
  let isNew = false;

  if (medicalQuery.empty) {
    // Create new medical info record
    updates.userId = userId;
    medicalRef = await db.collection('medicalInfo').add(updates);
    isNew = true;
  } else {
    // Update existing record
    medicalRef = medicalQuery.docs[0].ref;
    await medicalRef.update(updates);
  }

  // Get updated data
  const updatedDoc = await medicalRef.get();
  const updatedData = updatedDoc.data();

  const medicalInfo = {
    id: updatedDoc.id,
    userId: updatedData.userId,
    bloodType: updatedData.bloodType,
    chronicDiseases: updatedData.chronicDiseases,
    allergies: updatedData.allergies,
    medications: updatedData.medications,
    notes: updatedData.notes,
    updatedAt: updatedData.updatedAt?.toDate()?.toISOString()
  };

  res.status(isNew ? 201 : 200).json({
    success: true,
    message: isNew 
      ? 'Medical information created successfully' 
      : 'Medical information updated successfully',
    data: { medicalInfo }
  });
});

/**
 * PUT /api/medical
 * Alias for POST /api/medical - update medical information
 */
export const updateMedicalInfo = createOrUpdateMedicalInfo;

/**
 * DELETE /api/medical
 * Delete user's medical information
 * 
 * Headers: Authorization: Bearer <token>
 * Response: { success: true, message: string }
 */
export const deleteMedicalInfo = asyncHandler(async (req, res) => {
  const userId = req.user.uid;

  // Find medical info
  const medicalQuery = await db.collection('medicalInfo')
    .where('userId', '==', userId)
    .limit(1)
    .get();

  if (medicalQuery.empty) {
    return res.status(404).json({
      success: false,
      message: 'Medical information not found'
    });
  }

  // Delete the document
  await medicalQuery.docs[0].ref.delete();

  res.status(200).json({
    success: true,
    message: 'Medical information deleted successfully'
  });
});

/**
 * PATCH /api/medical
 * Partial update of medical information
 * 
 * Headers: Authorization: Bearer <token>
 * Request body: Partial fields to update
 * Response: { success: true, data: { medicalInfo } }
 */
export const patchMedicalInfo = asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const updates = req.body;

  // Validate that at least one field is provided
  if (!updates || Object.keys(updates).length === 0) {
    throw new ApiError(400, 'At least one field must be provided for update');
  }

  // Allowed fields for partial update
  const allowedFields = ['bloodType', 'chronicDiseases', 'allergies', 'medications', 'notes'];
  const updateKeys = Object.keys(updates);
  
  // Check for invalid fields
  const invalidFields = updateKeys.filter(key => !allowedFields.includes(key));
  if (invalidFields.length > 0) {
    throw new ApiError(400, `Invalid fields: ${invalidFields.join(', ')}`);
  }

  // Validate blood type if provided
  if (updates.bloodType !== undefined && updates.bloodType !== null) {
    if (!VALID_BLOOD_TYPES.includes(updates.bloodType)) {
      throw new ApiError(
        400, 
        `Invalid blood type. Must be one of: ${VALID_BLOOD_TYPES.join(', ')}`
      );
    }
  }

  // Build sanitized update object
  const sanitizedUpdates = {
    updatedAt: Timestamp.now()
  };

  if (updates.bloodType !== undefined) {
    sanitizedUpdates.bloodType = updates.bloodType;
  }
  if (updates.chronicDiseases !== undefined) {
    sanitizedUpdates.chronicDiseases = updates.chronicDiseases !== null 
      ? sanitizeString(updates.chronicDiseases) 
      : null;
  }
  if (updates.allergies !== undefined) {
    sanitizedUpdates.allergies = updates.allergies !== null 
      ? sanitizeString(updates.allergies) 
      : null;
  }
  if (updates.medications !== undefined) {
    sanitizedUpdates.medications = updates.medications !== null 
      ? sanitizeString(updates.medications) 
      : null;
  }
  if (updates.notes !== undefined) {
    sanitizedUpdates.notes = updates.notes !== null 
      ? sanitizeString(updates.notes) 
      : null;
  }

  // Find existing medical info
  const medicalQuery = await db.collection('medicalInfo')
    .where('userId', '==', userId)
    .limit(1)
    .get();

  let medicalRef;
  let isNew = false;

  if (medicalQuery.empty) {
    // Create new record with provided fields
    sanitizedUpdates.userId = userId;
    medicalRef = await db.collection('medicalInfo').add(sanitizedUpdates);
    isNew = true;
  } else {
    // Update existing record
    medicalRef = medicalQuery.docs[0].ref;
    await medicalRef.update(sanitizedUpdates);
  }

  // Get updated data
  const updatedDoc = await medicalRef.get();
  const updatedData = updatedDoc.data();

  const medicalInfo = {
    id: updatedDoc.id,
    userId: updatedData.userId,
    bloodType: updatedData.bloodType,
    chronicDiseases: updatedData.chronicDiseases,
    allergies: updatedData.allergies,
    medications: updatedData.medications,
    notes: updatedData.notes,
    updatedAt: updatedData.updatedAt?.toDate()?.toISOString()
  };

  res.status(isNew ? 201 : 200).json({
    success: true,
    message: isNew 
      ? 'Medical information created successfully' 
      : 'Medical information updated successfully',
    data: { medicalInfo }
  });
});
