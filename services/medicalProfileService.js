const { getFirestore } = require('../config/firebase');
const authService = require('./authService');

/**
 * Medical Profile Service - Handles the Medical Profile screen
 * Aggregates data from: Users, MedicalInfo, EmergencyContacts
 * Provides section-by-section updates for:
 *   - General Information (name, DOB, blood type, gender)
 *   - Medical Conditions (chronic diseases)
 *   - Allergies
 *   - Current Medications
 *   - Surgical History
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
      // Fetch user + medical + contacts in parallel
      const [userDoc, medicalDoc, contactsQuery] = await Promise.all([
        db.collection('Users').doc(userID).get(),
        db.collection('MedicalInfo').doc(userID).get(),
        db.collection('EmergencyContacts')
          .where('UserID', '==', userID)
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
      const medicalData = medicalDoc.exists ? medicalDoc.data() : null;

      // --- Build user header ---
      const userHeader = {
        Username: userData.Username || userData.FullName || '',
        PhotoURL: userData.PhotoURL || null,
        UpdatedAt: medicalData?.UpdatedAt || userData.UpdatedAt || null
      };

      // --- Quick stats ---
      const bloodType = medicalData?.BloodType || null;

      const quickStats = {
        BloodType: bloodType,
        AllergiesCount: medicalData?.AllergiesList ? medicalData.AllergiesList.length : 0,
        MedicationsCount: medicalData?.MedicationsList ? medicalData.MedicationsList.length : 0
      };

      // --- Sections with completion status ---
      const sections = {
        generalInformation: {
          completed: !!(medicalData?.BloodType && (userData.DateOfBirth || userData.Username)),
          summary: this._buildGeneralSummary(userData, medicalData),
          data: {
            Username: userData.Username || userData.FullName || '',
            DateOfBirth: userData.DateOfBirth || null,
            Gender: userData.Gender || null,
            BloodType: medicalData?.BloodType || null,
            Height: medicalData?.Height || null,
            Weight: medicalData?.Weight || null,
            NationalID: userData.NationalID || null,
            PhoneNumber: userData.PhoneNumber || null
          }
        },
        medicalConditions: {
          completed: !!(medicalData?.MedicalConditions && medicalData.MedicalConditions.length > 0) || !!(medicalData?.ChronicDiseases && medicalData.ChronicDiseases.trim() !== ''),
          summary: medicalData?.MedicalConditions ? medicalData.MedicalConditions.join(', ') : (medicalData?.ChronicDiseases || ''),
          count: medicalData?.MedicalConditions ? medicalData.MedicalConditions.length : this._countItems(medicalData?.ChronicDiseases),
          data: {
            MedicalConditions: medicalData?.MedicalConditions || (medicalData?.ChronicDiseases ? medicalData.ChronicDiseases.split(',').map(s => s.trim()) : []),
            Notes: medicalData?.Notes || ''
          }
        },
        allergies: {
          completed: !!(medicalData?.AllergiesList && medicalData.AllergiesList.length > 0) || medicalData?.HasAllergies === false,
          hasAllergies: medicalData?.HasAllergies !== false,
          summary: medicalData?.AllergiesList ? `${medicalData.AllergiesList.length} allergies` : '',
          count: medicalData?.AllergiesList ? medicalData.AllergiesList.length : 0,
          data: {
            HasAllergies: medicalData?.HasAllergies,
            AllergiesList: medicalData?.AllergiesList || []
          }
        },
        currentMedications: {
          completed: !!(medicalData?.MedicationsList && medicalData.MedicationsList.length > 0) || medicalData?.HasMedications === false,
          hasMedications: medicalData?.HasMedications !== false,
          summary: medicalData?.MedicationsList ? `${medicalData.MedicationsList.length} medications` : '',
          count: medicalData?.MedicationsList ? medicalData.MedicationsList.length : 0,
          data: {
            HasMedications: medicalData?.HasMedications,
            MedicationsList: medicalData?.MedicationsList || []
          }
        },
        surgicalHistory: {
          completed: !!(medicalData?.SurgeriesList && medicalData.SurgeriesList.length > 0) || medicalData?.HasSurgeries === false,
          hasSurgeries: medicalData?.HasSurgeries !== false, // Default to true if not explicitly false
          summary: medicalData?.SurgeriesList ? `${medicalData.SurgeriesList.length} procedures` : '',
          count: medicalData?.SurgeriesList ? medicalData.SurgeriesList.length : 0,
          data: {
            HasSurgeries: medicalData?.HasSurgeries,
            SurgeriesList: medicalData?.SurgeriesList || []
          }
        }
      };

      // --- Profile completion % ---
      const completionFields = [
        userData.Username || userData.FullName,          // name
        userData.DateOfBirth,                             // DOB
        userData.Gender,                                 // gender
        medicalData?.BloodType,                          // blood type
        medicalData?.Height,                             // height
        medicalData?.Weight,                             // weight
        (medicalData?.MedicalConditions && medicalData.MedicalConditions.length > 0) || (medicalData?.ChronicDiseases ? medicalData.ChronicDiseases.trim() !== '' : null), // conditions
        (medicalData?.AllergiesList && medicalData.AllergiesList.length > 0) || medicalData?.HasAllergies === false ? true : null, // allergies
        (medicalData?.MedicationsList && medicalData.MedicationsList.length > 0) || medicalData?.HasMedications === false ? true : null, // medications
        (medicalData?.SurgeriesList && medicalData.SurgeriesList.length > 0) || medicalData?.HasSurgeries === false ? true : null, // surgeries
        medicalData?.EmergencyInstructions,              // emergency instructions
        userData.PhoneNumber,                            // phone
        userData.NationalID,                             // national ID
        contactsQuery.size > 0 ? true : null             // emergency contacts
      ];

      const filledCount = completionFields.filter(f => f !== null && f !== undefined && f !== '').length;
      const profileCompletion = Math.round((filledCount / completionFields.length) * 100);

      // --- Emergency contacts count ---
      const emergencyContactsCount = contactsQuery.size;

      return {
        success: true,
        data: {
          userHeader,
          profileCompletion,
          quickStats,
          sections,
          emergencyContactsCount,
          emergencyInstructions: medicalData?.EmergencyInstructions || ''
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
   * Update General Information section
   * Fields: Username, DateOfBirth, Gender, BloodType, Height, Weight, NationalID, PhoneNumber
   * Writes to: Users + MedicalInfo collections
   * @param {string} userID - User ID
   * @param {Object} data - General info data
   * @returns {Object} - Update result
   */
  async updateGeneralInfo(userID, data) {
    const db = getFirestore();

    try {
      const userResult = await authService.getUserById(userID);
      if (!userResult.exists) {
        return { success: false, error: 'Not Found', message: 'User not found', code: 404 };
      }

      const {
        Username, DateOfBirth, Gender, BloodType,
        Height, Weight, NationalID, PhoneNumber, MedicalConditions
      } = data;

      // Update Users collection fields
      const userUpdate = { UpdatedAt: new Date() };
      if (Username !== undefined) { userUpdate.Username = Username; userUpdate.FullName = Username; }
      if (DateOfBirth !== undefined) userUpdate.DateOfBirth = DateOfBirth;
      if (Gender !== undefined) userUpdate.Gender = Gender;
      if (NationalID !== undefined) userUpdate.NationalID = NationalID;
      if (PhoneNumber !== undefined) userUpdate.PhoneNumber = PhoneNumber;

      await db.collection('Users').doc(userID).update(userUpdate);

      // Update MedicalInfo collection fields (upsert)
      const medicalUpdate = { UpdatedAt: new Date() };
      if (BloodType !== undefined) medicalUpdate.BloodType = BloodType;
      if (Height !== undefined) medicalUpdate.Height = parseFloat(Height);
      if (Weight !== undefined) medicalUpdate.Weight = parseFloat(Weight);
      if (MedicalConditions !== undefined) medicalUpdate.MedicalConditions = MedicalConditions;

      // Check if medical doc exists -> create or update
      const medicalDoc = await db.collection('MedicalInfo').doc(userID).get();
      if (medicalDoc.exists) {
        await db.collection('MedicalInfo').doc(userID).update(medicalUpdate);
      } else {
        await db.collection('MedicalInfo').doc(userID).set({
          UserID: userID,
          BloodType: BloodType || '',
          Height: Height ? parseFloat(Height) : 0,
          Weight: Weight ? parseFloat(Weight) : 0,
          ChronicDiseases: '',
          Allergies: '',
          Medications: '',
          Surgeries: '',
          Notes: '',
          EmergencyInstructions: '',
          CreatedAt: new Date(),
          UpdatedAt: new Date()
        });
      }

      return {
        success: true,
        message: 'General information updated successfully',
        data: {
          ...userUpdate,
          ...medicalUpdate
        }
      };
    } catch (error) {
      console.error('Update general info error:', error);
      return { success: false, error: 'Server Error', message: error.message, code: 500 };
    }
  }

  /**
   * Update Medical Conditions section
   * Fields: ChronicDiseases, Notes
   * Writes to: MedicalInfo collection (upsert)
   * @param {string} userID - User ID
   * @param {Object} data - Conditions data
   * @returns {Object} - Update result
   */
  async updateConditions(userID, data) {
    const db = getFirestore();

    try {
      const userResult = await authService.getUserById(userID);
      if (!userResult.exists) {
        return { success: false, error: 'Not Found', message: 'User not found', code: 404 };
      }

      const { ChronicDiseases, Notes } = data;

      const updateData = { UpdatedAt: new Date() };
      if (ChronicDiseases !== undefined) updateData.ChronicDiseases = ChronicDiseases;
      if (Notes !== undefined) updateData.Notes = Notes;

      // Upsert medical info
      const medicalDoc = await db.collection('MedicalInfo').doc(userID).get();
      if (medicalDoc.exists) {
        await db.collection('MedicalInfo').doc(userID).update(updateData);
      } else {
        await db.collection('MedicalInfo').doc(userID).set({
          UserID: userID,
          BloodType: '',
          Height: 0,
          Weight: 0,
          ChronicDiseases: ChronicDiseases || '',
          Allergies: '',
          Medications: '',
          Surgeries: '',
          Notes: Notes || '',
          EmergencyInstructions: '',
          CreatedAt: new Date(),
          UpdatedAt: new Date()
        });
      }

      // Get updated data
      const updatedDoc = await db.collection('MedicalInfo').doc(userID).get();

      return {
        success: true,
        message: 'Medical conditions updated successfully',
        data: {
          ChronicDiseases: updatedDoc.data().ChronicDiseases,
          Notes: updatedDoc.data().Notes,
          count: this._countItems(updatedDoc.data().ChronicDiseases),
          UpdatedAt: updatedDoc.data().UpdatedAt
        }
      };
    } catch (error) {
      console.error('Update conditions error:', error);
      return { success: false, error: 'Server Error', message: error.message, code: 500 };
    }
  }

  /**
   * Update Allergies section
   * Fields: HasAllergies (boolean), AllergiesList (array of objects with type, severity)
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

      const { HasAllergies, AllergiesList } = data;

      const updateData = { UpdatedAt: new Date() };
      
      if (HasAllergies !== undefined) {
        updateData.HasAllergies = HasAllergies;
      }

      if (AllergiesList && Array.isArray(AllergiesList)) {
        updateData.AllergiesList = AllergiesList.map(a => ({
          type: a.type || '',
          severity: a.severity || ''
        }));
      } else if (HasAllergies === false) {
        updateData.AllergiesList = [];
      }

      const medicalDoc = await db.collection('MedicalInfo').doc(userID).get();
      if (medicalDoc.exists) {
        await db.collection('MedicalInfo').doc(userID).update(updateData);
      } else {
        await db.collection('MedicalInfo').doc(userID).set({
          UserID: userID,
          BloodType: '',
          Height: 0,
          Weight: 0,
          ChronicDiseases: '',
          HasAllergies: HasAllergies !== undefined ? HasAllergies : true,
          AllergiesList: updateData.AllergiesList || [],
          Medications: '',
          Surgeries: '',
          Notes: '',
          EmergencyInstructions: '',
          CreatedAt: new Date(),
          UpdatedAt: new Date()
        });
      }

      const updatedDoc = await db.collection('MedicalInfo').doc(userID).get();

      return {
        success: true,
        message: 'Allergies updated successfully',
        data: {
          HasAllergies: updatedDoc.data().HasAllergies,
          AllergiesList: updatedDoc.data().AllergiesList,
          count: updatedDoc.data().AllergiesList ? updatedDoc.data().AllergiesList.length : 0,
          UpdatedAt: updatedDoc.data().UpdatedAt
        }
      };
    } catch (error) {
      console.error('Update allergies error:', error);
      return { success: false, error: 'Server Error', message: error.message, code: 500 };
    }
  }

  /**
   * Update Current Medications section
   * Fields: HasMedications (boolean), MedicationsList (array of objects with name, dosage, schedule)
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

      const { HasMedications, MedicationsList } = data;

      const updateData = { UpdatedAt: new Date() };
      
      if (HasMedications !== undefined) {
        updateData.HasMedications = HasMedications;
      }

      if (MedicationsList && Array.isArray(MedicationsList)) {
        updateData.MedicationsList = MedicationsList.map(m => ({
          name: m.name || '',
          dosage: m.dosage || '',
          schedule: m.schedule || ''
        }));
      } else if (HasMedications === false) {
        updateData.MedicationsList = [];
      }

      const medicalDoc = await db.collection('MedicalInfo').doc(userID).get();
      if (medicalDoc.exists) {
        await db.collection('MedicalInfo').doc(userID).update(updateData);
      } else {
        await db.collection('MedicalInfo').doc(userID).set({
          UserID: userID,
          BloodType: '',
          Height: 0,
          Weight: 0,
          ChronicDiseases: '',
          HasAllergies: true,
          AllergiesList: [],
          HasMedications: HasMedications !== undefined ? HasMedications : true,
          MedicationsList: updateData.MedicationsList || [],
          Surgeries: '',
          Notes: '',
          EmergencyInstructions: '',
          CreatedAt: new Date(),
          UpdatedAt: new Date()
        });
      }

      const updatedDoc = await db.collection('MedicalInfo').doc(userID).get();

      return {
        success: true,
        message: 'Medications updated successfully',
        data: {
          HasMedications: updatedDoc.data().HasMedications,
          MedicationsList: updatedDoc.data().MedicationsList,
          count: updatedDoc.data().MedicationsList ? updatedDoc.data().MedicationsList.length : 0,
          UpdatedAt: updatedDoc.data().UpdatedAt
        }
      };
    } catch (error) {
      console.error('Update medications error:', error);
      return { success: false, error: 'Server Error', message: error.message, code: 500 };
    }
  }

  /**
   * Update Surgical History section
   * Fields: HasSurgeries (boolean), SurgeriesList (array of objects with type, date, notes)
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

      const { HasSurgeries, SurgeriesList } = data;

      const updateData = { UpdatedAt: new Date() };
      
      if (HasSurgeries !== undefined) {
        updateData.HasSurgeries = HasSurgeries;
      }
      
      if (SurgeriesList && Array.isArray(SurgeriesList)) {
        // Sanitize objects
        updateData.SurgeriesList = SurgeriesList.map(s => ({
          type: s.type || '',
          date: s.date || '',
          notes: s.notes || ''
        }));
      } else if (HasSurgeries === false) {
        // If explicitly no surgeries, clear the list
        updateData.SurgeriesList = [];
      }

      const medicalDoc = await db.collection('MedicalInfo').doc(userID).get();
      if (medicalDoc.exists) {
        await db.collection('MedicalInfo').doc(userID).update(updateData);
      } else {
        await db.collection('MedicalInfo').doc(userID).set({
          UserID: userID,
          BloodType: '',
          Height: 0,
          Weight: 0,
          ChronicDiseases: '',
          Allergies: '',
          Medications: '',
          HasSurgeries: HasSurgeries !== undefined ? HasSurgeries : true,
          SurgeriesList: updateData.SurgeriesList || [],
          Notes: '',
          EmergencyInstructions: '',
          CreatedAt: new Date(),
          UpdatedAt: new Date()
        });
      }

      const updatedDoc = await db.collection('MedicalInfo').doc(userID).get();

      return {
        success: true,
        message: 'Surgical history updated successfully',
        data: {
          HasSurgeries: updatedDoc.data().HasSurgeries,
          SurgeriesList: updatedDoc.data().SurgeriesList,
          count: updatedDoc.data().SurgeriesList ? updatedDoc.data().SurgeriesList.length : 0,
          UpdatedAt: updatedDoc.data().UpdatedAt
        }
      };
    } catch (error) {
      console.error('Update surgeries error:', error);
      return { success: false, error: 'Server Error', message: error.message, code: 500 };
    }
  }

  /**
   * Update Emergency Instructions
   * @param {string} userID - User ID
   * @param {Object} data - Emergency instructions data
   * @returns {Object} - Update result
   */
  async updateEmergencyInstructions(userID, data) {
    const db = getFirestore();

    try {
      const userResult = await authService.getUserById(userID);
      if (!userResult.exists) {
        return { success: false, error: 'Not Found', message: 'User not found', code: 404 };
      }

      const { EmergencyInstructions } = data;

      const updateData = { UpdatedAt: new Date() };
      if (EmergencyInstructions !== undefined) updateData.EmergencyInstructions = EmergencyInstructions;

      const medicalDoc = await db.collection('MedicalInfo').doc(userID).get();
      if (medicalDoc.exists) {
        await db.collection('MedicalInfo').doc(userID).update(updateData);
      } else {
        await db.collection('MedicalInfo').doc(userID).set({
          UserID: userID,
          BloodType: '',
          Height: 0,
          Weight: 0,
          ChronicDiseases: '',
          Allergies: '',
          Medications: '',
          Surgeries: '',
          Notes: '',
          EmergencyInstructions: EmergencyInstructions || '',
          CreatedAt: new Date(),
          UpdatedAt: new Date()
        });
      }

      return {
        success: true,
        message: 'Emergency instructions updated successfully',
        data: {
          EmergencyInstructions: EmergencyInstructions || '',
          UpdatedAt: new Date()
        }
      };
    } catch (error) {
      console.error('Update emergency instructions error:', error);
      return { success: false, error: 'Server Error', message: error.message, code: 500 };
    }
  }

  // ─── Helper Methods ───────────────────────────────────────────────

  /**
   * Count comma-separated items in a string
   * @param {string} str - Comma-separated string
   * @returns {number} - Item count
   */
  _countItems(str) {
    if (!str || typeof str !== 'string' || str.trim() === '') return 0;
    return str.split(',').filter(item => item.trim() !== '').length;
  }

  /**
   * Build general information summary for the card
   * Example: "A+ • March 15, 1985"
   * @param {Object} userData - User data
   * @param {Object} medicalData - Medical data
   * @returns {string} - Summary line
   */
  _buildGeneralSummary(userData, medicalData) {
    const parts = [];
    if (medicalData?.BloodType) parts.push(medicalData.BloodType);
    if (userData.DateOfBirth) {
      try {
        const dob = new Date(userData.DateOfBirth);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        parts.push(dob.toLocaleDateString('en-US', options));
      } catch (e) {
        parts.push(userData.DateOfBirth);
      }
    }
    return parts.join(' • ') || 'Not set';
  }
}

module.exports = new MedicalProfileService();
