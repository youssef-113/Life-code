const { getFirestore } = require('../config/firebase');
const authService = require('./authService');

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
        Relation,
        PhoneNumber,
        SecondaryPhone,
        Email,
        IsPrimary,
        Priority,
        Notes
      } = contactData;

      // If this contact is set as primary, unset all other primary contacts
      if (IsPrimary === true) {
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
      let contactPriority = Priority;
      if (contactPriority === undefined || contactPriority === null) {
        const existingContacts = await db.collection('EmergencyContacts')
          .where('UserID', '==', userID)
          .get();
        contactPriority = existingContacts.size + 1;
      }

      // Create contact document
      const contactDoc = {
        UserID: userID,
        ContactName: ContactName,
        Relation: Relation || '',
        PhoneNumber: PhoneNumber,
        SecondaryPhone: SecondaryPhone || null,
        Email: Email || null,
        IsPrimary: IsPrimary || false,
        Priority: contactPriority,
        Notes: Notes || '',
        CreatedAt: new Date(),
        UpdatedAt: new Date()
      };

      const docRef = await db.collection('EmergencyContacts').add(contactDoc);

      // Log security event
      await authService.logSecurityEvent(userID, 'EMERGENCY_CONTACT_ADDED', {
        contactId: docRef.id,
        contactName: ContactName
      });

      return {
        success: true,
        message: 'Emergency contact added successfully',
        data: {
          id: docRef.id,
          ...contactDoc
        }
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
        Relation,
        PhoneNumber,
        SecondaryPhone,
        Email,
        IsPrimary,
        Priority,
        Notes
      } = contactData;

      // If setting as primary, unset all others
      if (IsPrimary === true) {
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
      if (Relation !== undefined) updateData.Relation = Relation;
      if (PhoneNumber !== undefined) updateData.PhoneNumber = PhoneNumber;
      if (SecondaryPhone !== undefined) updateData.SecondaryPhone = SecondaryPhone;
      if (Email !== undefined) updateData.Email = Email;
      if (IsPrimary !== undefined) updateData.IsPrimary = IsPrimary;
      if (Priority !== undefined) updateData.Priority = Priority;
      if (Notes !== undefined) updateData.Notes = Notes;

      await db.collection('EmergencyContacts').doc(contactId).update(updateData);

      // Get updated document
      const updatedDoc = await db.collection('EmergencyContacts').doc(contactId).get();
      const updatedData = updatedDoc.data();

      return {
        success: true,
        message: 'Contact updated successfully',
        data: {
          id: contactId,
          ...updatedData
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

      return {
        success: true,
        message: 'Contact deleted successfully',
        data: {
          deletedId: contactId
        }
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
   * @returns {Object} - List of contacts
   */
  async getContacts(userID) {
    const db = getFirestore();

    try {
      const contactsQuery = await db.collection('EmergencyContacts')
        .where('UserID', '==', userID)
        .get();

      const contacts = contactsQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => (a.Priority || 999) - (b.Priority || 999));

      return {
        success: true,
        data: contacts,
        count: contacts.length
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
   * @returns {Object} - Contact data
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

      return {
        success: true,
        data: {
          id: contactId,
          ...contactDoc.data()
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
   * @returns {Object} - Created contacts data
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
        const { ContactName, Relation, PhoneNumber, SecondaryPhone, Email, IsPrimary, Priority, Notes } = contact;

        // Validate required fields
        if (!ContactName || !PhoneNumber) {
          errors.push({
            index: i,
            error: 'ContactName and PhoneNumber are required'
          });
          continue;
        }

        // Determine if this should be primary
        // First contact is primary if no existing primary, unless explicitly set
        let shouldBePrimary = IsPrimary === true;
        if (!hasExistingPrimary && i === 0 && IsPrimary !== false) {
          shouldBePrimary = true;
        }

        // Create contact document
        const contactDoc = {
          UserID: userID,
          ContactName: ContactName,
          Relation: Relation || '',
          PhoneNumber: PhoneNumber,
          SecondaryPhone: SecondaryPhone || null,
          Email: Email || null,
          IsPrimary: shouldBePrimary,
          Priority: Priority !== undefined ? Priority : basePriority + i,
          Notes: Notes || '',
          CreatedAt: new Date(),
          UpdatedAt: new Date()
        };

        const docRef = db.collection('EmergencyContacts').doc();
        batch.set(docRef, contactDoc);

        createdContacts.push({
          id: docRef.id,
          ...contactDoc
        });
      }

      // If any new contact is primary, unset existing primary
      const hasNewPrimary = createdContacts.some(c => c.IsPrimary === true);
      if (hasNewPrimary && existingPrimary) {
        batch.update(existingPrimary.ref, { IsPrimary: false, UpdatedAt: new Date() });
      }

      await batch.commit();

      // Log security event
      await authService.logSecurityEvent(userID, 'EMERGENCY_CONTACTS_ADDED_BULK', {
        count: createdContacts.length,
        contactNames: createdContacts.map(c => c.ContactName)
      });

      return {
        success: true,
        message: `${createdContacts.length} emergency contact(s) added successfully`,
        data: {
          contacts: createdContacts,
          count: createdContacts.length,
          errors: errors.length > 0 ? errors : undefined
        }
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
