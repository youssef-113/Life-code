const { getFirestore } = require('../config/firebase');
const wristbandService = require('./wristbandService');

/**
 * Scan Service - Handles public QR/NFC scans and scan history
 * Firestore Collections: ScanLogs, Wristbands, Users, MedicalInfo, EmergencyContacts
 */
class ScanService {

  /**
   * Scan a QR code (public — no auth required)
   * Looks up wristband → user → medical info → emergency contacts
   * @param {string} qrCode - QR code from wristband
   * @param {Object} metadata - Scan metadata (location, coordinates, scannerType)
   * @returns {Object} - User medical & emergency data
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

      // Build user profile (limited info for public scan)
      const userData = userDoc.exists ? userDoc.data() : {};
      const user = {
        Username: userData.Username || 'Unknown',
        Gender: userData.Gender || null,
        PhotoURL: userData.PhotoURL || null
      };

      // Build medical info
      const medicalData = medicalQuery.exists ? medicalQuery.data() : null;
      const medical = medicalData ? {
        BloodType: medicalData.BloodType || null,
        Height: medicalData.Height || null,
        Weight: medicalData.Weight || null,
        ChronicDiseases: medicalData.ChronicDiseases || null,
        Allergies: medicalData.Allergies || null,
        Medications: medicalData.Medications || null,
        EmergencyInstructions: medicalData.EmergencyInstructions || null
      } : null;

      // Build emergency contacts
      const emergencyContacts = contactsQuery.docs
        .map(doc => doc.data())
        .sort((a, b) => (a.Priority || 999) - (b.Priority || 999))
        .map(data => {
          return {
            ContactName: data.ContactName,
            Relation: data.Relation,
            PhoneNumber: data.PhoneNumber,
            IsPrimary: data.IsPrimary || false
          };
        });

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

      return {
        success: true,
        message: 'Scan successful',
        data: {
          userID: userID,
          wristband: {
            BandID:       wristbandData.BandID,
            SerialNumber: wristbandData.SerialNumber,
            IsPrimary:    wristbandData.IsPrimary || false
          },
          user,
          medical,
          emergencyContacts,
          scanLog: {
            id:        scanLogRef.id,
            timestamp: scanLogData.Timestamp
          }
        }
      };
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

      // Build user profile
      const userData = userDoc.exists ? userDoc.data() : {};
      const user = {
        Username: userData.Username || 'Unknown',
        Gender: userData.Gender || null,
        PhotoURL: userData.PhotoURL || null
      };

      // Build medical info
      const medicalData = medicalQuery.exists ? medicalQuery.data() : null;
      const medical = medicalData ? {
        BloodType: medicalData.BloodType || null,
        Height: medicalData.Height || null,
        Weight: medicalData.Weight || null,
        ChronicDiseases: medicalData.ChronicDiseases || null,
        Allergies: medicalData.Allergies || null,
        Medications: medicalData.Medications || null,
        EmergencyInstructions: medicalData.EmergencyInstructions || null
      } : null;

      // Build emergency contacts — sorted in memory by Priority
      const emergencyContacts = contactsQuery.docs
        .map(doc => doc.data())
        .sort((a, b) => (a.Priority || 999) - (b.Priority || 999))
        .map(data => ({
          ContactName: data.ContactName,
          Relation: data.Relation,
          PhoneNumber: data.PhoneNumber,
          IsPrimary: data.IsPrimary || false
        }));

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

      return {
        success: true,
        message: 'Scan successful',
        data: {
          userID: userID,
          wristband: {
            BandID:       wristbandData.BandID,
            SerialNumber: wristbandData.SerialNumber,
            IsPrimary:    wristbandData.IsPrimary || false
          },
          user,
          medical,
          emergencyContacts,
          scanLog: {
            id:        scanLogRef.id,
            timestamp: scanLogData.Timestamp
          }
        }
      };
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

      const userData = userDoc.exists ? userDoc.data() : {};
      const user = {
        Username:  userData.Username  || 'Unknown',
        Gender:    userData.Gender    || null,
        PhotoURL:  userData.PhotoURL  || null
      };

      const medicalData = medicalQuery.exists ? medicalQuery.data() : null;
      const medical = medicalData ? {
        BloodType:             medicalData.BloodType             || null,
        Height:                medicalData.Height                || null,
        Weight:                medicalData.Weight                || null,
        ChronicDiseases:       medicalData.ChronicDiseases       || null,
        Allergies:             medicalData.Allergies             || null,
        Medications:           medicalData.Medications           || null,
        EmergencyInstructions: medicalData.EmergencyInstructions || null
      } : null;

      const emergencyContacts = contactsQuery.docs
        .map(doc => doc.data())
        .sort((a, b) => (a.Priority || 999) - (b.Priority || 999))
        .map(data => ({
          ContactName: data.ContactName,
          Relation:    data.Relation,
          PhoneNumber: data.PhoneNumber,
          IsPrimary:   data.IsPrimary || false
        }));

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

      return {
        success: true,
        message: 'Scan successful',
        data: {
          userID,
          wristband: {
            BandID:       wristbandData.BandID,
            SerialNumber: wristbandData.SerialNumber,
            IsPrimary:    wristbandData.IsPrimary || false
          },
          user,
          medical,
          emergencyContacts,
          scanLog: {
            id:        scanLogRef.id,
            timestamp: scanLogData.Timestamp
          }
        }
      };
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
