/**
 * Firebase Admin SDK Configuration
 * Initializes Firebase Admin with service account credentials
 * Provides Firestore database instance for the application
 */

import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let firebaseApp;

/**
 * Initialize Firebase Admin SDK
 * Supports both service account file and environment variables
 */
const initializeFirebase = () => {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length > 0) {
      console.log('Firebase Admin already initialized');
      return admin.app();
    }

    let serviceAccount;

    // Try to load from service account file first
    const serviceAccountPath = join(__dirname, '../../firebase-service-account.json');
    
    try {
      serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      console.log('Loaded Firebase service account from file');
    } catch (fileError) {
      // If file doesn't exist, use environment variables
      console.log('Service account file not found, using environment variables');
      
      if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
        throw new Error('Firebase credentials not found. Please provide either firebase-service-account.json file or set environment variables.');
      }

      serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      };
    }

    // Initialize Firebase Admin
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });

    console.log('Firebase Admin SDK initialized successfully');
    return firebaseApp;

  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error.message);
    throw error;
  }
};

// Initialize Firebase
initializeFirebase();

// Export Firestore instance
export const db = admin.firestore();

// Export Firebase Auth instance
export const auth = admin.auth();

// Export admin for advanced usage
export { admin };

// Export Timestamp for Firestore operations
export const Timestamp = admin.firestore.Timestamp;

// Export FieldValue for Firestore operations
export const FieldValue = admin.firestore.FieldValue;
