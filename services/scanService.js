const { getFirestore } = require('../config/firebase');
const wristbandService = require('./wristbandService');

/**
 * Scan Service - Handles public QR/NFC scans and scan history
 * Firestore Collections: ScanLogs, Wristbands, Users, MedicalInfo, EmergencyContacts
 */
class ScanService {

  /**
   * Build complete user report from fetched data
   * @private
   */
  _buildCompleteReport(userID, userData, medicalData, contactsQuery, wristbandData, scanLogRef, scanLogData, metadata) {
    // Build complete user profile
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

    // Build complete medical info
    const medical = medicalData ? {
      BloodType: medicalData.BloodType || null,
      Height: medicalData.Height || null,
      Weight: medicalData.Weight || null,
      MedicalConditions: medicalData.MedicalConditions || medicalData.ChronicDiseases || null,
      HasAllergies: medicalData.HasAllergies || false,
      Allergies: medicalData.Allergies || null,
      HasMedications: medicalData.HasMedications || false,
      Medications: medicalData.Medications || null,
      HasSurgeries: medicalData.HasSurgeries || false,
      Surgeries: medicalData.Surgeries || null,
      EmergencyInstructions: medicalData.EmergencyInstructions || null,
      Notes: medicalData.Notes || null
    } : null;

    // Build emergency contacts with new format (phoneNumbers array)
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
      .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)); // Primary first

    return {
      success: true,
      message: 'Scan successful - Complete User Report',
      data: {
        reportType: 'complete_user_report',
        userID: userID,
        scannedAt: new Date().toISOString(),
        wristband: {
          id: wristbandData.id || wristbandData.BandID,
          BandID: wristbandData.BandID,
          SerialNumber: wristbandData.SerialNumber,
          QRCode: wristbandData.QRCode,
          NFCTag: wristbandData.NFCTag,
          Status: wristbandData.Status || 'active',
          IsPrimary: wristbandData.IsPrimary || false,
          ActivatedAt: wristbandData.ActivatedAt || null
        },
        user,
        medical,
        emergencyContacts,
        scanLog: {
          id: scanLogRef.id,
          timestamp: scanLogData.Timestamp,
          location: metadata.location || null,
          scannerType: metadata.scannerType || 'public'
        }
      }
    };
  }

  /**
   * Scan a QR code (public — no auth required)
   * Looks up wristband → user → medical info → emergency contacts
   * @param {string} qrCode - QR code from wristband
   * @param {Object} metadata - Scan metadata (location, coordinates, scannerType)
   * @returns {Object} - Complete user report
   */
  async scanQR(qrCode, metadata = {}) {
    const db = getFirestore();

    try {
      // Look up wristband by QR code
      const wristbandResult = await wristbandService.getWristbandByQRCode(qrCode);

      if (!wristbandResult.success) {
        return wristbandResult;
      }

      const wristbandData = wristbandResult.data;
      const userID = wristbandData.UserID;

      // Fetch all user data in parallel
      const [userDoc, medicalQuery, contactsQuery] = await Promise.all([
        db.collection('Users').doc(userID).get(),
        db.collection('MedicalInfo').doc(userID).get(),
        db.collection('EmergencyContacts')
          .where('UserID', '==', userID)
          .get()
      ]);

      // Log the scan
      const scanLogData = {
        WristbandID: wristbandData.BandID,
        UserID: userID,
        ScanType: 'QR',
        ScannerType: metadata.scannerType || 'public',
        Location: metadata.location || null,
        Latitude: metadata.latitude || null,
        Longitude: metadata.longitude || null,
        IPAddress: metadata.ipAddress || 'unknown',
        UserAgent: metadata.userAgent || 'unknown',
        Timestamp: new Date()
      };

      const scanLogRef = await db.collection('ScanLogs').add(scanLogData);

      // Build and return complete report
      return this._buildCompleteReport(
        userID,
        userDoc.exists ? userDoc.data() : {},
        medicalQuery.exists ? medicalQuery.data() : null,
        contactsQuery,
        wristbandData,
        scanLogRef,
        scanLogData,
        metadata
      );
    } catch (error) {
      console.error('Scan QR error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Scan an NFC tag (public — no auth required)
   * @param {string} nfcTag - NFC tag from wristband
   * @param {Object} metadata - Scan metadata
   * @returns {Object} - User medical & emergency data
   */
  async scanNFC(nfcTag, metadata = {}) {
    const db = getFirestore();

    try {
      // Look up wristband by NFC tag
      const wristbandResult = await wristbandService.getWristbandByNFCTag(nfcTag);

      if (!wristbandResult.success) {
        return wristbandResult;
      }

      const wristbandData = wristbandResult.data;
      const userID = wristbandData.UserID;

      // Fetch all user data in parallel
      // Note: EmergencyContacts sorted in memory to avoid composite index requirement
      const [userDoc, medicalQuery, contactsQuery] = await Promise.all([
        db.collection('Users').doc(userID).get(),
        db.collection('MedicalInfo').doc(userID).get(),
        db.collection('EmergencyContacts')
          .where('UserID', '==', userID)
          .get()   // no orderBy — sort in memory below
      ]);

      // Log the scan
      const scanLogData = {
        WristbandID: wristbandData.BandID,
        UserID: userID,
        ScanType: 'NFC',
        ScannerType: metadata.scannerType || 'public',
        Location: metadata.location || null,
        Latitude: metadata.latitude || null,
        Longitude: metadata.longitude || null,
        IPAddress: metadata.ipAddress || 'unknown',
        UserAgent: metadata.userAgent || 'unknown',
        Timestamp: new Date()
      };

      const scanLogRef = await db.collection('ScanLogs').add(scanLogData);

      // Build and return complete report
      return this._buildCompleteReport(
        userID,
        userDoc.exists ? userDoc.data() : {},
        medicalQuery.exists ? medicalQuery.data() : null,
        contactsQuery,
        wristbandData,
        scanLogRef,
        scanLogData,
        metadata
      );
    } catch (error) {
      console.error('Scan NFC error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Get scan history for a user (with pagination and statistics)
   * @param {string} userID - User ID
   * @param {number} limit - Number of results per page
   * @param {number} page - Page number
   * @returns {Object} - Paginated scan history with stats
   */
  async getScanHistory(userID, limit = 50, page = 1) {
    const db = getFirestore();

    try {
      // Fetch all scans for this user in one query (no orderBy = no composite index needed)
      const allScansQuery = await db.collection('ScanLogs')
        .where('UserID', '==', userID)
        .get();

      const totalScans = allScansQuery.size;
      const totalPages = Math.ceil(totalScans / limit) || 1;

      // Calculate statistics
      const statistics = {
        total: 0,
        qr: 0,
        nfc: 0,
        bandId: 0,
        emergency: 0,
        hospital: 0,
        public: 0,
        personal: 0
      };

      // Sort all docs in memory by Timestamp descending
      const sortedDocs = allScansQuery.docs.sort((a, b) => {
        const aTime = a.data().Timestamp?.toDate?.() || new Date(a.data().Timestamp);
        const bTime = b.data().Timestamp?.toDate?.() || new Date(b.data().Timestamp);
        return bTime - aTime;
      });

      sortedDocs.forEach(doc => {
        const scan = doc.data();
        statistics.total++;
        if (scan.ScanType === 'QR')      statistics.qr++;
        if (scan.ScanType === 'NFC')     statistics.nfc++;
        if (scan.ScanType === 'BAND_ID') statistics.bandId++;
        if (scan.ScannerType === 'emergency') statistics.emergency++;
        if (scan.ScannerType === 'hospital')  statistics.hospital++;
        if (scan.ScannerType === 'public')    statistics.public++;
        if (scan.ScannerType === 'personal')  statistics.personal++;
      });

      // Slice for pagination in memory
      const start = (page - 1) * limit;
      const pageDocs = sortedDocs.slice(start, start + limit);

      const scans = pageDocs.map(doc => ({
        ScanLogID: doc.id,
        ...doc.data()
      }));

      return {
        success: true,
        data: {
          scans,
          pagination: {
            currentPage: page,
            totalPages,
            totalScans,
            limit,
            hasMore: page < totalPages
          },
          statistics
        }
      };
    } catch (error) {
      console.error('Get scan history error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }
  /**
   * Scan by Band ID (Firestore document ID)
   * Useful when NFC stores the Firestore band document ID directly
   * @param {string} bandId - Wristband Firestore document ID
   * @param {Object} metadata - Scan metadata
   * @returns {Object} - User medical & emergency data
   */
  async scanByBandId(bandId, metadata = {}) {
    const db = getFirestore();

    try {
      const wristbandResult = await wristbandService.getWristbandByBandId(bandId);

      if (!wristbandResult.success) {
        return wristbandResult;
      }

      const wristbandData = wristbandResult.data;
      const userID = wristbandData.UserID;

      // Fetch all user data in parallel
      const [userDoc, medicalQuery, contactsQuery] = await Promise.all([
        db.collection('Users').doc(userID).get(),
        db.collection('MedicalInfo').doc(userID).get(),
        db.collection('EmergencyContacts').where('UserID', '==', userID).get()
      ]);

      // Log the scan
      const scanLogData = {
        WristbandID:  wristbandData.BandID,
        UserID:       userID,
        ScanType:     'BAND_ID',
        ScannerType:  metadata.scannerType || 'public',
        Location:     metadata.location    || null,
        Latitude:     metadata.latitude    || null,
        Longitude:    metadata.longitude   || null,
        IPAddress:    metadata.ipAddress   || 'unknown',
        UserAgent:    metadata.userAgent   || 'unknown',
        Timestamp:    new Date()
      };

      const scanLogRef = await db.collection('ScanLogs').add(scanLogData);

      // Build and return complete report
      return this._buildCompleteReport(
        userID,
        userDoc.exists ? userDoc.data() : {},
        medicalQuery.exists ? medicalQuery.data() : null,
        contactsQuery,
        wristbandData,
        scanLogRef,
        scanLogData,
        metadata
      );
    } catch (error) {
      console.error('Scan by band ID error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }
}

module.exports = new ScanService();
