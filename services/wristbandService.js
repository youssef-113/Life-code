const { getFirestore } = require('../config/firebase');
const authService = require('./authService');

/**
 * Wristband Service - Handles wristband registration and management
 * Firestore Collection: Wristbands
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

          const updatedDoc = await existingQR.docs[0].ref.get();
          return {
            success: true,
            message: 'Wristband re-activated successfully',
            data: {
              id: existingQR.docs[0].id,
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

      // Generate serial number
      const year = new Date().getFullYear();
      const allWristbands = await db.collection('Wristbands').get();
      const serialNumber = `SN-${year}-${String(allWristbands.size + 1).padStart(5, '0')}`;

      // Create wristband document
      const wristbandDoc = {
        UserID: userID,
        QRCode: qrCode || '',
        NFCTag: nfcTag || '',
        SerialNumber: serialNumber,
        IsActive: true,
        IsRevoked: false,
        ActivatedAt: new Date(),
        RevokedAt: null,
        RevokeReason: null,
        CreatedAt: new Date(),
        UpdatedAt: new Date()
      };

      const docRef = await db.collection('Wristbands').add(wristbandDoc);

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
          id: docRef.id,
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
          id: wristbandId,
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

      // Log security event
      await authService.logSecurityEvent(userID, 'WRISTBAND_REVOKED', {
        wristbandId,
        reason
      });

      return {
        success: true,
        message: 'Wristband revoked successfully',
        data: {
          id: wristbandId,
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
        id: doc.id,
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
          id: wristbandQuery.docs[0].id,
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
          id: wristbandQuery.docs[0].id,
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
}

module.exports = new WristbandService();
