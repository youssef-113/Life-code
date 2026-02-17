/**
 * Emergency Contacts Controller
 * Handles emergency contacts CRUD operations for authenticated users
 */

import { db, Timestamp } from '../config/firebase.js';
import { ApiError, asyncHandler, validateRequiredFields, sanitizeString } from '../middleware/errorHandler.js';

/**
 * GET /api/emergency
 * Get all emergency contacts for the current user
 * 
 * Headers: Authorization: Bearer <token>
 * Response: { success: true, data: { contacts } }
 */
export const getEmergencyContacts = asyncHandler(async (req, res) => {
  const userId = req.user.uid;

  // Query emergency contacts for the user
  const contactsQuery = await db.collection('emergencyContacts')
    .where('userId', '==', userId)
    .orderBy('isPrimary', 'desc') // Primary contacts first
    .orderBy('createdAt', 'desc') // Then by creation date
    .get();

  // Format contacts
  const contacts = contactsQuery.docs.map(doc => {
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
      contacts,
      count: contacts.length,
      primaryContact: contacts.find(c => c.isPrimary) || null
    }
  });
});

/**
 * GET /api/emergency/:contactId
 * Get a specific emergency contact
 * 
 * Headers: Authorization: Bearer <token>
 * Response: { success: true, data: { contact } }
 */
export const getEmergencyContactById = asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const { contactId } = req.params;

  if (!contactId) {
    throw new ApiError(400, 'Contact ID is required');
  }

  const contactDoc = await db.collection('emergencyContacts').doc(contactId).get();

  if (!contactDoc.exists) {
    throw new ApiError(404, 'Emergency contact not found');
  }

  const contactData = contactDoc.data();

  // Verify ownership
  if (contactData.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to access this contact');
  }

  const contact = {
    id: contactDoc.id,
    contactName: contactData.contactName,
    relation: contactData.relation,
    phoneNumber: contactData.phoneNumber,
    secondaryPhone: contactData.secondaryPhone,
    isPrimary: contactData.isPrimary,
    createdAt: contactData.createdAt?.toDate()?.toISOString()
  };

  res.status(200).json({
    success: true,
    data: { contact }
  });
});

/**
 * POST /api/emergency
 * Create a new emergency contact
 * 
 * Headers: Authorization: Bearer <token>
 * Request body: { contactName, relation, phoneNumber, secondaryPhone?, isPrimary? }
 * Response: { success: true, data: { contact } }
 */
export const createEmergencyContact = asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const { contactName, relation, phoneNumber, secondaryPhone, isPrimary = false } = req.body;

  // Validate required fields
  validateRequiredFields(req.body, ['contactName', 'phoneNumber']);

  // Validate contact name
  const sanitizedName = sanitizeString(contactName);
  if (sanitizedName.length < 2 || sanitizedName.length > 100) {
    throw new ApiError(400, 'Contact name must be between 2 and 100 characters');
  }

  // Validate phone number (basic validation - adjust based on your requirements)
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  if (!phoneRegex.test(phoneNumber)) {
    throw new ApiError(400, 'Invalid phone number format');
  }

  // Validate secondary phone if provided
  if (secondaryPhone && !phoneRegex.test(secondaryPhone)) {
    throw new ApiError(400, 'Invalid secondary phone number format');
  }

  // If setting as primary, unset any existing primary contact
  if (isPrimary === true) {
    const existingPrimary = await db.collection('emergencyContacts')
      .where('userId', '==', userId)
      .where('isPrimary', '==', true)
      .get();

    const batch = db.batch();
    existingPrimary.docs.forEach(doc => {
      batch.update(doc.ref, { isPrimary: false });
    });
    await batch.commit();
  }

  // Create contact data
  const contactData = {
    userId: userId,
    contactName: sanitizedName,
    relation: relation ? sanitizeString(relation) : null,
    phoneNumber: phoneNumber,
    secondaryPhone: secondaryPhone || null,
    isPrimary: isPrimary === true,
    createdAt: Timestamp.now()
  };

  const contactRef = await db.collection('emergencyContacts').add(contactData);

  const contact = {
    id: contactRef.id,
    ...contactData,
    createdAt: contactData.createdAt.toDate().toISOString()
  };

  res.status(201).json({
    success: true,
    message: 'Emergency contact created successfully',
    data: { contact }
  });
});

/**
 * PUT /api/emergency/:contactId
 * Update an existing emergency contact
 * 
 * Headers: Authorization: Bearer <token>
 * Request body: { contactName?, relation?, phoneNumber?, secondaryPhone?, isPrimary? }
 * Response: { success: true, data: { contact } }
 */
