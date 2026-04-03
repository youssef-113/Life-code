const { getFirestore } = require('../config/firebase');
const authService = require('./authService');

/**
 * User Profile Service - Handles personal info and emergency contacts database operations
 */
class UserProfileService {

  /**
   * Update user personal information
   * @param {string} userID - User ID
   * @param {Object} personalInfo - Personal information data
   * @returns {Object} - Update result
   */
  async updatePersonalInfo(userID, personalInfo) {
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

      const { fullName, gender, address } = personalInfo;

      // Update user document with personal info
      const updateData = {
        FullName: fullName,
        UpdatedAt: new Date()
      };

      if (gender !== undefined) {
        updateData.Gender = gender;
      }

      if (address !== undefined) {
        updateData.Address = address;
      }

      // Update the user document
      await db.collection('Users').doc(userID).update(updateData);

      // Also update the username if fullName is different
      if (fullName && fullName !== userResult.data.Username) {
        await db.collection('Users').doc(userID).update({
          Username: fullName
        });
      }

      return {
        success: true,
        message: 'Personal information updated successfully',
        data: {
          userID,
          fullName,
          gender: gender || null,
          address: address || null,
          updatedAt: new Date()
        }
      };
    } catch (error) {
      console.error('Update personal info error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Get user personal information
   * @param {string} userID - User ID
   * @returns {Object} - Personal information data
   */
  async getPersonalInfo(userID) {
    const db = getFirestore();
    
    try {
      // Get user document
      const userDoc = await db.collection('Users').doc(userID).get();
      
      if (!userDoc.exists) {
        return {
          success: false,
          error: 'Not Found',
          message: 'User not found',
          code: 404
        };
      }

      const userData = userDoc.data();

      return {
        success: true,
        data: {
          userID,
          fullName: userData.FullName || userData.Username || null,
          email: userData.Email || null,
          providers: userData.Providers || [],
          primaryProvider: userData.PrimaryProvider || 'email',
          gender: userData.Gender || null,
          address: userData.Address || null,
          photoURL: userData.PhotoURL || null,
          updatedAt: userData.UpdatedAt || null
        }
      };
    } catch (error) {
      console.error('Get personal info error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Update user emergency contacts
   * @param {string} userID - User ID
   * @param {Object} data - Emergency contacts data with contacts array
   * @returns {Object} - Update result
   */
  async updateEmergencyContacts(userID, data) {
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

      const { contacts } = data;

      // Validate contacts array
      if (!Array.isArray(contacts) || contacts.length === 0) {
        return {
          success: false,
          error: 'Validation Error',
          message: 'Contacts must be a non-empty array',
          code: 400
        };
      }

      // Transform contacts to Firestore format with IDs
      const contactsArray = contacts.map((contact, index) => ({
        id: contact.id || `contact_${index}`,
        FullName: contact.fullName,
        PhoneNumber: contact.phoneNumber,
        SecondaryPhone: contact.secondaryPhone || '',
        Relationship: contact.relationship,
        IsPrimary: contact.isPrimary || index === 0, // First contact is primary by default
        UpdatedAt: new Date()
      }));

      // Store in UserProfiles collection
      await db.collection('UserProfiles').doc(userID).set({
        UserID: userID,
        EmergencyContacts: {
          contacts: contactsArray,
          count: contactsArray.length
        },
        UpdatedAt: new Date()
      }, { merge: true });

      // Log security event for profile update
      await authService.logSecurityEvent(userID, 'EMERGENCY_CONTACTS_UPDATED', {
        contactCount: contactsArray.length,
        primaryContactName: contactsArray.find(c => c.IsPrimary)?.FullName
      });

      // Prepare response data - return all contacts
      const responseContacts = contactsArray.map(contact => ({
        id: contact.id,
        fullName: contact.FullName,
        phoneNumber: contact.PhoneNumber,
        secondaryPhone: contact.SecondaryPhone,
        relationship: contact.Relationship,
        isPrimary: contact.IsPrimary,
        updatedAt: contact.UpdatedAt
      }));

      return {
        success: true,
        message: 'Emergency contacts updated successfully',
        data: {
          userID,
          contacts: responseContacts,
          count: responseContacts.length,
          updatedAt: new Date()
        }
      };
    } catch (error) {
      console.error('Update emergency contacts error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Get user emergency contacts
   * @param {string} userID - User ID
   * @returns {Object} - Emergency contacts data
   */
  async getEmergencyContacts(userID) {
    const db = getFirestore();
    
    try {
      // Get user profile document
      const profileDoc = await db.collection('UserProfiles').doc(userID).get();
      
      if (!profileDoc.exists) {
        return {
          success: true,
          data: {
            userID,
            contacts: [],
            count: 0
          }
        };
      }

      const profileData = profileDoc.data();
      const emergencyContacts = profileData.EmergencyContacts || {};
      
      // Support new format (contacts array) and old format (primary/secondary)
      let contactsArray = [];
      
      if (emergencyContacts.contacts && Array.isArray(emergencyContacts.contacts)) {
        // New format - contacts array
        contactsArray = emergencyContacts.contacts.map(contact => ({
          id: contact.id,
          fullName: contact.FullName,
          phoneNumber: contact.PhoneNumber,
          secondaryPhone: contact.SecondaryPhone || '',
          relationship: contact.Relationship,
          isPrimary: contact.IsPrimary,
          updatedAt: contact.UpdatedAt
        }));
      } else if (emergencyContacts.PrimaryContact) {
        // Old format - convert to array
        contactsArray.push({
          id: 'contact_0',
          fullName: emergencyContacts.PrimaryContact.FullName,
          phoneNumber: emergencyContacts.PrimaryContact.PhoneNumber,
          secondaryPhone: emergencyContacts.PrimaryContact.SecondaryPhone || '',
          relationship: emergencyContacts.PrimaryContact.Relationship,
          isPrimary: true,
          updatedAt: emergencyContacts.PrimaryContact.UpdatedAt
        });
        
        if (emergencyContacts.SecondaryContact) {
          contactsArray.push({
            id: 'contact_1',
            fullName: emergencyContacts.SecondaryContact.FullName,
            phoneNumber: emergencyContacts.SecondaryContact.PhoneNumber,
            secondaryPhone: emergencyContacts.SecondaryContact.SecondaryPhone || '',
            relationship: emergencyContacts.SecondaryContact.Relationship,
            isPrimary: false,
            updatedAt: emergencyContacts.SecondaryContact.UpdatedAt
          });
        }
      }

      return {
        success: true,
        data: {
          userID,
          contacts: contactsArray,
          count: contactsArray.length
        }
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
}

module.exports = new UserProfileService();
