const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
let firebaseApp;

const initializeFirebase = () => {
  if (!firebaseApp) {
    try {
      // Try to load service account from file
      const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
      
      try {
        const serviceAccount = require(serviceAccountPath);
        
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: process.env.FIREBASE_DATABASE_URL
        });
        
        console.log('✅ Firebase initialized with service account');
      } catch (fileError) {
        // Fallback to environment variables
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            type: process.env.FIREBASE_TYPE,
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: process.env.FIREBASE_AUTH_URI,
            token_uri: process.env.FIREBASE_TOKEN_URI,
            auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
            client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
          }),
          databaseURL: process.env.FIREBASE_DATABASE_URL
        });
        
        console.log('✅ Firebase initialized with environment variables');
      }
    } catch (error) {
      console.error('❌ Firebase initialization error:', error.message);
      throw error;
    }
  }
  
  return firebaseApp;
};

// Get Firestore instance
const getFirestore = () => {
  initializeFirebase();
  return admin.firestore();
};

// Get Firebase Storage instance
const getStorage = () => {
  initializeFirebase();
  return admin.storage();
};

// Get Firebase Auth instance
const getAuth = () => {
  initializeFirebase();
  return admin.auth();
};

// Verify Firebase ID Token
const verifyIdToken = async (idToken) => {
  const auth = getAuth();
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return { valid: true, decodedToken };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

// Create custom token for user
const createCustomToken = async (uid, additionalClaims = {}) => {
  const auth = getAuth();
  try {
    const customToken = await auth.createCustomToken(uid, additionalClaims);
    return { success: true, customToken };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Create user in Firebase Auth
const createUserInFirebase = async (email, password, displayName = null) => {
  const auth = getAuth();
  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: false
    });
    return { success: true, userRecord };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get user by email
const getUserByEmail = async (email) => {
  const auth = getAuth();
  try {
    const userRecord = await auth.getUserByEmail(email);
    return { exists: true, userRecord };
  } catch (error) {
    return { exists: false, error: error.message };
  }
};

// Get user by UID
const getUserByUid = async (uid) => {
  const auth = getAuth();
  try {
    const userRecord = await auth.getUser(uid);
    return { exists: true, userRecord };
  } catch (error) {
    return { exists: false, error: error.message };
  }
};

module.exports = {
  initializeFirebase,
  getFirestore,
  getStorage,
  getAuth,
  verifyIdToken,
  createCustomToken,
  createUserInFirebase,
  getUserByEmail,
  getUserByUid
};
