const bcrypt = require('bcryptjs');
const { getFirestore, getAuth } = require('../config/firebase');
const authService = require('./authService');

/**
 * User Account Service - Handles password, photo, account deletion, preferences
 * Firestore Collections: Users, UserProfiles, UserSessions, SecurityLogs
 */
class UserAccountService {

  /**
   * Change user password
   * @param {string} userID - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Object} - Result
   */
  async changePassword(userID, currentPassword, newPassword) {
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

      const userData = userResult.data;

      // Get Firebase Auth user to update password
      const auth = getAuth();
      try {
        const firebaseUser = await auth.getUser(userID);

        // Update password in Firebase Auth
        await auth.updateUser(userID, {
          password: newPassword
        });
      } catch (firebaseError) {
        console.error('Firebase password update error:', firebaseError);
        return {
          success: false,
          error: 'Authentication Failed',
          message: 'Failed to update password. Please try again.',
          code: 500
        };
      }

      // Update timestamp in Firestore
      await db.collection('Users').doc(userID).update({
        UpdatedAt: new Date()
      });

      // Log security event
      await authService.logSecurityEvent(userID, 'PASSWORD_CHANGED', {
        changedAt: new Date().toISOString()
      });

      // Optionally invalidate all other sessions
      const sessionsQuery = await db.collection('UserSessions')
        .where('UserID', '==', userID)
        .where('IsActive', '==', true)
        .get();

      // Keep current session active, revoke others would need the current token
      // For now, just log the event

      return {
        success: true,
        message: 'Password changed successfully',
        data: {
          changedAt: new Date()
        }
      };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Upload/update profile photo
   * @param {string} userID - User ID
   * @param {string} photoData - Base64 encoded photo or URL
   * @returns {Object} - Result with photo URL
   */
  async uploadPhoto(userID, photoData) {
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

      // Store the photo URL/data directly in the user document
      // In production, you'd upload to Firebase Storage first
      let photoURL = photoData;

      // If it's base64 data, store as a data URL 
      // (In production, upload to Firebase Storage and get download URL)
      if (photoData && photoData.startsWith('data:image')) {
        photoURL = photoData; // Store base64 directly for now
      }

      await db.collection('Users').doc(userID).update({
        PhotoURL: photoURL,
        UpdatedAt: new Date()
      });

      return {
        success: true,
        message: 'Photo uploaded successfully',
        data: {
          photoURL: photoURL,
          uploadedAt: new Date()
        }
      };
    } catch (error) {
      console.error('Upload photo error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Delete (deactivate) user account
   * Soft delete: sets IsActive=false and deactivates all sessions
   * @param {string} userID - User ID
   * @returns {Object} - Result
   */
  async deleteAccount(userID) {
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

      // Soft delete: set IsActive to false
      await db.collection('Users').doc(userID).update({
        IsActive: false,
        DeactivatedAt: new Date(),
        UpdatedAt: new Date()
      });

      // Deactivate all sessions
      const sessionsQuery = await db.collection('UserSessions')
        .where('UserID', '==', userID)
        .where('IsActive', '==', true)
        .get();

      const batch = db.batch();
      let sessionCount = 0;
      sessionsQuery.docs.forEach(doc => {
        batch.update(doc.ref, {
          IsActive: false,
          LoggedOutAt: new Date()
        });
        sessionCount++;
      });

      if (sessionCount > 0) {
        await batch.commit();
      }

      // Log security event
      await authService.logSecurityEvent(userID, 'ACCOUNT_DEACTIVATED', {
        sessionsDeactivated: sessionCount,
        deactivatedAt: new Date().toISOString()
      });

      return {
        success: true,
        message: 'Account deleted successfully',
        data: {
          deactivatedAt: new Date(),
          sessionsDeactivated: sessionCount
        }
      };
    } catch (error) {
      console.error('Delete account error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Update user preferences (notifications, privacy)
   * @param {string} userID - User ID
   * @param {Object} preferences - Preference settings
   * @returns {Object} - Result
   */
  async updatePreferences(userID, preferences) {
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
        pushNotifications,
        emailNotifications,
        showMedicalOnScan,
        showContactsOnScan,
        showPhotoOnScan
      } = preferences;

      // Build preferences data
      const preferencesData = {
        UpdatedAt: new Date()
      };

      if (pushNotifications !== undefined) preferencesData.PushNotifications = pushNotifications;
      if (emailNotifications !== undefined) preferencesData.EmailNotifications = emailNotifications;
      if (showMedicalOnScan !== undefined) preferencesData.ShowMedicalOnScan = showMedicalOnScan;
      if (showContactsOnScan !== undefined) preferencesData.ShowContactsOnScan = showContactsOnScan;
      if (showPhotoOnScan !== undefined) preferencesData.ShowPhotoOnScan = showPhotoOnScan;

      // Store preferences in UserProfiles collection (upsert)
      await db.collection('UserProfiles').doc(userID).set({
        UserID: userID,
        Preferences: preferencesData,
        UpdatedAt: new Date()
      }, { merge: true });

      return {
        success: true,
        message: 'Preferences updated successfully',
        data: preferencesData
      };
    } catch (error) {
      console.error('Update preferences error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Get user preferences
   * @param {string} userID - User ID
   * @returns {Object} - Preferences data
   */
  async getPreferences(userID) {
    const db = getFirestore();

    try {
      const profileDoc = await db.collection('UserProfiles').doc(userID).get();

      if (!profileDoc.exists || !profileDoc.data().Preferences) {
        // Return defaults
        return {
          success: true,
          data: {
            PushNotifications: true,
            EmailNotifications: true,
            ShowMedicalOnScan: true,
            ShowContactsOnScan: true,
            ShowPhotoOnScan: true
          }
        };
      }

      return {
        success: true,
        data: profileDoc.data().Preferences
      };
    } catch (error) {
      console.error('Get preferences error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Get complete user profile (user + medical + contacts + wristbands)
   * @param {string} userID - User ID
   * @returns {Object} - Complete profile data
   */
  async getCompleteProfile(userID) {
    const db = getFirestore();

    try {
      // Fetch all data in parallel
      const [userDoc, medicalDoc, contactsQuery, wristbandsQuery] = await Promise.all([
        db.collection('Users').doc(userID).get(),
        db.collection('MedicalInfo').doc(userID).get(),
        db.collection('EmergencyContacts')
          .where('UserID', '==', userID)
          .get(),
        db.collection('Wristbands')
          .where('UserID', '==', userID)
          .orderBy('CreatedAt', 'desc')
          .get()
      ]);

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
          user: {
            id: userID,
            Username: userData.Username,
            Email: userData.Email,
            Providers: userData.Providers || [],
            PrimaryProvider: userData.PrimaryProvider || 'email',
            Gender: userData.Gender || null,
            NationalID: userData.NationalID || null,
            PhotoURL: userData.PhotoURL || null,
            PhoneNumber: userData.PhoneNumber || null,
            Address: userData.Address || null,
            DateOfBirth: userData.DateOfBirth || null,
            IsActive: userData.IsActive,
            CreatedAt: userData.CreatedAt,
            UpdatedAt: userData.UpdatedAt
          },
          medical: medicalDoc.exists ? {
            BloodType: medicalDoc.data().BloodType,
            Height: medicalDoc.data().Height,
            Weight: medicalDoc.data().Weight,
            ChronicDiseases: medicalDoc.data().ChronicDiseases,
            Allergies: medicalDoc.data().Allergies,
            Medications: medicalDoc.data().Medications,
            Surgeries: medicalDoc.data().Surgeries,
            Notes: medicalDoc.data().Notes,
            EmergencyInstructions: medicalDoc.data().EmergencyInstructions
          } : null,
          emergencyContacts: contactsQuery.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })).sort((a, b) => (a.Priority || 999) - (b.Priority || 999)),
          wristbands: wristbandsQuery.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        }
      };
    } catch (error) {
      console.error('Get complete profile error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }
}

module.exports = new UserAccountService();
