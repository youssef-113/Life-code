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
          completed: !!(medicalData?.HasAllergies === true || (medicalData?.Allergies && medicalData.Allergies.length > 0)),
          hasAllergies: medicalData?.HasAllergies || false,
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
          completed: !!(medicalData?.HasMedications === true || (medicalData?.Medications && medicalData.Medications.length > 0)),
          hasMedications: medicalData?.HasMedications || false,
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
          completed: !!(medicalData?.HasSurgeries === true || (medicalData?.Surgeries && medicalData.Surgeries.length > 0)),
          hasSurgeries: medicalData?.HasSurgeries || false,
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
   * Fields: hasAllergies (boolean), allergies (array of { allergyType, severity, notes })
   * - If hasAllergies is true: save allergies array (can be empty to add later)
   * - If hasAllergies is false: clear allergies and set flag to false
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

      const { hasAllergies, allergies } = data;

      const updateData = { UpdatedAt: new Date() };

      // Handle hasAllergies flag
      if (hasAllergies !== undefined) {
        updateData.HasAllergies = hasAllergies === true;

        // If user clicked "No" (hasAllergies = false), clear the allergies list
        if (hasAllergies === false) {
          updateData.Allergies = [];
        }
      }

      // Handle allergies array (only if hasAllergies is true or not specified)
      if (allergies !== undefined && hasAllergies !== false) {
        updateData.Allergies = Array.isArray(allergies) 
          ? allergies.map(a => ({
              AllergyType: a.allergyType || '',
              Severity: a.severity || '',
              Notes: a.notes || ''
            }))
          : [];
        // Auto-set HasAllergies if allergies array has items
        if (updateData.Allergies.length > 0 && hasAllergies === undefined) {
          updateData.HasAllergies = true;
        }
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
          HasAllergies: updateData.HasAllergies || false,
          Allergies: updateData.Allergies || [],
          HasMedications: false,
          Medications: [],
          HasSurgeries: false,
          Surgeries: [],
          CreatedAt: new Date(),
          UpdatedAt: new Date()
        });
      }

      // Get updated data
      const updatedDoc = await db.collection('MedicalInfo').doc(userID).get();
      const updatedData = updatedDoc.data();

      return {
        success: true,
        message: hasAllergies === false 
          ? 'Allergies section cleared' 
          : 'Allergies updated successfully',
        data: {
          hasAllergies: updatedData.HasAllergies || false,
          allergies: Array.isArray(updatedData.Allergies) 
            ? updatedData.Allergies.map(a => ({
                allergyType: a.AllergyType || '',
                severity: a.Severity || '',
                notes: a.Notes || ''
              }))
            : [],
          count: updatedData.Allergies ? updatedData.Allergies.length : 0,
          updatedAt: updatedData.UpdatedAt
        }
      };
    } catch (error) {
      console.error('Update allergies error:', error);
      return { success: false, error: 'Server Error', message: error.message, code: 500 };
    }
  }

  /**
   * Update Medications section
   * Fields: hasMedications (boolean), medications (array of { medicationName, dosage, schedule, notes })
   * - If hasMedications is true: save medications array (can be empty to add later)
   * - If hasMedications is false: clear medications and set flag to false
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

      const { hasMedications, medications } = data;

      const updateData = { UpdatedAt: new Date() };

      // Handle hasMedications flag
      if (hasMedications !== undefined) {
        updateData.HasMedications = hasMedications === true;

        // If user clicked "No" (hasMedications = false), clear the medications list
        if (hasMedications === false) {
          updateData.Medications = [];
        }
      }

      // Handle medications array (only if hasMedications is true or not specified)
      if (medications !== undefined && hasMedications !== false) {
        updateData.Medications = Array.isArray(medications) 
          ? medications.map(m => ({
              MedicationName: m.medicationName || '',
              Dosage: m.dosage || '',
              Schedule: m.schedule || '',
              Notes: m.notes || ''
            }))
          : [];
        // Auto-set HasMedications if medications array has items
        if (updateData.Medications.length > 0 && hasMedications === undefined) {
          updateData.HasMedications = true;
        }
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
          HasAllergies: false,
          Allergies: [],
          HasMedications: updateData.HasMedications || false,
          Medications: updateData.Medications || [],
          HasSurgeries: false,
          Surgeries: [],
          CreatedAt: new Date(),
          UpdatedAt: new Date()
        });
      }

      // Get updated data
      const updatedDoc = await db.collection('MedicalInfo').doc(userID).get();
      const updatedData = updatedDoc.data();

      return {
        success: true,
        message: hasMedications === false 
          ? 'Medications section cleared' 
          : 'Medications updated successfully',
        data: {
          hasMedications: updatedData.HasMedications || false,
          medications: Array.isArray(updatedData.Medications) 
            ? updatedData.Medications.map(m => ({
                medicationName: m.MedicationName || '',
                dosage: m.Dosage || '',
                schedule: m.Schedule || '',
                notes: m.Notes || ''
              }))
            : [],
          count: updatedData.Medications ? updatedData.Medications.length : 0,
          updatedAt: updatedData.UpdatedAt
        }
      };
    } catch (error) {
      console.error('Update medications error:', error);
      return { success: false, error: 'Server Error', message: error.message, code: 500 };
    }
  }

  /**
   * Update Surgeries section
   * Fields: hasSurgeries (boolean), surgeries (array of { surgeryName, surgeryDate, notes })
   * - If hasSurgeries is true: save surgeries array (can be empty to add later)
   * - If hasSurgeries is false: clear surgeries and set flag to false
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

      const { hasSurgeries, surgeries } = data;

      const updateData = { UpdatedAt: new Date() };

      // Handle hasSurgeries flag
      if (hasSurgeries !== undefined) {
        updateData.HasSurgeries = hasSurgeries === true;

        // If user clicked "No" (hasSurgeries = false), clear the surgeries list
        if (hasSurgeries === false) {
          updateData.Surgeries = [];
        }
      }

      // Handle surgeries array (only if hasSurgeries is true or not specified)
      if (surgeries !== undefined && hasSurgeries !== false) {
        updateData.Surgeries = Array.isArray(surgeries) 
          ? surgeries.map(s => ({
              SurgeryName: s.surgeryName || '',
              SurgeryDate: s.surgeryDate || null,
              Notes: s.notes || ''
            }))
          : [];
        // Auto-set HasSurgeries if surgeries array has items
        if (updateData.Surgeries.length > 0 && hasSurgeries === undefined) {
          updateData.HasSurgeries = true;
        }
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
          HasAllergies: false,
          Allergies: [],
          HasMedications: false,
          Medications: [],
          HasSurgeries: updateData.HasSurgeries || false,
          Surgeries: updateData.Surgeries || [],
          CreatedAt: new Date(),
          UpdatedAt: new Date()
        });
      }

      // Get updated data
      const updatedDoc = await db.collection('MedicalInfo').doc(userID).get();
      const updatedData = updatedDoc.data();

      return {
        success: true,
        message: hasSurgeries === false 
          ? 'Surgeries section cleared' 
          : 'Surgeries updated successfully',
        data: {
          hasSurgeries: updatedData.HasSurgeries || false,
          surgeries: Array.isArray(updatedData.Surgeries) 
            ? updatedData.Surgeries.map(s => ({
                surgeryName: s.SurgeryName || '',
                surgeryDate: s.SurgeryDate || null,
                notes: s.Notes || ''
              }))
            : [],
          count: updatedData.Surgeries ? updatedData.Surgeries.length : 0,
          updatedAt: updatedData.UpdatedAt
        }
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
