const { getFirestore } = require('../config/firebase');
const authService = require('./authService');

/**
 * Medical Profile Service - Handles the Medical Profile screen
 * 
 * Data Structure:
 * {
 *   personalInfo: { name, gender, address },
 *   emergencyContact: { primary: {...}, secondary: [...] },
 *   medicalProfile: { bloodType, medicalConditions },
 *   allergies: [{ allergyType, severity, notes }],
 *   medications: [{ medicationName, dosage, schedule, notes }],
 *   surgeries: [{ surgeryName, surgeryDate, notes }]
 * }
 */
class MedicalProfileService {

  /**
   * Get the full Medical Profile dashboard data
   * Used by: Medical Profile screen (GET)
   * Returns: user header, profile completion %, quick stats, section data with counts
   * @param {string} userID - User ID
   * @returns {Object} - Medical profile dashboard
   */
  async getMedicalProfile(userID) {
    const db = getFirestore();

    try {
      // Fetch user + medical in parallel
      const [userDoc, medicalDoc] = await Promise.all([
        db.collection('Users').doc(userID).get(),
        db.collection('MedicalInfo').doc(userID).get()
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
      const medicalData = medicalDoc.exists ? medicalDoc.data() : null;

      // --- Build user header ---
      const userHeader = {
        name: medicalData?.PersonalInfo?.Name || userData.Username || userData.FullName || '',
        photoURL: userData.PhotoURL || null,
        updatedAt: medicalData?.UpdatedAt || userData.UpdatedAt || null
      };

      // --- Quick stats ---
      const quickStats = {
        bloodType: medicalData?.MedicalProfile?.BloodType || null,
        allergiesCount: medicalData?.Allergies ? medicalData.Allergies.length : 0,
        medicationsCount: medicalData?.Medications ? medicalData.Medications.length : 0
      };

      // --- Sections with completion status ---
      const sections = {
        personalInfo: {
          completed: !!(medicalData?.PersonalInfo?.Name),
          data: {
            name: medicalData?.PersonalInfo?.Name || '',
            gender: medicalData?.PersonalInfo?.Gender || '',
            address: medicalData?.PersonalInfo?.Address || ''
          }
        },
        emergencyContact: {
          completed: !!(medicalData?.EmergencyContact?.Primary),
          data: {
            primary: medicalData?.EmergencyContact?.Primary ? {
              fullName: medicalData.EmergencyContact.Primary.FullName || '',
              phoneNumber: medicalData.EmergencyContact.Primary.PhoneNumber || '',
              relationship: medicalData.EmergencyContact.Primary.Relationship || ''
            } : null,
            secondary: Array.isArray(medicalData?.EmergencyContact?.Secondary) 
              ? medicalData.EmergencyContact.Secondary.map(c => ({
                  fullName: c.FullName || '',
                  phoneNumber: c.PhoneNumber || '',
                  relationship: c.Relationship || ''
                }))
              : []
          }
        },
        medicalProfile: {
          completed: !!(medicalData?.MedicalProfile?.BloodType),
          data: {
            bloodType: medicalData?.MedicalProfile?.BloodType || null,
            medicalConditions: medicalData?.MedicalProfile?.MedicalConditions || []
          }
        },
        allergies: {
          completed: !!(medicalData?.Allergies && medicalData.Allergies.length > 0),
          count: medicalData?.Allergies ? medicalData.Allergies.length : 0,
          data: Array.isArray(medicalData?.Allergies) 
            ? medicalData.Allergies.map(a => ({
                allergyType: a.AllergyType || '',
                severity: a.Severity || '',
                notes: a.Notes || ''
              }))
            : []
        },
        medications: {
          completed: !!(medicalData?.Medications && medicalData.Medications.length > 0),
          count: medicalData?.Medications ? medicalData.Medications.length : 0,
          data: Array.isArray(medicalData?.Medications) 
            ? medicalData.Medications.map(m => ({
                medicationName: m.MedicationName || '',
                dosage: m.Dosage || '',
                schedule: m.Schedule || '',
                notes: m.Notes || ''
              }))
            : []
        },
        surgeries: {
          completed: !!(medicalData?.Surgeries && medicalData.Surgeries.length > 0),
          count: medicalData?.Surgeries ? medicalData.Surgeries.length : 0,
          data: Array.isArray(medicalData?.Surgeries) 
            ? medicalData.Surgeries.map(s => ({
                surgeryName: s.SurgeryName || '',
                surgeryDate: s.SurgeryDate || null,
                notes: s.Notes || ''
              }))
            : []
        }
      };

      // --- Profile completion % ---
      const completionFields = [
        medicalData?.PersonalInfo?.Name,
        medicalData?.PersonalInfo?.Gender,
        medicalData?.PersonalInfo?.Address,
        medicalData?.EmergencyContact?.Primary,
        medicalData?.MedicalProfile?.BloodType,
        medicalData?.MedicalProfile?.MedicalConditions?.length > 0,
        medicalData?.Allergies?.length > 0,
        medicalData?.Medications?.length > 0,
        medicalData?.Surgeries?.length > 0
      ];

      const filledCount = completionFields.filter(f => f !== null && f !== undefined && f !== '' && f !== false).length;
      const profileCompletion = Math.round((filledCount / completionFields.length) * 100);

      return {
        success: true,
        data: {
          userHeader,
          profileCompletion,
          quickStats,
          sections
        }
      };
    } catch (error) {
      console.error('Get medical profile error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Update Personal Information section
   * Fields: name, gender, address
   * Writes to: MedicalInfo collection (upsert)
   * @param {string} userID - User ID
   * @param {Object} data - Personal info data
   * @returns {Object} - Update result
   */
  async updatePersonalInfo(userID, data) {
    const db = getFirestore();

    try {
      const userResult = await authService.getUserById(userID);
      if (!userResult.exists) {
        return { success: false, error: 'Not Found', message: 'User not found', code: 404 };
      }

      const { name, gender, address } = data;

      const updateData = { UpdatedAt: new Date() };
      
      // Build PersonalInfo object
      const personalInfoUpdate = {};
      if (name !== undefined) personalInfoUpdate.Name = name;
      if (gender !== undefined) personalInfoUpdate.Gender = gender;
      if (address !== undefined) personalInfoUpdate.Address = address;
      
      if (Object.keys(personalInfoUpdate).length > 0) {
        updateData.PersonalInfo = personalInfoUpdate;
      }

      // Upsert medical info
      const medicalDoc = await db.collection('MedicalInfo').doc(userID).get();
      if (medicalDoc.exists) {
        // Merge with existing PersonalInfo
        const existingData = medicalDoc.data();
        if (updateData.PersonalInfo && existingData.PersonalInfo) {
          updateData.PersonalInfo = {
            ...existingData.PersonalInfo,
            ...updateData.PersonalInfo
          };
        }
        await db.collection('MedicalInfo').doc(userID).update(updateData);
      } else {
        await db.collection('MedicalInfo').doc(userID).set({
          UserID: userID,
          PersonalInfo: {
            Name: name || '',
            Gender: gender || '',
            Address: address || ''
          },
          EmergencyContact: { Primary: null, Secondary: [] },
          MedicalProfile: { BloodType: null, MedicalConditions: [] },
          Allergies: [],
          Medications: [],
          Surgeries: [],
          CreatedAt: new Date(),
          UpdatedAt: new Date()
        });
      }

      // Get updated data
      const updatedDoc = await db.collection('MedicalInfo').doc(userID).get();

      return {
        success: true,
        message: 'Personal information updated successfully',
        data: {
          name: updatedDoc.data().PersonalInfo?.Name || '',
          gender: updatedDoc.data().PersonalInfo?.Gender || '',
          address: updatedDoc.data().PersonalInfo?.Address || '',
          updatedAt: updatedDoc.data().UpdatedAt
        }
      };
    } catch (error) {
      console.error('Update personal info error:', error);
      return { success: false, error: 'Server Error', message: error.message, code: 500 };
    }
  }

  /**
   * Update Emergency Contact section
   * Fields: primary (object), secondary (array)
   * Writes to: MedicalInfo collection (upsert)
   * @param {string} userID - User ID
   * @param {Object} data - Emergency contact data
   * @returns {Object} - Update result
   */
  async updateEmergencyContact(userID, data) {
    const db = getFirestore();

    try {
      const userResult = await authService.getUserById(userID);
      if (!userResult.exists) {
        return { success: false, error: 'Not Found', message: 'User not found', code: 404 };
      }

      const { primary, secondary } = data;

      const updateData = { UpdatedAt: new Date() };
      
      const emergencyContactUpdate = {};
      
      if (primary !== undefined) {
        emergencyContactUpdate.Primary = primary ? {
          FullName: primary.fullName || '',
          PhoneNumber: primary.phoneNumber || '',
          Relationship: primary.relationship || ''
        } : null;
      }
      
      if (secondary !== undefined) {
        emergencyContactUpdate.Secondary = Array.isArray(secondary) 
          ? secondary.map(c => ({
              FullName: c.fullName || '',
              PhoneNumber: c.phoneNumber || '',
              Relationship: c.relationship || ''
            }))
          : [];
      }

      if (Object.keys(emergencyContactUpdate).length > 0) {
        updateData.EmergencyContact = emergencyContactUpdate;
      }

      // Upsert medical info
      const medicalDoc = await db.collection('MedicalInfo').doc(userID).get();
      if (medicalDoc.exists) {
        // Merge with existing EmergencyContact
        const existingData = medicalDoc.data();
        if (updateData.EmergencyContact && existingData.EmergencyContact) {
          updateData.EmergencyContact = {
            ...existingData.EmergencyContact,
            ...updateData.EmergencyContact
          };
        }
        await db.collection('MedicalInfo').doc(userID).update(updateData);
      } else {
        await db.collection('MedicalInfo').doc(userID).set({
          UserID: userID,
          PersonalInfo: { Name: '', Gender: '', Address: '' },
          EmergencyContact: {
            Primary: emergencyContactUpdate.Primary || null,
            Secondary: emergencyContactUpdate.Secondary || []
          },
          MedicalProfile: { BloodType: null, MedicalConditions: [] },
          Allergies: [],
          Medications: [],
          Surgeries: [],
          CreatedAt: new Date(),
          UpdatedAt: new Date()
        });
      }

      // Get updated data
      const updatedDoc = await db.collection('MedicalInfo').doc(userID).get();

      return {
        success: true,
        message: 'Emergency contact updated successfully',
        data: {
          primary: updatedDoc.data().EmergencyContact?.Primary ? {
            fullName: updatedDoc.data().EmergencyContact.Primary.FullName || '',
            phoneNumber: updatedDoc.data().EmergencyContact.Primary.PhoneNumber || '',
            relationship: updatedDoc.data().EmergencyContact.Primary.Relationship || ''
          } : null,
          secondary: Array.isArray(updatedDoc.data().EmergencyContact?.Secondary) 
            ? updatedDoc.data().EmergencyContact.Secondary.map(c => ({
                fullName: c.FullName || '',
                phoneNumber: c.PhoneNumber || '',
                relationship: c.Relationship || ''
              }))
            : [],
          updatedAt: updatedDoc.data().UpdatedAt
        }
      };
    } catch (error) {
      console.error('Update emergency contact error:', error);
      return { success: false, error: 'Server Error', message: error.message, code: 500 };
    }
  }

  /**
   * Update Medical Profile section
   * Fields: bloodType, medicalConditions
   * Writes to: MedicalInfo collection (upsert)
   * @param {string} userID - User ID
   * @param {Object} data - Medical profile data
   * @returns {Object} - Update result
   */
  async updateMedicalProfile(userID, data) {
    const db = getFirestore();

    try {
      const userResult = await authService.getUserById(userID);
      if (!userResult.exists) {
        return { success: false, error: 'Not Found', message: 'User not found', code: 404 };
      }

      const { bloodType, medicalConditions } = data;

      const updateData = { UpdatedAt: new Date() };
      
      const medicalProfileUpdate = {};
      if (bloodType !== undefined) medicalProfileUpdate.BloodType = bloodType;
      if (medicalConditions !== undefined) medicalProfileUpdate.MedicalConditions = Array.isArray(medicalConditions) ? medicalConditions : [];
      
      if (Object.keys(medicalProfileUpdate).length > 0) {
        updateData.MedicalProfile = medicalProfileUpdate;
      }

      // Upsert medical info
      const medicalDoc = await db.collection('MedicalInfo').doc(userID).get();
      if (medicalDoc.exists) {
        // Merge with existing MedicalProfile
        const existingData = medicalDoc.data();
        if (updateData.MedicalProfile && existingData.MedicalProfile) {
          updateData.MedicalProfile = {
            ...existingData.MedicalProfile,
            ...updateData.MedicalProfile
          };
        }
        await db.collection('MedicalInfo').doc(userID).update(updateData);
      } else {
        await db.collection('MedicalInfo').doc(userID).set({
          UserID: userID,
          PersonalInfo: { Name: '', Gender: '', Address: '' },
          EmergencyContact: { Primary: null, Secondary: [] },
          MedicalProfile: {
            BloodType: bloodType || null,
            MedicalConditions: medicalConditions || []
          },
          Allergies: [],
          Medications: [],
          Surgeries: [],
          CreatedAt: new Date(),
          UpdatedAt: new Date()
        });
      }

      // Get updated data
      const updatedDoc = await db.collection('MedicalInfo').doc(userID).get();

      return {
        success: true,
        message: 'Medical profile updated successfully',
        data: {
          bloodType: updatedDoc.data().MedicalProfile?.BloodType || null,
          medicalConditions: updatedDoc.data().MedicalProfile?.MedicalConditions || [],
          updatedAt: updatedDoc.data().UpdatedAt
        }
      };
    } catch (error) {
      console.error('Update medical profile error:', error);
      return { success: false, error: 'Server Error', message: error.message, code: 500 };
    }
  }

  /**
   * Update Allergies section
   * Fields: allergies (array of { allergyType, severity, notes })
   * Writes to: MedicalInfo collection (upsert)
   * @param {string} userID - User ID
   * @param {Object} data - Allergies data
   * @returns {Object} - Update result
   */
  async updateAllergies(userID, data) {
    const db = getFirestore();

    try {
      const userResult = await authService.getUserById(userID);
      if (!userResult.exists) {
        return { success: false, error: 'Not Found', message: 'User not found', code: 404 };
      }

      const { allergies } = data;

      const updateData = { UpdatedAt: new Date() };
      
      if (allergies !== undefined) {
        updateData.Allergies = Array.isArray(allergies) 
          ? allergies.map(a => ({
              AllergyType: a.allergyType || '',
              Severity: a.severity || '',
              Notes: a.notes || ''
            }))
          : [];
      }

      // Upsert medical info
      const medicalDoc = await db.collection('MedicalInfo').doc(userID).get();
      if (medicalDoc.exists) {
        await db.collection('MedicalInfo').doc(userID).update(updateData);
      } else {
        await db.collection('MedicalInfo').doc(userID).set({
          UserID: userID,
          PersonalInfo: { Name: '', Gender: '', Address: '' },
          EmergencyContact: { Primary: null, Secondary: [] },
          MedicalProfile: { BloodType: null, MedicalConditions: [] },
          Allergies: updateData.Allergies || [],
          Medications: [],
          Surgeries: [],
          CreatedAt: new Date(),
          UpdatedAt: new Date()
        });
      }

      // Get updated data
      const updatedDoc = await db.collection('MedicalInfo').doc(userID).get();

      return {
        success: true,
        message: 'Allergies updated successfully',
        data: Array.isArray(updatedDoc.data().Allergies) 
          ? updatedDoc.data().Allergies.map(a => ({
              allergyType: a.AllergyType || '',
              severity: a.Severity || '',
              notes: a.Notes || ''
            }))
          : [],
        count: updatedDoc.data().Allergies ? updatedDoc.data().Allergies.length : 0,
        updatedAt: updatedDoc.data().UpdatedAt
      };
    } catch (error) {
      console.error('Update allergies error:', error);
      return { success: false, error: 'Server Error', message: error.message, code: 500 };
    }
  }

  /**
   * Update Medications section
   * Fields: medications (array of { medicationName, dosage, schedule, notes })
   * Writes to: MedicalInfo collection (upsert)
   * @param {string} userID - User ID
   * @param {Object} data - Medications data
   * @returns {Object} - Update result
   */
  async updateMedications(userID, data) {
    const db = getFirestore();

    try {
      const userResult = await authService.getUserById(userID);
      if (!userResult.exists) {
        return { success: false, error: 'Not Found', message: 'User not found', code: 404 };
      }

      const { medications } = data;

      const updateData = { UpdatedAt: new Date() };
      
      if (medications !== undefined) {
        updateData.Medications = Array.isArray(medications) 
          ? medications.map(m => ({
              MedicationName: m.medicationName || '',
              Dosage: m.dosage || '',
              Schedule: m.schedule || '',
              Notes: m.notes || ''
            }))
          : [];
      }

      // Upsert medical info
      const medicalDoc = await db.collection('MedicalInfo').doc(userID).get();
      if (medicalDoc.exists) {
        await db.collection('MedicalInfo').doc(userID).update(updateData);
      } else {
        await db.collection('MedicalInfo').doc(userID).set({
          UserID: userID,
          PersonalInfo: { Name: '', Gender: '', Address: '' },
          EmergencyContact: { Primary: null, Secondary: [] },
          MedicalProfile: { BloodType: null, MedicalConditions: [] },
          Allergies: [],
          Medications: updateData.Medications || [],
          Surgeries: [],
          CreatedAt: new Date(),
          UpdatedAt: new Date()
        });
      }

      // Get updated data
      const updatedDoc = await db.collection('MedicalInfo').doc(userID).get();

      return {
        success: true,
        message: 'Medications updated successfully',
        data: Array.isArray(updatedDoc.data().Medications) 
          ? updatedDoc.data().Medications.map(m => ({
              medicationName: m.MedicationName || '',
              dosage: m.Dosage || '',
              schedule: m.Schedule || '',
              notes: m.Notes || ''
            }))
          : [],
        count: updatedDoc.data().Medications ? updatedDoc.data().Medications.length : 0,
        updatedAt: updatedDoc.data().UpdatedAt
      };
    } catch (error) {
      console.error('Update medications error:', error);
      return { success: false, error: 'Server Error', message: error.message, code: 500 };
    }
  }

  /**
   * Update Surgeries section
   * Fields: surgeries (array of { surgeryName, surgeryDate, notes })
   * Writes to: MedicalInfo collection (upsert)
   * @param {string} userID - User ID
   * @param {Object} data - Surgeries data
   * @returns {Object} - Update result
   */
  async updateSurgeries(userID, data) {
    const db = getFirestore();

    try {
      const userResult = await authService.getUserById(userID);
      if (!userResult.exists) {
        return { success: false, error: 'Not Found', message: 'User not found', code: 404 };
      }

      const { surgeries } = data;

      const updateData = { UpdatedAt: new Date() };
      
      if (surgeries !== undefined) {
        updateData.Surgeries = Array.isArray(surgeries) 
          ? surgeries.map(s => ({
              SurgeryName: s.surgeryName || '',
              SurgeryDate: s.surgeryDate || null,
              Notes: s.notes || ''
            }))
          : [];
      }

      // Upsert medical info
      const medicalDoc = await db.collection('MedicalInfo').doc(userID).get();
      if (medicalDoc.exists) {
        await db.collection('MedicalInfo').doc(userID).update(updateData);
      } else {
        await db.collection('MedicalInfo').doc(userID).set({
          UserID: userID,
          PersonalInfo: { Name: '', Gender: '', Address: '' },
          EmergencyContact: { Primary: null, Secondary: [] },
          MedicalProfile: { BloodType: null, MedicalConditions: [] },
          Allergies: [],
          Medications: [],
          Surgeries: updateData.Surgeries || [],
          CreatedAt: new Date(),
          UpdatedAt: new Date()
        });
      }

      // Get updated data
      const updatedDoc = await db.collection('MedicalInfo').doc(userID).get();

      return {
        success: true,
        message: 'Surgeries updated successfully',
        data: Array.isArray(updatedDoc.data().Surgeries) 
          ? updatedDoc.data().Surgeries.map(s => ({
              surgeryName: s.SurgeryName || '',
              surgeryDate: s.SurgeryDate || null,
              notes: s.Notes || ''
            }))
          : [],
        count: updatedDoc.data().Surgeries ? updatedDoc.data().Surgeries.length : 0,
        updatedAt: updatedDoc.data().UpdatedAt
      };
    } catch (error) {
      console.error('Update surgeries error:', error);
      return { success: false, error: 'Server Error', message: error.message, code: 500 };
    }
  }

  // ─── Helper Methods ───────────────────────────────────────────────

  /**
   * Count items in an array
   * @param {Array} arr - Array to count
   * @returns {number} - Item count
   */
  _countItems(arr) {
    if (!arr || !Array.isArray(arr)) return 0;
    return arr.length;
  }
}

module.exports = new MedicalProfileService();