export const updateEmergencyContact = asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const { contactId } = req.params;
  const { contactName, relation, phoneNumber, secondaryPhone, isPrimary } = req.body;

  if (!contactId) {
    throw new ApiError(400, 'Contact ID is required');
  }

  // Get existing contact
  const contactRef = db.collection('emergencyContacts').doc(contactId);
  const contactDoc = await contactRef.get();

  if (!contactDoc.exists) {
    throw new ApiError(404, 'Emergency contact not found');
  }

  const existingData = contactDoc.data();

  // Verify ownership
  if (existingData.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to update this contact');
  }

  // Build updates object
  const updates = {};

  // Validate and update contact name
  if (contactName !== undefined) {
    const sanitizedName = sanitizeString(contactName);
    if (sanitizedName.length < 2 || sanitizedName.length > 100) {
      throw new ApiError(400, 'Contact name must be between 2 and 100 characters');
    }
    updates.contactName = sanitizedName;
  }

  // Update relation
  if (relation !== undefined) {
    updates.relation = relation !== null ? sanitizeString(relation) : null;
  }

  // Validate and update phone number
  if (phoneNumber !== undefined) {
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    if (!phoneRegex.test(phoneNumber)) {
      throw new ApiError(400, 'Invalid phone number format');
    }
    updates.phoneNumber = phoneNumber;
  }

  // Validate and update secondary phone
  if (secondaryPhone !== undefined) {
    if (secondaryPhone !== null) {
      const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
      if (!phoneRegex.test(secondaryPhone)) {
        throw new ApiError(400, 'Invalid secondary phone number format');
      }
    }
    updates.secondaryPhone = secondaryPhone;
  }

  // Handle primary contact change
  if (isPrimary !== undefined && isPrimary === true && !existingData.isPrimary) {
    // Unset existing primary
    const existingPrimary = await db.collection('emergencyContacts')
      .where('userId', '==', userId)
      .where('isPrimary', '==', true)
      .get();

    const batch = db.batch();
    existingPrimary.docs.forEach(doc => {
      batch.update(doc.ref, { isPrimary: false });
    });
    await batch.commit();

    updates.isPrimary = true;
  } else if (isPrimary !== undefined) {
    updates.isPrimary = isPrimary === true;
  }

  // Check if there are any updates
  if (Object.keys(updates).length === 0) {
    return res.status(200).json({
      success: true,
      message: 'No changes to update',
      data: {
        contact: {
          id: contactDoc.id,
          contactName: existingData.contactName,
          relation: existingData.relation,
          phoneNumber: existingData.phoneNumber,
          secondaryPhone: existingData.secondaryPhone,
          isPrimary: existingData.isPrimary,
          createdAt: existingData.createdAt?.toDate()?.toISOString()
        }
      }
    });
  }

  // Apply updates
  await contactRef.update(updates);

  // Get updated data
  const updatedDoc = await contactRef.get();
  const updatedData = updatedDoc.data();

  const contact = {
    id: updatedDoc.id,
    contactName: updatedData.contactName,
    relation: updatedData.relation,
    phoneNumber: updatedData.phoneNumber,
    secondaryPhone: updatedData.secondaryPhone,
    isPrimary: updatedData.isPrimary,
    createdAt: updatedData.createdAt?.toDate()?.toISOString()
  };

  res.status(200).json({
    success: true,
    message: 'Emergency contact updated successfully',
    data: { contact }
  });
});

/**
 * DELETE /api/emergency/:contactId
 * Delete an emergency contact
 * 
 * Headers: Authorization: Bearer <token>
 * Response: { success: true, message: string }
 */
export const deleteEmergencyContact = asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const { contactId } = req.params;

  if (!contactId) {
    throw new ApiError(400, 'Contact ID is required');
  }

  const contactRef = db.collection('emergencyContacts').doc(contactId);
  const contactDoc = await contactRef.get();

  if (!contactDoc.exists) {
    throw new ApiError(404, 'Emergency contact not found');
  }

  const contactData = contactDoc.data();

  // Verify ownership
  if (contactData.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to delete this contact');
  }

  await contactRef.delete();

  res.status(200).json({
    success: true,
    message: 'Emergency contact deleted successfully'
  });
});

/**
 * PUT /api/emergency/:contactId/primary
 * Set a contact as the primary emergency contact
 * 
 * Headers: Authorization: Bearer <token>
 * Response: { success: true, data: { contact } }
 */
export const setPrimaryContact = asyncHandler(async (req, res) => {
  const userId = req.user.uid;
  const { contactId } = req.params;

  if (!contactId) {
    throw new ApiError(400, 'Contact ID is required');
  }

  const contactRef = db.collection('emergencyContacts').doc(contactId);
  const contactDoc = await contactRef.get();

  if (!contactDoc.exists) {
    throw new ApiError(404, 'Emergency contact not found');
  }

  const contactData = contactDoc.data();

  // Verify ownership
  if (contactData.userId !== userId) {
    throw new ApiError(403, 'You do not have permission to modify this contact');
  }

  // Already primary
  if (contactData.isPrimary) {
    return res.status(200).json({
      success: true,
      message: 'Contact is already set as primary',
      data: {
        contact: {
          id: contactDoc.id,
          contactName: contactData.contactName,
          relation: contactData.relation,
          phoneNumber: contactData.phoneNumber,
          secondaryPhone: contactData.secondaryPhone,
          isPrimary: true,
          createdAt: contactData.createdAt?.toDate()?.toISOString()
        }
      }
    });
  }

  // Unset existing primary contacts
  const existingPrimary = await db.collection('emergencyContacts')
    .where('userId', '==', userId)
    .where('isPrimary', '==', true)
    .get();

  const batch = db.batch();
  existingPrimary.docs.forEach(doc => {
    batch.update(doc.ref, { isPrimary: false });
  });
  await batch.commit();

  // Set new primary
  await contactRef.update({ isPrimary: true });

  res.status(200).json({
    success: true,
    message: 'Primary contact updated successfully',
    data: {
      contact: {
        id: contactDoc.id,
        contactName: contactData.contactName,
        relation: contactData.relation,
        phoneNumber: contactData.phoneNumber,
        secondaryPhone: contactData.secondaryPhone,
        isPrimary: true,
        createdAt: contactData.createdAt?.toDate()?.toISOString()
      }
    }
  });
});
