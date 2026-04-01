const { getFirestore } = require('../config/firebase');
const authService = require('./authService');

/**
 * Medical Service - Handles medical information database operations
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
class MedicalService {

  /**
   * Create medical information
   * @param {string} userID - User ID
   * @param {Object} medicalInfo - Medical information data
   * @returns {Object} - Create result
   */
  async createMedicalInfo(userID, medicalInfo) {
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

      // Check if medical info already exists
      const existingDoc = await db.collection('MedicalInfo').doc(userID).get();
      if (existingDoc.exists) {
        return {
          success: false,
          error: 'Conflict',
          message: 'Medical information already exists. Use PUT to update.',
          code: 409
        };
      }

      const { 
        personalInfo, 
        emergencyContact, 
        medicalProfile, 
        allergies, 
        medications, 
        surgeries 
      } = medicalInfo;

      // Create medical info document with new structure
      const medicalData = {
        UserID: userID,
        PersonalInfo: {
          Name: personalInfo?.name || '',
          Gender: personalInfo?.gender || '',
          Address: personalInfo?.address || ''
        },
        EmergencyContact: {
          Primary: emergencyContact?.primary ? {
            FullName: emergencyContact.primary.fullName || '',
            PhoneNumber: emergencyContact.primary.phoneNumber || '',
            Relationship: emergencyContact.primary.relationship || ''
          } : null,
          Secondary: Array.isArray(emergencyContact?.secondary) 
            ? emergencyContact.secondary.map(contact => ({
                FullName: contact.fullName || '',
                PhoneNumber: contact.phoneNumber || '',
                Relationship: contact.relationship || ''
              }))
            : []
        },
        MedicalProfile: {
          BloodType: medicalProfile?.bloodType || null,
          MedicalConditions: Array.isArray(medicalProfile?.medicalConditions) 
            ? medicalProfile.medicalConditions 
            : []
        },
        Allergies: Array.isArray(allergies) 
          ? allergies.map(a => ({
              AllergyType: a.allergyType || '',
              Severity: a.severity || '',
              Notes: a.notes || ''
            }))
          : [],
        Medications: Array.isArray(medications) 
          ? medications.map(m => ({
              MedicationName: m.medicationName || '',
              Dosage: m.dosage || '',
              Schedule: m.schedule || '',
              Notes: m.notes || ''
            }))
          : [],
        Surgeries: Array.isArray(surgeries) 
          ? surgeries.map(s => ({
              SurgeryName: s.surgeryName || '',
              SurgeryDate: s.surgeryDate || null,
              Notes: s.notes || ''
            }))
          : [],
        CreatedAt: new Date(),
        UpdatedAt: new Date()
      };

      await db.collection('MedicalInfo').doc(userID).set(medicalData);

      // Log security event
      await authService.logSecurityEvent(userID, 'MEDICAL_INFO_CREATED', {});

      return {
        success: true,
        message: 'Medical information created successfully',
        data: this._formatResponse(medicalData)
      };
    } catch (error) {
      console.error('Create medical info error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Update medical information
   * @param {string} userID - User ID
   * @param {Object} medicalInfo - Medical information data to update
   * @returns {Object} - Update result
   */
  async updateMedicalInfo(userID, medicalInfo) {
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

      // Check if medical info exists
      const existingDoc = await db.collection('MedicalInfo').doc(userID).get();
      if (!existingDoc.exists) {
        return {
          success: false,
          error: 'Not Found',
          message: 'Medical information not found. Use POST to create.',
          code: 404
        };
      }

      const { 
        personalInfo, 
        emergencyContact, 
        medicalProfile, 
        allergies, 
        medications, 
        surgeries 
      } = medicalInfo;

      // Prepare update data
      const updateData = {
        UpdatedAt: new Date()
      };

      if (personalInfo !== undefined) {
        updateData.PersonalInfo = {
          Name: personalInfo.name || '',
          Gender: personalInfo.gender || '',
          Address: personalInfo.address || ''
        };
      }

      if (emergencyContact !== undefined) {
        updateData.EmergencyContact = {
          Primary: emergencyContact.primary ? {
            FullName: emergencyContact.primary.fullName || '',
            PhoneNumber: emergencyContact.primary.phoneNumber || '',
            Relationship: emergencyContact.primary.relationship || ''
          } : null,
          Secondary: Array.isArray(emergencyContact.secondary) 
            ? emergencyContact.secondary.map(contact => ({
                FullName: contact.fullName || '',
                PhoneNumber: contact.phoneNumber || '',
                Relationship: contact.relationship || ''
              }))
            : []
        };
      }

      if (medicalProfile !== undefined) {
        updateData.MedicalProfile = {
          BloodType: medicalProfile.bloodType || null,
          MedicalConditions: Array.isArray(medicalProfile.medicalConditions) 
            ? medicalProfile.medicalConditions 
            : []
        };
      }

      if (allergies !== undefined) {
        updateData.Allergies = Array.isArray(allergies) 
          ? allergies.map(a => ({
              AllergyType: a.allergyType || '',
              Severity: a.severity || '',
              Notes: a.notes || ''
            }))
          : [];
      }

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

      if (surgeries !== undefined) {
        updateData.Surgeries = Array.isArray(surgeries) 
          ? surgeries.map(s => ({
              SurgeryName: s.surgeryName || '',
              SurgeryDate: s.surgeryDate || null,
              Notes: s.notes || ''
            }))
          : [];
      }

      // Update medical info document
      await db.collection('MedicalInfo').doc(userID).update(updateData);

      // Log security event
      await authService.logSecurityEvent(userID, 'MEDICAL_INFO_UPDATED', {});

      // Get updated data
      const updatedDoc = await db.collection('MedicalInfo').doc(userID).get();
      const updatedData = updatedDoc.data();

      return {
        success: true,
        message: 'Medical information updated successfully',
        data: this._formatResponse(updatedData)
      };
    } catch (error) {
      console.error('Update medical info error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Get medical information
   * @param {string} userID - User ID
   * @returns {Object} - Medical information data
   */
  async getMedicalInfo(userID) {
    const db = getFirestore();
    
    try {
      // Get medical info document
      const medicalDoc = await db.collection('MedicalInfo').doc(userID).get();
      
      if (!medicalDoc.exists) {
        return {
          success: true,
          data: null
        };
      }

      const medicalData = medicalDoc.data();

      return {
        success: true,
        data: this._formatResponse(medicalData)
      };
    } catch (error) {
      console.error('Get medical info error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Format Firestore data to API response format
   * @param {Object} data - Firestore document data
   * @returns {Object} - Formatted response
   */
  _formatResponse(data) {
    return {
      personalInfo: {
        name: data.PersonalInfo?.Name || '',
        gender: data.PersonalInfo?.Gender || '',
        address: data.PersonalInfo?.Address || ''
      },
      emergencyContact: {
        primary: data.EmergencyContact?.Primary ? {
          fullName: data.EmergencyContact.Primary.FullName || '',
          phoneNumber: data.EmergencyContact.Primary.PhoneNumber || '',
          relationship: data.EmergencyContact.Primary.Relationship || ''
        } : null,
        secondary: Array.isArray(data.EmergencyContact?.Secondary) 
          ? data.EmergencyContact.Secondary.map(contact => ({
              fullName: contact.FullName || '',
              phoneNumber: contact.PhoneNumber || '',
              relationship: contact.Relationship || ''
            }))
          : []
      },
      medicalProfile: {
        bloodType: data.MedicalProfile?.BloodType || null,
        medicalConditions: data.MedicalProfile?.MedicalConditions || []
      },
      allergies: Array.isArray(data.Allergies) 
        ? data.Allergies.map(a => ({
            allergyType: a.AllergyType || '',
            severity: a.Severity || '',
            notes: a.Notes || ''
          }))
        : [],
      medications: Array.isArray(data.Medications) 
        ? data.Medications.map(m => ({
            medicationName: m.MedicationName || '',
            dosage: m.Dosage || '',
            schedule: m.Schedule || '',
            notes: m.Notes || ''
          }))
        : [],
      surgeries: Array.isArray(data.Surgeries) 
        ? data.Surgeries.map(s => ({
            surgeryName: s.SurgeryName || '',
            surgeryDate: s.SurgeryDate || null,
            notes: s.Notes || ''
          }))
        : [],
      createdAt: data.CreatedAt,
      updatedAt: data.UpdatedAt
    };
  }
}

module.exports = new MedicalService();
