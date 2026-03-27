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
          gender: userData.Gender || null,
          address: userData.Address || null,
          email: userData.Email || null,
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
   * @param {Object} contacts - Emergency contacts data
   * @returns {Object} - Update result
   */
  async updateEmergencyContacts(userID, contacts) {
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

      const { primaryContact, secondaryContact } = contacts;

      // Prepare emergency contacts data
      const emergencyContactsData = {
        PrimaryContact: {
          FullName: primaryContact.fullName,
          PhoneNumber: primaryContact.phoneNumber,
          Relationship: primaryContact.relationship,
          UpdatedAt: new Date()
        }
      };

      // Add secondary contact if provided
      if (secondaryContact && secondaryContact.fullName && secondaryContact.phoneNumber) {
        emergencyContactsData.SecondaryContact = {
          FullName: secondaryContact.fullName,
          PhoneNumber: secondaryContact.phoneNumber,
          Relationship: secondaryContact.relationship || 'Other',
          UpdatedAt: new Date()
        };
      }

      // Store in separate collection for better structure
      await db.collection('UserProfiles').doc(userID).set({
        UserID: userID,
        EmergencyContacts: emergencyContactsData,
        UpdatedAt: new Date()
      }, { merge: true });

      // Log security event for profile update
      await authService.logSecurityEvent(userID, 'EMERGENCY_CONTACTS_UPDATED', {
        hasSecondaryContact: !!secondaryContact
      });

      // Prepare response data
      const responseData = {
        userID,
        primaryContact: {
          fullName: emergencyContactsData.PrimaryContact.FullName,
          phoneNumber: emergencyContactsData.PrimaryContact.PhoneNumber,
          relationship: emergencyContactsData.PrimaryContact.Relationship,
          updatedAt: emergencyContactsData.PrimaryContact.UpdatedAt
        },
        secondaryContact: emergencyContactsData.SecondaryContact ? {
          fullName: emergencyContactsData.SecondaryContact.FullName,
          phoneNumber: emergencyContactsData.SecondaryContact.PhoneNumber,
          relationship: emergencyContactsData.SecondaryContact.Relationship,
          updatedAt: emergencyContactsData.SecondaryContact.UpdatedAt
        } : null,
        updatedAt: new Date()
      };

      return {
        success: true,
        message: 'Emergency contacts updated successfully',
        data: responseData
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
            primaryContact: null,
            secondaryContact: null
          }
        };
      }

      const profileData = profileDoc.data();
      const contacts = profileData.EmergencyContacts || {};

      return {
        success: true,
        data: {
          userID,
          primaryContact: contacts.PrimaryContact || null,
          secondaryContact: contacts.SecondaryContact || null
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
