const { getFirestore } = require('../config/firebase');

class FamilyService {
  /**
   * Get all family profiles for a user account, including "Self"
   * @param {string} accountID - The main user's ID
   * @returns {Object} List of formatted profiles for the UI
   */
  async getFamilyProfiles(accountID) {
    const db = getFirestore();

    try {
      // 1. Fetch Self Profile
      const userDoc = await db.collection('Users').doc(accountID).get();
      const userData = userDoc.exists ? userDoc.data() : {};

      // Fetch Self's MedicalInfo & active Wristbands
      const [selfMed, selfWristbands] = await Promise.all([
        db.collection('MedicalInfo').doc(accountID).get(),
        db.collection('Wristbands')
          .where('UserID', '==', accountID)
          .where('Status', '==', 'active')
          .get()
      ]);

      const selfMedicalData = selfMed.exists ? selfMed.data() : {};
      const selfAge = this._calculateAge(userData.DateOfBirth);
      const selfQRs = selfWristbands.docs.map(doc => doc.data().QRCode);

      const profiles = [{
        id: accountID, // Self uses the actual auth UserID
        ProfileType: 'Main',
        Name: userData.Username || userData.FullName || 'My Profile',
        Relation: 'Self',
        Age: selfAge !== null ? selfAge : 'Unknown',
        BloodType: selfMedicalData.BloodType || 'Unknown',
        QRCode: selfQRs.length > 0 ? selfQRs[0] : null, // Displaying only the primary one in list
        IsChild: false,
        LostChildMode: false
      }];

      // 2. Fetch Family Members
      const familyQuery = await db.collection('FamilyProfiles')
        .where('AccountID', '==', accountID)
        .get();

      // Loop through members and stitch their Medical & Wristband data
      for (const doc of familyQuery.docs) {
        const data = doc.data();
        const profileID = doc.id;

        const [med, wristbands] = await Promise.all([
          db.collection('MedicalInfo').doc(profileID).get(),
          db.collection('Wristbands')
            .where('UserID', '==', profileID)
            .where('Status', '==', 'active')
            .get()
        ]);

        const medicalData = med.exists ? med.data() : {};
        const age = this._calculateAge(data.DateOfBirth);
        const qrs = wristbands.docs.map(w => w.data().QRCode);

        profiles.push({
          id: profileID, // This ID acts as the 'UserID' for all other tables
          ProfileType: 'Dependent',
          Name: data.Name || 'Unknown',
          Relation: data.Relation || 'Dependent',
          Age: age !== null ? age : 'Unknown',
          BloodType: medicalData.BloodType || 'Unknown',
          QRCode: qrs.length > 0 ? qrs[0] : null,
          IsChild: data.IsChild || false,
          LostChildMode: data.LostChildMode || false
        });
      }

      return {
        success: true,
        data: profiles
      };
    } catch (error) {
      console.error('Error fetching family profiles:', error);
      return { success: false, error: 'Server Error', message: error.message, code: 500 };
    }
  }

  /**
   * Add a new family member dependent profile
   * @param {string} accountID - Main user's ID
   * @param {Object} data - Profile details (Name, Relation, DateOfBirth, IsChild)
   */
  async addFamilyMember(accountID, data) {
    const db = getFirestore();

    try {
      const isChild = data.IsChild || false;
      
      const newProfileData = {
        AccountID: accountID,
        Name: data.Name,
        Relation: data.Relation,
        DateOfBirth: data.DateOfBirth || null,
        IsChild: isChild,
        LostChildMode: isChild ? true : false, // Auto-enable for children
        CreatedAt: new Date(),
        UpdatedAt: new Date()
      };

      const docRef = await db.collection('FamilyProfiles').add(newProfileData);

      // Pre-create an empty MedicalInfo doc for them so it joins smoothly
      await db.collection('MedicalInfo').doc(docRef.id).set({
        UserID: docRef.id,
        BloodType: '',
        Height: 0,
        Weight: 0,
        CreatedAt: new Date(),
        UpdatedAt: new Date()
      });

      return {
        success: true,
        message: 'Family member added successfully',
        data: {
          id: docRef.id,
          ...newProfileData
        }
      };
    } catch (error) {
      console.error('Error adding family member:', error);
      return { success: false, error: 'Server Error', message: error.message, code: 500 };
    }
  }

  /**
   * Update a family member's profile info
   */
  async updateFamilyMember(accountID, profileID, data) {
    const db = getFirestore();

    try {
      const docRef = db.collection('FamilyProfiles').doc(profileID);
      const doc = await docRef.get();

      if (!doc.exists || doc.data().AccountID !== accountID) {
        return { success: false, error: 'Not Found', message: 'Family member not found or unauthorized', code: 404 };
      }

      const updateData = { UpdatedAt: new Date() };
      if (data.Name !== undefined) updateData.Name = data.Name;
      if (data.Relation !== undefined) updateData.Relation = data.Relation;
      if (data.DateOfBirth !== undefined) updateData.DateOfBirth = data.DateOfBirth;
      if (data.IsChild !== undefined) updateData.IsChild = data.IsChild;
      if (data.LostChildMode !== undefined) updateData.LostChildMode = data.LostChildMode;

      await docRef.update(updateData);

      return {
        success: true,
        message: 'Family member updated',
        data: { id: profileID, ...updateData }
      };
    } catch (error) {
      console.error('Error updating family member:', error);
      return { success: false, error: 'Server Error', message: error.message, code: 500 };
    }
  }

  /**
   * Delete a family member & cascade delete their attached records
   */
  async deleteFamilyMember(accountID, profileID) {
    const db = getFirestore();

    try {
      const docRef = db.collection('FamilyProfiles').doc(profileID);
      const doc = await docRef.get();

      if (!doc.exists || doc.data().AccountID !== accountID) {
        return { success: false, error: 'Not Found', message: 'Family member not found or unauthorized', code: 404 };
      }

      // Delete the family profile
      await docRef.delete();

      // Cascade Delete their MedicalInfo
      await db.collection('MedicalInfo').doc(profileID).delete();

      // Cascade Delete their Emergency Contacts
      const contacts = await db.collection('EmergencyContacts').where('UserID', '==', profileID).get();
      const batch = db.batch();
      contacts.docs.forEach(cDoc => {
        batch.delete(cDoc.ref);
      });

      // Cascade Delete their Wristbands
      const wristbands = await db.collection('Wristbands').where('UserID', '==', profileID).get();
      wristbands.docs.forEach(wDoc => {
        batch.delete(wDoc.ref);
      });

      await batch.commit();

      return {
        success: true,
        message: 'Family member and all their records deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting family member:', error);
      return { success: false, error: 'Server Error', message: error.message, code: 500 };
    }
  }

  // --- Helpers ---
  _calculateAge(dateString) {
    if (!dateString) return null;
    try {
      const birthDate = new Date(dateString);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch (e) {
      return null;
    }
  }
}

module.exports = new FamilyService();
