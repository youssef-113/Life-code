const { getFirestore } = require('../config/firebase');
const authService = require('../services/authService');

/**
 * Public Controller - Handles public access to user emergency information
 * Designed for web-based access via barcode/QR code scanning
 */

class PublicController {
  /**
   * Get user profile by user ID (public endpoint)
   * Used by web-based barcode/QR code scanning
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserProfile(req, res) {
    const db = getFirestore();
    const { userID } = req.params;

    try {
      // Validate user ID format
      if (!userID || userID.length < 10) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Invalid user ID format',
          code: 400
        });
      }

      // Fetch user data
      const userDoc = await db.collection('Users').doc(userID).get();

      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'User not found',
          code: 404
        });
      }

      const userData = userDoc.data();

      // Check if user is active
      if (!userData.IsActive) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'This user account is not active',
          code: 403
        });
      }

      // Fetch all user-related data in parallel
      const [medicalDoc, contactsQuery, wristbandsQuery] = await Promise.all([
        db.collection('MedicalInfo').doc(userID).get(),
        db.collection('EmergencyContacts')
          .where('UserID', '==', userID)
          .get(),
        db.collection('Wristbands')
          .where('UserID', '==', userID)
          .where('IsActive', '==', true)
          .where('IsRevoked', '==', false)
          .limit(1)
          .get()
      ]);

      // Build user profile
      const user = {
        id: userID,
        Username: userData.Username || 'Unknown',
        Email: userData.Email || null,
        Gender: userData.Gender || null,
        NationalID: userData.NationalID || null,
        PhotoURL: userData.PhotoURL || null,
        PhoneNumber: userData.PhoneNumber || null,
        Address: userData.Address || null,
        DateOfBirth: userData.DateOfBirth || null,
        IsActive: userData.IsActive ?? true,
        CreatedAt: userData.CreatedAt || null,
        UpdatedAt: userData.UpdatedAt || null
      };

      // Build medical info
      const medical = medicalDoc.exists ? {
        BloodType: medicalDoc.data().BloodType || null,
        Height: medicalDoc.data().Height || null,
        Weight: medicalDoc.data().Weight || null,
        MedicalConditions: medicalDoc.data().MedicalConditions || medicalDoc.data().ChronicDiseases || null,
        HasAllergies: medicalDoc.data().HasAllergies || false,
        Allergies: medicalDoc.data().Allergies || null,
        HasMedications: medicalDoc.data().HasMedications || false,
        Medications: medicalDoc.data().Medications || null,
        HasSurgeries: medicalDoc.data().HasSurgeries || false,
        Surgeries: medicalDoc.data().Surgeries || null,
        EmergencyInstructions: medicalDoc.data().EmergencyInstructions || null,
        Notes: medicalDoc.data().Notes || null
      } : null;

      // Build emergency contacts
      const emergencyContacts = contactsQuery.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ContactName: data.ContactName || data.fullName || 'Unknown',
            phoneNumbers: data.PhoneNumbers || data.phoneNumbers || 
                         (data.PhoneNumber ? [data.PhoneNumber] : []) || 
                         (data.Phone ? [data.Phone] : []),
            relationship: data.Relationship || data.relationship || data.Relation || null,
            isPrimary: data.IsPrimary || data.isPrimary || false,
            notes: data.Notes || data.notes || null,
            CreatedAt: data.CreatedAt || null
          };
        })
        .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));

      // Get active wristband info
      const wristband = !wristbandsQuery.empty ? {
        BandID: wristbandsQuery.docs[0].id,
        SerialNumber: wristbandsQuery.docs[0].data().SerialNumber,
        QRCode: wristbandsQuery.docs[0].data().QRCode,
        NFCTag: wristbandsQuery.docs[0].data().NFCTag,
        IsPrimary: wristbandsQuery.docs[0].data().IsPrimary || false,
        ActivatedAt: wristbandsQuery.docs[0].data().ActivatedAt || null
      } : null;

      // Log the public access
      const logData = {
        UserID: userID,
        ScanType: 'WEB_ACCESS',
        ScannerType: 'public',
        Location: req.query.location || null,
        Latitude: req.query.latitude || null,
        Longitude: req.query.longitude || null,
        IPAddress: req.ip || 'unknown',
        UserAgent: req.get('User-Agent') || 'unknown',
        Timestamp: new Date()
      };

      await db.collection('ScanLogs').add(logData);

      // Return complete user profile
      return res.status(200).json({
        success: true,
        message: 'User profile retrieved successfully',
        data: {
          reportType: 'complete_user_report',
          userID: userID,
          accessedAt: new Date().toISOString(),
          user,
          medical,
          emergencyContacts,
          wristband
        }
      });

    } catch (error) {
      console.error('Get user profile error:', error);
      return res.status(500).json({
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      });
    }
  }
}

module.exports = new PublicController();
