const { getFirestore } = require('../config/firebase');
const authService = require('./authService');

/**
 * Medical Service - Handles medical information database operations
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
        bloodType, 
        height, 
        weight, 
        chronicDiseases, 
        allergies, 
        medications, 
        surgeries, 
        notes, 
        emergencyInstructions 
      } = medicalInfo;

      // Create medical info document
      const medicalData = {
        UserID: userID,
        BloodType: bloodType,
        Height: parseFloat(height),
        Weight: parseFloat(weight),
        ChronicDiseases: chronicDiseases || '',
        Allergies: allergies || '',
        Medications: medications || '',
        Surgeries: surgeries || '',
        Notes: notes || '',
        EmergencyInstructions: emergencyInstructions || '',
        CreatedAt: new Date(),
        UpdatedAt: new Date()
      };

      await db.collection('MedicalInfo').doc(userID).set(medicalData);

      // Log security event
      await authService.logSecurityEvent(userID, 'MEDICAL_INFO_CREATED', {});

      return {
        success: true,
        message: 'Medical information created successfully',
        data: {
          userID,
          bloodType: medicalData.BloodType,
          height: medicalData.Height,
          weight: medicalData.Weight,
          chronicDiseases: medicalData.ChronicDiseases,
          allergies: medicalData.Allergies,
          medications: medicalData.Medications,
          surgeries: medicalData.Surgeries,
          notes: medicalData.Notes,
          emergencyInstructions: medicalData.EmergencyInstructions,
          createdAt: medicalData.CreatedAt
        }
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
        bloodType, 
        height, 
        weight, 
        chronicDiseases, 
        allergies, 
        medications, 
        surgeries, 
        notes, 
        emergencyInstructions 
      } = medicalInfo;

      // Prepare update data
      const updateData = {
        UpdatedAt: new Date()
      };

      if (bloodType !== undefined) updateData.BloodType = bloodType;
      if (height !== undefined) updateData.Height = parseFloat(height);
      if (weight !== undefined) updateData.Weight = parseFloat(weight);
      if (chronicDiseases !== undefined) updateData.ChronicDiseases = chronicDiseases;
      if (allergies !== undefined) updateData.Allergies = allergies;
      if (medications !== undefined) updateData.Medications = medications;
      if (surgeries !== undefined) updateData.Surgeries = surgeries;
      if (notes !== undefined) updateData.Notes = notes;
      if (emergencyInstructions !== undefined) updateData.EmergencyInstructions = emergencyInstructions;

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
        data: {
          userID,
          bloodType: updatedData.BloodType,
          height: updatedData.Height,
          weight: updatedData.Weight,
          chronicDiseases: updatedData.ChronicDiseases,
          allergies: updatedData.Allergies,
          medications: updatedData.Medications,
          surgeries: updatedData.Surgeries,
          notes: updatedData.Notes,
          emergencyInstructions: updatedData.EmergencyInstructions,
          updatedAt: updatedData.UpdatedAt
        }
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
        data: {
          userID,
          bloodType: medicalData.BloodType,
          height: medicalData.Height,
          weight: medicalData.Weight,
          chronicDiseases: medicalData.ChronicDiseases,
          allergies: medicalData.Allergies,
          medications: medicalData.Medications,
          surgeries: medicalData.Surgeries,
          notes: medicalData.Notes,
          emergencyInstructions: medicalData.EmergencyInstructions,
          createdAt: medicalData.CreatedAt,
          updatedAt: medicalData.UpdatedAt
        }
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
}

module.exports = new MedicalService();
