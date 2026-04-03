const { getFirestore } = require('../config/firebase');

/**
 * Profile Completion Service - Calculates user profile completion percentage
 * 
 * Profile Sections and Weights (Total: 100%):
 * - Personal Info (name, gender, address): 15%
 * - Photo: 10%
 * - Emergency Contact (primary): 15%
 * - Medical Profile (blood type, conditions): 15%
 * - Allergies (hasAllergies flag + items): 15%
 * - Medications (hasMedications flag + items): 15%
 * - Surgeries (hasSurgeries flag + items): 15%
 */
class ProfileCompletionService {

  constructor() {
    // Section weights (must sum to 100)
    this.sectionWeights = {
      personalInfo: 15,
      photo: 10,
      emergencyContact: 15,
      medicalProfile: 15,
      allergies: 15,
      medications: 15,
      surgeries: 15
    };
  }

  /**
   * Calculate profile completion percentage for a user
   * @param {string} userID - User ID
   * @returns {Promise<Object>} - Completion percentage and section details
   */
  async calculateCompletion(userID) {
    const db = getFirestore();

    try {
      // Fetch all relevant data in parallel
      const [userDoc, medicalDoc, emergencyContactsQuery] = await Promise.all([
        db.collection('Users').doc(userID).get(),
        db.collection('MedicalInfo').doc(userID).get(),
        db.collection('EmergencyContacts').where('UserID', '==', userID).get()
      ]);

      const userData = userDoc.exists ? userDoc.data() : null;
      const medicalData = medicalDoc.exists ? medicalDoc.data() : null;
      const hasEmergencyContacts = !emergencyContactsQuery.empty;

      // Calculate each section's completion
      const sections = {
        personalInfo: this._calculatePersonalInfoCompletion(medicalData, userData),
        photo: this._calculatePhotoCompletion(userData),
        emergencyContact: this._calculateEmergencyContactCompletion(medicalData, hasEmergencyContacts),
        medicalProfile: this._calculateMedicalProfileCompletion(medicalData),
        allergies: this._calculateAllergiesCompletion(medicalData),
        medications: this._calculateMedicationsCompletion(medicalData),
        surgeries: this._calculateSurgeriesCompletion(medicalData)
      };

      // Calculate weighted total percentage
      let totalPercentage = 0;
      for (const [sectionName, sectionData] of Object.entries(sections)) {
        const weight = this.sectionWeights[sectionName];
        const contribution = (sectionData.percentage / 100) * weight;
        totalPercentage += contribution;
      }

      // Round to nearest integer
      totalPercentage = Math.round(totalPercentage);

      // Determine completion level
      let completionLevel = 'low';
      if (totalPercentage >= 80) completionLevel = 'complete';
      else if (totalPercentage >= 50) completionLevel = 'medium';
      else if (totalPercentage >= 20) completionLevel = 'partial';

      return {
        success: true,
        completionPercentage: totalPercentage,
        completionLevel,
        sections,
        missingFields: this._getMissingFields(sections),
        nextRecommendedStep: this._getNextRecommendedStep(sections)
      };
    } catch (error) {
      console.error('Calculate profile completion error:', error);
      return {
        success: false,
        completionPercentage: 0,
        error: 'Server Error',
        message: error.message
      };
    }
  }

  /**
   * Calculate personal info completion (name, gender, address)
   * @private
   */
  _calculatePersonalInfoCompletion(medicalData, userData) {
    const fields = ['Name', 'Gender', 'Address'];
    const personalInfo = medicalData?.PersonalInfo || {};
    
    let completedFields = 0;
    if (personalInfo.Name || userData?.FullName || userData?.Username) completedFields++;
    if (personalInfo.Gender) completedFields++;
    if (personalInfo.Address) completedFields++;

    const percentage = Math.round((completedFields / fields.length) * 100);
    
    return {
      percentage,
      completed: percentage === 100,
      completedFields,
      totalFields: fields.length,
      missingFields: fields.filter(f => {
        if (f === 'Name') return !(personalInfo.Name || userData?.FullName || userData?.Username);
        return !personalInfo[f];
      })
    };
  }

  /**
   * Calculate photo completion
   * @private
   */
  _calculatePhotoCompletion(userData) {
    const hasPhoto = !!(userData?.PhotoURL);
    
    return {
      percentage: hasPhoto ? 100 : 0,
      completed: hasPhoto,
      hasPhoto
    };
  }

  /**
   * Calculate emergency contact completion
   * @private
   */
  _calculateEmergencyContactCompletion(medicalData, hasEmergencyContacts) {
    const hasPrimaryContact = !!(medicalData?.EmergencyContact?.Primary);
    const hasAnyContact = hasPrimaryContact || hasEmergencyContacts;
    
    return {
      percentage: hasAnyContact ? 100 : 0,
      completed: hasAnyContact,
      hasPrimaryContact,
      hasEmergencyContacts
    };
  }

