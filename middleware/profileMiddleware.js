const { getFirestore } = require('../config/firebase');

/**
 * Middleware: resolveProfileId
 * 
 * Allows users to manage Family Member profiles using their own JWT token.
 * If '?profileId=xyz' is passed in the query string, it verifies the 'xyz' profile 
 * belongs to the authenticated user's AccountID. If authorized, it overrides 
 * req.targetUserID to be 'xyz'. Otherwise, req.targetUserID defaults to req.user.uid (Self).
 * 
 * Apply this after authenticateToken.
 */
const resolveProfileId = async (req, res, next) => {
  const profileId = req.query.profileId;
  
  // Default to self
  req.targetUserID = req.user.uid;

  // If a specific profile is requested for a family member
  if (profileId && profileId !== req.user.uid) {
    const db = getFirestore();
    try {
      const doc = await db.collection('FamilyProfiles').doc(profileId).get();
      
      // Security Check: Ensure this dependent matches the Parent Account ID
      if (!doc.exists || doc.data().AccountID !== req.user.uid) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to manage this family profile'
        });
      }
      
      // Authorized! Set the target to the dependent profile.
      req.targetUserID = profileId;
    } catch (error) {
      console.error('Error resolving profile ID:', error);
      return res.status(500).json({
        success: false,
        error: 'Server Error',
        message: 'Could not resolve family profile'
      });
    }
  }

  next();
};

module.exports = { resolveProfileId };
