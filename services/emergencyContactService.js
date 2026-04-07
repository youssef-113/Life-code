const { getFirestore } = require('../config/firebase');
const authService = require('./authService');
const profileCompletionService = require('./profileCompletionService');

/**
 * Emergency Contact Service - Handles emergency contacts database operations
 * Firestore Collection: EmergencyContacts
 */
class EmergencyContactService {

  /**
   * Add a new emergency contact
   * @param {string} userID - User ID
   * @param {Object} contactData - Contact information
   * @returns {Object} - Created contact data
   */
  async addContact(userID, contactData) {
    const db = getFirestore();

    try {
      // Verify user exists
      const userResult = await authService.getUserById(userID);
      if (!userResult.exists) {
        return {
          success: false,
          error: 'Not Found',
          message: 'User not found',
          code: 404
        };
      }

      const {
        ContactName,
        phoneNumbers,
        relationship,
        Relation,
        isPrimary,
        IsPrimary,
        notes,
        Notes
      } = contactData;

      // Handle both lowercase and PascalCase field names
      const finalRelationship = relationship || Relation || 'Other';
      const finalIsPrimary = isPrimary !== undefined ? isPrimary : (IsPrimary !== undefined ? IsPrimary : false);
      const finalNotes = notes || Notes || '';

      // Validate required fields
      if (!ContactName || !phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
        return {
          success: false,
          error: 'Validation Error',
          message: 'fullName and phoneNumbers array are required',
          code: 400
        };
      }

      // If this contact is set as primary, unset all other primary contacts
      if (finalIsPrimary === true) {
        const existingPrimary = await db.collection('EmergencyContacts')
          .where('UserID', '==', userID)
          .where('IsPrimary', '==', true)
          .get();

        const batch = db.batch();
        existingPrimary.docs.forEach(doc => {
          batch.update(doc.ref, { IsPrimary: false, UpdatedAt: new Date() });
        });
        if (!existingPrimary.empty) {
          await batch.commit();
        }
      }

      // Determine priority if not provided
      const existingContacts = await db.collection('EmergencyContacts')
        .where('UserID', '==', userID)
        .get();
      const contactPriority = existingContacts.size + 1;

      // Create contact document with standardized format
      const contactDoc = {
        UserID: userID,
        ContactName: ContactName,
        PhoneNumbers: phoneNumbers,
        Relationship: finalRelationship,
        IsPrimary: finalIsPrimary,
        Priority: contactPriority,
        Notes: finalNotes,
        CreatedAt: new Date(),
        UpdatedAt: new Date()
      };

      const docRef = await db.collection('EmergencyContacts').add(contactDoc);

      // Log security event
      await authService.logSecurityEvent(userID, 'EMERGENCY_CONTACT_ADDED', {
        contactId: docRef.id,
        contactName: ContactName
      });

      // Calculate updated profile completion
      const completionResult = await profileCompletionService.calculateCompletion(userID);

      // Return standardized format matching /profile/emergency-contacts
      return {
        success: true,
        message: 'Emergency contact added successfully',
        data: {
          id: docRef.id,
          ContactName: contactDoc.ContactName,
          phoneNumbers: contactDoc.PhoneNumbers,
          relationship: contactDoc.Relationship,
          isPrimary: contactDoc.IsPrimary,
          notes: contactDoc.Notes,
          priority: contactDoc.Priority,
          updatedAt: contactDoc.UpdatedAt
        },
        profileCompletion: completionResult.completionPercentage,
        completionLevel: completionResult.completionLevel,
        nextRecommendedStep: completionResult.nextRecommendedStep
      };
    } catch (error) {
      console.error('Add emergency contact error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Update an existing emergency contact
   * @param {string} userID - User ID
   * @param {string} contactId - Contact document ID
   * @param {Object} contactData - Updated contact information
   * @returns {Object} - Updated contact data
   */
  async updateContact(userID, contactId, contactData) {
    const db = getFirestore();

    try {
      // Get the contact document
      const contactDoc = await db.collection('EmergencyContacts').doc(contactId).get();

      if (!contactDoc.exists) {
        return {
          success: false,
          error: 'Not Found',
          message: 'Contact not found',
          code: 404
        };
      }

      // Verify ownership
      if (contactDoc.data().UserID !== userID) {
        await authService.logSecurityEvent(userID, 'UNAUTHORIZED_ACCESS', {
          attemptedResource: `EmergencyContacts/${contactId}`
        });
        return {
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to update this contact',
          code: 403
        };
      }

      const {
        ContactName,
        phoneNumbers,
        relationship,
        Relation,
        isPrimary,
        IsPrimary,
        notes,
        Notes
      } = contactData;

      // Handle both lowercase and PascalCase field names
      const finalRelationship = relationship !== undefined ? relationship : Relation;
      const finalIsPrimary = isPrimary !== undefined ? isPrimary : IsPrimary;
      const finalNotes = notes !== undefined ? notes : Notes;

      // If setting as primary, unset all others
      if (finalIsPrimary === true) {
        const existingPrimary = await db.collection('EmergencyContacts')
          .where('UserID', '==', userID)
          .where('IsPrimary', '==', true)
          .get();

        const batch = db.batch();
        existingPrimary.docs.forEach(doc => {
          if (doc.id !== contactId) {
            batch.update(doc.ref, { IsPrimary: false, UpdatedAt: new Date() });
          }
        });
        if (!existingPrimary.empty) {
          await batch.commit();
        }
      }

      // Build update data (only include provided fields)
      const updateData = { UpdatedAt: new Date() };
      if (ContactName !== undefined) updateData.ContactName = ContactName;
      if (phoneNumbers !== undefined) updateData.PhoneNumbers = phoneNumbers;
      if (finalRelationship !== undefined) updateData.Relationship = finalRelationship;
      if (finalIsPrimary !== undefined) updateData.IsPrimary = finalIsPrimary;
      if (finalNotes !== undefined) updateData.Notes = finalNotes;

      await db.collection('EmergencyContacts').doc(contactId).update(updateData);

      // Get updated document
      const updatedDoc = await db.collection('EmergencyContacts').doc(contactId).get();
      const updatedData = updatedDoc.data();

      // Return standardized format
      return {
        success: true,
        message: 'Contact updated successfully',
        data: {
          id: contactId,
          ContactName: updatedData.ContactName,
          phoneNumbers: updatedData.PhoneNumbers,
          relationship: updatedData.Relationship,
          isPrimary: updatedData.IsPrimary,
          notes: updatedData.Notes,
          priority: updatedData.Priority,
          updatedAt: updatedData.UpdatedAt
        }
      };
    } catch (error) {
      console.error('Update emergency contact error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Delete an emergency contact
   * @param {string} userID - User ID
   * @param {string} contactId - Contact document ID
   * @returns {Object} - Deletion result
   */
  async deleteContact(userID, contactId) {
    const db = getFirestore();

    try {
      const contactDoc = await db.collection('EmergencyContacts').doc(contactId).get();

      if (!contactDoc.exists) {
        return {
          success: false,
          error: 'Not Found',
          message: 'Contact not found or already deleted',
          code: 404
        };
      }

      // Verify ownership
      if (contactDoc.data().UserID !== userID) {
        await authService.logSecurityEvent(userID, 'UNAUTHORIZED_ACCESS', {
          attemptedResource: `EmergencyContacts/${contactId}`
        });
        return {
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to delete this contact',
          code: 403
        };
      }

      await db.collection('EmergencyContacts').doc(contactId).delete();

      // Log security event
      await authService.logSecurityEvent(userID, 'EMERGENCY_CONTACT_DELETED', {
        contactId,
        contactName: contactDoc.data().ContactName
      });

      // Calculate updated profile completion
      const completionResult = await profileCompletionService.calculateCompletion(userID);

      return {
        success: true,
        message: 'Contact deleted successfully',
        data: {
          deletedId: contactId,
          deletedName: contactDoc.data().ContactName
        },
        profileCompletion: completionResult.completionPercentage,
        completionLevel: completionResult.completionLevel,
        nextRecommendedStep: completionResult.nextRecommendedStep
      };
    } catch (error) {
      console.error('Delete emergency contact error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Get all emergency contacts for a user
   * @param {string} userID - User ID
   * @returns {Object} - List of contacts in standardized format
   */
  async getContacts(userID) {
    const db = getFirestore();

    try {
      const contactsQuery = await db.collection('EmergencyContacts')
        .where('UserID', '==', userID)
        .get();

      // Transform to standardized format matching /profile/emergency-contacts
      const contacts = contactsQuery.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ContactName: data.ContactName,
          phoneNumbers: data.PhoneNumbers || [],
          relationship: data.Relationship,
          isPrimary: data.IsPrimary,
          notes: data.Notes,
          priority: data.Priority,
          updatedAt: data.UpdatedAt
        };
      }).sort((a, b) => (a.priority || 999) - (b.priority || 999));

      // Calculate profile completion
      const completionResult = await profileCompletionService.calculateCompletion(userID);

      return {
        success: true,
        data: {
          userID,
          contacts,
          count: contacts.length
        },
        profileCompletion: completionResult.completionPercentage,
        completionLevel: completionResult.completionLevel,
        nextRecommendedStep: completionResult.nextRecommendedStep
      };
    } catch (error) {
      console.error('Get emergency contacts error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Get a single emergency contact
   * @param {string} userID - User ID
   * @param {string} contactId - Contact document ID
   * @returns {Object} - Contact data in standardized format
   */
  async getContact(userID, contactId) {
    const db = getFirestore();

    try {
      const contactDoc = await db.collection('EmergencyContacts').doc(contactId).get();

      if (!contactDoc.exists) {
        return {
          success: false,
          error: 'Not Found',
          message: 'Contact not found',
          code: 404
        };
      }

      // Verify ownership
      if (contactDoc.data().UserID !== userID) {
        return {
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to view this contact',
          code: 403
        };
      }

      const data = contactDoc.data();

      // Return standardized format
      return {
        success: true,
        data: {
          id: contactId,
          ContactName: data.ContactName,
          phoneNumbers: data.PhoneNumbers || [],
          relationship: data.Relationship,
          isPrimary: data.IsPrimary,
          notes: data.Notes,
          priority: data.Priority,
          updatedAt: data.UpdatedAt
        }
      };
    } catch (error) {
      console.error('Get emergency contact error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Add multiple emergency contacts at once
   * @param {string} userID - User ID
   * @param {Array} contacts - Array of contact objects
   * @returns {Object} - Created contacts data in standardized format
   */
  async addMultipleContacts(userID, contacts) {
    const db = getFirestore();

    try {
      // Verify user exists
      const userResult = await authService.getUserById(userID);
      if (!userResult.exists) {
        return {
          success: false,
          error: 'Not Found',
          message: 'User not found',
          code: 404
        };
      }

      if (!Array.isArray(contacts) || contacts.length === 0) {
        return {
          success: false,
          error: 'Validation Error',
          message: 'Contacts must be a non-empty array',
          code: 400
        };
      }

      // Get existing contacts to determine priority
      const existingContacts = await db.collection('EmergencyContacts')
        .where('UserID', '==', userID)
        .get();
      let basePriority = existingContacts.size + 1;

      // Check if any existing primary contact exists
      const existingPrimary = existingContacts.docs.find(doc => doc.data().IsPrimary === true);
      const hasExistingPrimary = !!existingPrimary;

      const batch = db.batch();
      const createdContacts = [];
      const errors = [];

      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        const { 
          ContactName, 
          phoneNumbers, 
          relationship, 
          Relation,
          isPrimary, 
          IsPrimary,
          notes,
          Notes
        } = contact;

        // Handle both lowercase and PascalCase field names
        const finalRelationship = relationship || Relation || 'Other';
        const finalIsPrimary = isPrimary !== undefined ? isPrimary : (IsPrimary !== undefined ? IsPrimary : false);
        const finalNotes = notes || Notes || '';

        // Validate required fields
        if (!ContactName || !phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
          errors.push({
            index: i,
            error: 'fullName and phoneNumbers array are required'
          });
          continue;
        }

        // Determine if this should be primary
        // First contact is primary if no existing primary, unless explicitly set
        let shouldBePrimary = finalIsPrimary === true;
        if (!hasExistingPrimary && i === 0 && finalIsPrimary !== false) {
          shouldBePrimary = true;
        }

        // Create contact document with standardized format
        const contactDoc = {
          UserID: userID,
          ContactName: ContactName,
          PhoneNumbers: phoneNumbers,
          Relationship: finalRelationship,
          IsPrimary: shouldBePrimary,
          Priority: basePriority + i,
          Notes: finalNotes,
          CreatedAt: new Date(),
          UpdatedAt: new Date()
        };

        const docRef = db.collection('EmergencyContacts').doc();
        batch.set(docRef, contactDoc);

        // Add to created contacts in standardized format
        createdContacts.push({
          id: docRef.id,
          ContactName: contactDoc.ContactName,
          phoneNumbers: contactDoc.PhoneNumbers,
          relationship: contactDoc.Relationship,
          isPrimary: contactDoc.IsPrimary,
          notes: contactDoc.Notes,
          priority: contactDoc.Priority,
          updatedAt: contactDoc.UpdatedAt
        });
      }

      // If any new contact is primary, unset existing primary
      const hasNewPrimary = createdContacts.some(c => c.isPrimary === true);
      if (hasNewPrimary && existingPrimary) {
        batch.update(existingPrimary.ref, { IsPrimary: false, UpdatedAt: new Date() });
      }

      await batch.commit();

      // Log security event
      await authService.logSecurityEvent(userID, 'EMERGENCY_CONTACTS_ADDED_BULK', {
        count: createdContacts.length,
        contactNames: createdContacts.map(c => c.ContactName)
      });

      // Calculate updated profile completion
      const completionResult = await profileCompletionService.calculateCompletion(userID);

      return {
        success: true,
        message: `${createdContacts.length} emergency contact(s) added successfully`,
        data: {
          userID,
          contacts: createdContacts,
          count: createdContacts.length,
          errors: errors.length > 0 ? errors : undefined
        },
        profileCompletion: completionResult.completionPercentage,
        completionLevel: completionResult.completionLevel,
        nextRecommendedStep: completionResult.nextRecommendedStep
      };
    } catch (error) {
      console.error('Add multiple emergency contacts error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Set a contact as the primary emergency contact
   * @param {string} userID - User ID
   * @param {string} contactId - Contact document ID
   * @returns {Object} - Result
   */
  async setPrimary(userID, contactId) {
    const db = getFirestore();

    try {
      const contactDoc = await db.collection('EmergencyContacts').doc(contactId).get();

      if (!contactDoc.exists) {
        return {
          success: false,
          error: 'Not Found',
          message: 'Contact not found',
          code: 404
        };
      }

      if (contactDoc.data().UserID !== userID) {
        return {
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to modify this contact',
          code: 403
        };
      }

      // Unset all other primary contacts
      const existingPrimary = await db.collection('EmergencyContacts')
        .where('UserID', '==', userID)
        .where('IsPrimary', '==', true)
        .get();

      const batch = db.batch();
      existingPrimary.docs.forEach(doc => {
        batch.update(doc.ref, { IsPrimary: false, UpdatedAt: new Date() });
      });

      // Set this contact as primary
      batch.update(db.collection('EmergencyContacts').doc(contactId), {
        IsPrimary: true,
        UpdatedAt: new Date()
      });

      await batch.commit();

      return {
        success: true,
        message: 'Primary contact updated successfully',
        data: {
          id: contactId,
          IsPrimary: true,
          UpdatedAt: new Date()
        }
      };
    } catch (error) {
      console.error('Set primary contact error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }
}

module.exports = new EmergencyContactService();