  /**
   * Calculate medical profile completion (blood type, conditions)
   * @private
   */
  _calculateMedicalProfileCompletion(medicalData) {
    const hasBloodType = !!(medicalData?.MedicalProfile?.BloodType);
    const hasConditions = !!(medicalData?.MedicalProfile?.MedicalConditions?.length > 0);
    
    let percentage = 0;
    if (hasBloodType) percentage += 50;
    if (hasConditions) percentage += 50;
    
    return {
      percentage,
      completed: percentage === 100,
      hasBloodType,
      hasConditions
    };
  }

  /**
   * Calculate allergies completion
   * @private
   */
  _calculateAllergiesCompletion(medicalData) {
    const hasAllergiesFlag = medicalData?.HasAllergies === true;
    const hasAllergiesItems = !!(medicalData?.Allergies?.length > 0);
    
    // If user explicitly set hasAllergies to false, they completed this section
    // If they set it to true, they need at least one item
    let percentage = 0;
    if (hasAllergiesFlag && hasAllergiesItems) {
      percentage = 100;
    } else if (hasAllergiesFlag && !hasAllergiesItems) {
      percentage = 50; // Flag set but no items yet
    } else if (medicalData?.HasAllergies === false) {
      percentage = 100; // Explicitly set to "No allergies"
    }
    
    return {
      percentage,
      completed: percentage === 100,
      hasAllergiesFlag,
      hasAllergiesItems,
      count: medicalData?.Allergies?.length || 0
    };
  }

  /**
   * Calculate medications completion
   * @private
   */
  _calculateMedicationsCompletion(medicalData) {
    const hasMedicationsFlag = medicalData?.HasMedications === true;
    const hasMedicationsItems = !!(medicalData?.Medications?.length > 0);
    
    let percentage = 0;
    if (hasMedicationsFlag && hasMedicationsItems) {
      percentage = 100;
    } else if (hasMedicationsFlag && !hasMedicationsItems) {
      percentage = 50;
    } else if (medicalData?.HasMedications === false) {
      percentage = 100;
    }
    
    return {
      percentage,
      completed: percentage === 100,
      hasMedicationsFlag,
      hasMedicationsItems,
      count: medicalData?.Medications?.length || 0
    };
  }

  /**
   * Calculate surgeries completion
   * @private
   */
  _calculateSurgeriesCompletion(medicalData) {
    const hasSurgeriesFlag = medicalData?.HasSurgeries === true;
    const hasSurgeriesItems = !!(medicalData?.Surgeries?.length > 0);
    
    let percentage = 0;
    if (hasSurgeriesFlag && hasSurgeriesItems) {
      percentage = 100;
    } else if (hasSurgeriesFlag && !hasSurgeriesItems) {
      percentage = 50;
    } else if (medicalData?.HasSurgeries === false) {
      percentage = 100;
    }
    
    return {
      percentage,
      completed: percentage === 100,
      hasSurgeriesFlag,
      hasSurgeriesItems,
      count: medicalData?.Surgeries?.length || 0
    };
  }

  /**
   * Get list of missing fields across all sections
   * @private
   */
  _getMissingFields(sections) {
    const missing = [];
    
    if (sections.personalInfo.percentage < 100) {
      missing.push(...sections.personalInfo.missingFields.map(f => `personalInfo.${f}`));
    }
    if (sections.photo.percentage < 100) missing.push('photo');
    if (sections.emergencyContact.percentage < 100) missing.push('emergencyContact');
    if (sections.medicalProfile.percentage < 100) {
      if (!sections.medicalProfile.hasBloodType) missing.push('medicalProfile.bloodType');
      if (!sections.medicalProfile.hasConditions) missing.push('medicalProfile.conditions');
    }
    if (sections.allergies.percentage < 100) missing.push('allergies');
    if (sections.medications.percentage < 100) missing.push('medications');
    if (sections.surgeries.percentage < 100) missing.push('surgeries');
    
    return missing;
  }

  /**
   * Get next recommended step for user to complete
   * @private
   */
  _getNextRecommendedStep(sections) {
    const steps = [
      { field: sections.personalInfo, name: 'personalInfo', message: 'Complete your personal information' },
      { field: sections.photo, name: 'photo', message: 'Upload a profile photo' },
      { field: sections.emergencyContact, name: 'emergencyContact', message: 'Add an emergency contact' },
      { field: sections.medicalProfile, name: 'medicalProfile', message: 'Add your blood type and medical conditions' },
      { field: sections.allergies, name: 'allergies', message: 'Specify if you have any allergies' },
      { field: sections.medications, name: 'medications', message: 'Add your current medications or confirm none' },
      { field: sections.surgeries, name: 'surgeries', message: 'Add your surgical history or confirm none' }
    ];
    
    const nextStep = steps.find(step => step.field.percentage < 100);
    return nextStep ? nextStep.message : 'Profile complete!';
  }
}

module.exports = new ProfileCompletionService();
