const { getFirestore } = require('../config/firebase');
const authService = require('./authService');

/**
 * Wristband Service - Handles wristband registration and management
 * Firestore Collections: Wristbands, Users
 *
 * Two-way identity link:
 *   Wristbands doc  →  UserID  (band knows its owner)
 *   Users doc       →  BandID, QRCode, NFCTag  (user knows their active band)
 */
class WristbandService {

  /**
   * Register a new wristband (upsert — if already registered to this user, update it)
   * @param {string} userID - User ID
   * @param {Object} wristbandData - Wristband data { qrCode, nfcTag }
   * @returns {Object} - Registration result
   */
  async registerWristband(userID, wristbandData) {
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

      const { qrCode, nfcTag } = wristbandData;

      // Check if QR code already registered to ANOTHER user
      if (qrCode) {
        const existingQR = await db.collection('Wristbands')
          .where('QRCode', '==', qrCode)
          .limit(1)
          .get();

        if (!existingQR.empty) {
          const existingData = existingQR.docs[0].data();
          if (existingData.UserID !== userID) {
            return {
              success: false,
              error: 'Conflict',
              message: 'This wristband is already registered to another user',
              code: 409
            };
          }
          // Same user — update existing wristband
          const updateData = {
            IsActive: true,
            IsRevoked: false,
            RevokedAt: null,
            RevokeReason: null,
            ActivatedAt: new Date(),
            UpdatedAt: new Date()
          };
          if (nfcTag) updateData.NFCTag = nfcTag;

          await existingQR.docs[0].ref.update(updateData);

          // ── Sync back to Users doc ────────────────────────────────────────
          await db.collection('Users').doc(userID).update({
            BandID: existingQR.docs[0].id,
            QRCode: qrCode || '',
            NFCTag: nfcTag || updateData.NFCTag || '',
            UpdatedAt: new Date()
          });

          const updatedDoc = await existingQR.docs[0].ref.get();
          return {
            success: true,
            message: 'Wristband re-activated successfully',
            data: {
              BandID: existingQR.docs[0].id,
              ...updatedDoc.data()
            }
          };
        }
      }

      // Check if NFC tag already registered to ANOTHER user
      if (nfcTag) {
        const existingNFC = await db.collection('Wristbands')
          .where('NFCTag', '==', nfcTag)
          .limit(1)
          .get();

        if (!existingNFC.empty && existingNFC.docs[0].data().UserID !== userID) {
          return {
            success: false,
            error: 'Conflict',
            message: 'This NFC tag is already registered to another user',
            code: 409
          };
        }
      }

      // Check if user already has an active wristband (enforce one band per user)
      const existingUserBand = await db.collection('Wristbands')
        .where('UserID', '==', userID)
        .where('IsActive', '==', true)
        .where('IsRevoked', '==', false)
        .limit(1)
        .get();

      if (!existingUserBand.empty) {
        return {
          success: false,
          error: 'Conflict',
          message: 'User already has an active wristband. Each user can only have one active band. Please revoke the existing band first.',
          code: 409,
          data: {
            BandID: existingUserBand.docs[0].id,
            existingBand: existingUserBand.docs[0].data()
          }
        };
      }

      // Generate serial number
      const year = new Date().getFullYear();
      const allWristbands = await db.collection('Wristbands').get();
      const serialNumber = `SN-${year}-${String(allWristbands.size + 1).padStart(5, '0')}`;

      // Check if user has any previous bands (to determine if this should be primary)
      const allUserBands = await db.collection('Wristbands')
        .where('UserID', '==', userID)
        .get();
      const isPrimary = allUserBands.empty; // First band is automatically primary

      // Create wristband document
      const wristbandDoc = {
        UserID: userID,
        QRCode: qrCode || '',
        NFCTag: nfcTag || '',
        SerialNumber: serialNumber,
        IsActive: true,
        IsRevoked: false,
        IsPrimary: isPrimary,
        ActivatedAt: new Date(),
        RevokedAt: null,
        RevokeReason: null,
        CreatedAt: new Date(),
        UpdatedAt: new Date()
      };

      const docRef = await db.collection('Wristbands').add(wristbandDoc);

      // ── Two-way link: store BandID + identifiers on the Users doc ──────────
      await db.collection('Users').doc(userID).update({
        BandID:   docRef.id,
        QRCode:   qrCode  || '',
        NFCTag:   nfcTag  || '',
        UpdatedAt: new Date()
      });

      // Log security event
      await authService.logSecurityEvent(userID, 'WRISTBAND_REGISTERED', {
        wristbandId: docRef.id,
        qrCode,
        serialNumber
      });

      return {
        success: true,
        message: 'Wristband registered successfully',
        data: {
          BandID: docRef.id,
          ...wristbandDoc
        }
      };
    } catch (error) {
      console.error('Register wristband error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Activate a wristband
   * @param {string} userID - User ID
   * @param {string} wristbandId - Wristband document ID
   * @returns {Object} - Activation result
   */
  async activateWristband(userID, wristbandId) {
    const db = getFirestore();

    try {
      const wristbandDoc = await db.collection('Wristbands').doc(wristbandId).get();

      if (!wristbandDoc.exists) {
        return {
          success: false,
          error: 'Not Found',
          message: 'Wristband not found',
          code: 404
        };
      }

      if (wristbandDoc.data().UserID !== userID) {
        return {
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to activate this wristband',
          code: 403
        };
      }

      await db.collection('Wristbands').doc(wristbandId).update({
        IsActive: true,
        IsRevoked: false,
        RevokedAt: null,
        RevokeReason: null,
        ActivatedAt: new Date(),
        UpdatedAt: new Date()
      });

      return {
        success: true,
        message: 'Wristband activated successfully',
        data: {
          BandID: wristbandId,
          IsActive: true,
          ActivatedAt: new Date()
        }
      };
    } catch (error) {
      console.error('Activate wristband error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Revoke a wristband
   * @param {string} userID - User ID
   * @param {string} wristbandId - Wristband document ID
   * @param {string} reason - Revoke reason
   * @returns {Object} - Revocation result
   */
  async revokeWristband(userID, wristbandId, reason) {
    const db = getFirestore();

    try {
      const wristbandDoc = await db.collection('Wristbands').doc(wristbandId).get();

      if (!wristbandDoc.exists) {
        return {
          success: false,
          error: 'Not Found',
          message: 'Wristband not found',
          code: 404
        };
      }

      if (wristbandDoc.data().UserID !== userID) {
        return {
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to revoke this wristband',
          code: 403
        };
      }

      const revokedAt = new Date();
      await db.collection('Wristbands').doc(wristbandId).update({
        IsActive: false,
        IsRevoked: true,
        RevokedAt: revokedAt,
        RevokeReason: reason || 'No reason specified',
        UpdatedAt: new Date()
      });

      // ── Clear the identifying fields from the Users doc ──────────────────
      await db.collection('Users').doc(userID).update({
        BandID:    null,
        QRCode:    null,
        NFCTag:    null,
        UpdatedAt: new Date()
      });

      // Log security event
      await authService.logSecurityEvent(userID, 'WRISTBAND_REVOKED', {
        wristbandId,
        reason
      });

      return {
        success: true,
        message: 'Wristband revoked successfully',
        data: {
          BandID: wristbandId,
          IsActive: false,
          IsRevoked: true,
          RevokedAt: revokedAt,
          RevokeReason: reason || 'No reason specified'
        }
      };
    } catch (error) {
      console.error('Revoke wristband error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Get all wristbands for a user
   * @param {string} userID - User ID
   * @returns {Object} - List of wristbands
   */
  async getWristbands(userID) {
    const db = getFirestore();

    try {
      const wristbandsQuery = await db.collection('Wristbands')
        .where('UserID', '==', userID)
        .orderBy('CreatedAt', 'desc')
        .get();

      const wristbands = wristbandsQuery.docs.map(doc => ({
        BandID: doc.id,
        ...doc.data()
      }));

      return {
        success: true,
        data: wristbands,
        count: wristbands.length
      };
    } catch (error) {
      console.error('Get wristbands error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Get primary wristband for a user
   * @param {string} userID - User ID
   * @returns {Object} - Primary wristband data
   */
  async getPrimaryWristband(userID) {
    const db = getFirestore();

    try {
      const wristbandQuery = await db.collection('Wristbands')
        .where('UserID', '==', userID)
        .where('IsPrimary', '==', true)
        .where('IsActive', '==', true)
        .limit(1)
        .get();

      if (wristbandQuery.empty) {
        return {
          success: false,
          error: 'Not Found',
          message: 'No primary wristband found for this user',
          code: 404
        };
      }

      const wristbandData = wristbandQuery.docs[0].data();

      return {
        success: true,
        data: {
          BandID: wristbandQuery.docs[0].id,
          ...wristbandData
        }
      };
    } catch (error) {
      console.error('Get primary wristband error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Set a wristband as primary (unsets any other primary)
   * @param {string} userID - User ID
   * @param {string} wristbandId - Wristband document ID
   * @returns {Object} - Result
   */
  async setPrimaryWristband(userID, wristbandId) {
    const db = getFirestore();

    try {
      // Verify wristband exists and belongs to user
      const wristbandDoc = await db.collection('Wristbands').doc(wristbandId).get();

      if (!wristbandDoc.exists) {
        return {
          success: false,
          error: 'Not Found',
          message: 'Wristband not found',
          code: 404
        };
      }

      if (wristbandDoc.data().UserID !== userID) {
        return {
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to modify this wristband',
          code: 403
        };
      }

      if (!wristbandDoc.data().IsActive) {
        return {
          success: false,
          error: 'Bad Request',
          message: 'Cannot set an inactive wristband as primary',
          code: 400
        };
      }

      // Unset all other primary wristbands for this user
      const userWristbands = await db.collection('Wristbands')
        .where('UserID', '==', userID)
        .where('IsPrimary', '==', true)
        .get();

      const batch = db.batch();
      userWristbands.docs.forEach(doc => {
        batch.update(doc.ref, { IsPrimary: false, UpdatedAt: new Date() });
      });

      // Set the new primary
      batch.update(db.collection('Wristbands').doc(wristbandId), {
        IsPrimary: true,
        UpdatedAt: new Date()
      });

      await batch.commit();

      // Log security event
      await authService.logSecurityEvent(userID, 'WRISTBAND_SET_PRIMARY', {
        wristbandId
      });

      return {
        success: true,
        message: 'Wristband set as primary successfully',
        data: {
          BandID: wristbandId,
          IsPrimary: true
        }
      };
    } catch (error) {
      console.error('Set primary wristband error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Get wristband with full user info (for admin/internal use)
   * @param {string} wristbandId - Wristband document ID
   * @returns {Object} - Wristband with user data
   */
  async getWristbandWithUser(wristbandId) {
    const db = getFirestore();

    try {
      const wristbandDoc = await db.collection('Wristbands').doc(wristbandId).get();

      if (!wristbandDoc.exists) {
        return {
          success: false,
          error: 'Not Found',
          message: 'Wristband not found',
          code: 404
        };
      }

      const wristbandData = wristbandDoc.data();
      const userID = wristbandData.UserID;

      // Fetch all related user data in parallel
      const [userDoc, medicalDoc, emergencyContacts] = await Promise.all([
        db.collection('Users').doc(userID).get(),
        db.collection('MedicalInfo').doc(userID).get(),
        db.collection('EmergencyContacts').where('UserID', '==', userID).get()
      ]);

      const userData = userDoc.exists ? userDoc.data() : null;
      const medicalData = medicalDoc.exists ? medicalDoc.data() : null;
      const contacts = emergencyContacts.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      return {
        success: true,
        data: {
          wristband: {
            BandID: wristbandId,
            ...wristbandData
          },
          user: userData ? { UserID: userID, ...userData } : null,
          medical: medicalData ? { UserID: userID, ...medicalData } : null,
          emergencyContacts: contacts
        }
      };
    } catch (error) {
      console.error('Get wristband with user error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Get user ID from QR code or NFC tag
   * @param {string} identifier - QR code or NFC tag
   * @param {string} type - 'qr' or 'nfc'
   * @returns {Object} - User ID and wristband info
   */
  async getUserIdFromBand(identifier, type = 'qr') {
    const db = getFirestore();

    try {
      const field = type === 'qr' ? 'QRCode' : 'NFCTag';
      const wristbandQuery = await db.collection('Wristbands')
        .where(field, '==', identifier)
        .where('IsActive', '==', true)
        .limit(1)
        .get();

      if (wristbandQuery.empty) {
        return {
          success: false,
          error: 'Not Found',
          message: `No active wristband found with this ${type.toUpperCase()} code`,
          code: 404
        };
      }

      const wristbandData = wristbandQuery.docs[0].data();

      return {
        success: true,
        data: {
          UserID:       wristbandData.UserID,
          BandID:       wristbandQuery.docs[0].id,
          IsPrimary:    wristbandData.IsPrimary || false,
          SerialNumber: wristbandData.SerialNumber
        }
      };
    } catch (error) {
      console.error('Get user ID from band error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Get wristband by QR code (for public scan)
   * @param {string} qrCode - QR code string
   * @returns {Object} - Wristband data with user info
   */
  async getWristbandByQRCode(qrCode) {
    const db = getFirestore();

    try {
      const wristbandQuery = await db.collection('Wristbands')
        .where('QRCode', '==', qrCode)
        .limit(1)
        .get();

      if (wristbandQuery.empty) {
        return {
          success: false,
          error: 'Not Found',
          message: 'Invalid or unregistered wristband code',
          code: 404
        };
      }

      const wristbandData = wristbandQuery.docs[0].data();

      // Check if revoked
      if (wristbandData.IsRevoked) {
        return {
          success: false,
          error: 'Forbidden',
          message: 'This wristband has been revoked and is no longer active',
          revokedAt: wristbandData.RevokedAt,
          reason: wristbandData.RevokeReason,
          code: 403
        };
      }

      // Check if active
      if (!wristbandData.IsActive) {
        return {
          success: false,
          error: 'Forbidden',
          message: 'This wristband is not currently active',
          code: 403
        };
      }

      return {
        success: true,
        data: {
          BandID: wristbandQuery.docs[0].id,
          ...wristbandData
        }
      };
    } catch (error) {
      console.error('Get wristband by QR error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Get wristband by NFC tag (for public scan)
   * @param {string} nfcTag - NFC tag string
   * @returns {Object} - Wristband data with user info
   */
  async getWristbandByNFCTag(nfcTag) {
    const db = getFirestore();

    try {
      const wristbandQuery = await db.collection('Wristbands')
        .where('NFCTag', '==', nfcTag)
        .limit(1)
        .get();

      if (wristbandQuery.empty) {
        return {
          success: false,
          error: 'Not Found',
          message: 'Invalid or unregistered NFC tag',
          code: 404
        };
      }

      const wristbandData = wristbandQuery.docs[0].data();

      if (wristbandData.IsRevoked) {
        return {
          success: false,
          error: 'Forbidden',
          message: 'This wristband has been revoked and is no longer active',
          revokedAt: wristbandData.RevokedAt,
          reason: wristbandData.RevokeReason,
          code: 403
        };
      }

      if (!wristbandData.IsActive) {
        return {
          success: false,
          error: 'Forbidden',
          message: 'This wristband is not currently active',
          code: 403
        };
      }

      return {
        success: true,
        data: {
          BandID: wristbandQuery.docs[0].id,
          ...wristbandData
        }
      };
    } catch (error) {
      console.error('Get wristband by NFC error:', error);
      return {
        success: false,
        error: 'Server Error',
        message: error.message,
        code: 500
      };
    }
  }

  /**
   * Get the wristband document ID stored on the user's profile
   * @param {string} userID - User ID
   * @returns {Object} - { success, data: { bandId, qrCode, nfcTag } }
   */
  async getBandIdFromUser(userID) {
    const db = getFirestore();
    try {
      const userDoc = await db.collection('Users').doc(userID).get();
      if (!userDoc.exists) {
        return { success: false, error: 'Not Found', message: 'User not found', code: 404 };
      }
      const userData = userDoc.data();
      const BandID = userData.BandID || null;
      return {
        success: true,
        data: {
          userID,
          BandID,
          qrCode:  userData.QRCode  || null,
          nfcTag:  userData.NFCTag  || null,
          hasBand: !!BandID
        }
      };
    } catch (error) {
      console.error('Get band ID from user error:', error);
      return { success: false, error: 'Server Error', message: error.message, code: 500 };
    }
  }

  /**
   * Get wristband document by its Firestore ID (direct band-id lookup)
   * @param {string} bandId - Wristband document ID
   * @returns {Object} - Wristband data
   */
  async getWristbandByBandId(bandId) {
    const db = getFirestore();
    try {
      const doc = await db.collection('Wristbands').doc(bandId).get();
      if (!doc.exists) {
        return { success: false, error: 'Not Found', message: 'Wristband not found', code: 404 };
      }
      const data = doc.data();
      if (data.IsRevoked) {
        return {
          success: false,
          error: 'Forbidden',
          message: 'This wristband has been revoked',
          code: 403
        };
      }
      if (!data.IsActive) {
        return {
          success: false,
          error: 'Forbidden',
          message: 'This wristband is not currently active',
          code: 403
        };
      }
      return { success: true, data: { BandID: doc.id, ...data } };
    } catch (error) {
      console.error('Get wristband by band ID error:', error);
      return { success: false, error: 'Server Error', message: error.message, code: 500 };
    }
  }

  /**
   * Generate QR code URL for web-based access
   * @param {string} userID - User ID
   * @param {string} baseURL - Base URL for the API (e.g., https://life-code--yossfabdla311.replit.app)
   * @returns {Object} - QR code URL and user ID
   */
  generateQRCodeURL(userID, baseURL = process.env.API_BASE_URL || 'https://life-code--yossfabdla311.replit.app') {
    const endpoint = '/api/app/public/user/';
    const fullURL = `${baseURL}${endpoint}${userID}`;
    
    return {
      success: true,
      data: {
        userID,
        qrCodeURL: fullURL,
        qrCodeContent: userID,
        format: 'url',
        description: 'QR code can contain either the full URL or just the user ID'
      }
    };
  }
}

module.exports = new WristbandService();
