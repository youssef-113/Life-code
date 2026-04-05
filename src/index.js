require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { initializeFirebase } = require('../config/firebase');
const { apiLimiter } = require('../middleware/rateLimitMiddleware');

// Import routes
const registerRoutes = require('../routes/registerRoutes');
const loginRoutes = require('../routes/loginRoutes');
const socialAuthRoutes = require('../routes/socialAuthRoutes');
const userProfileRoutes = require('../routes/userProfileRoutes');
const medicalRoutes = require('../routes/medicalRoutes');
const emergencyContactRoutes = require('../routes/emergencyContactRoutes');
const wristbandRoutes = require('../routes/wristbandRoutes');
const scanRoutes = require('../routes/scanRoutes');
const userAccountRoutes = require('../routes/userAccountRoutes');
const familyRoutes = require('../routes/familyRoutes');
const medicalProfileRoutes = require('../routes/medicalProfileRoutes');

// Initialize Express app
const app = express();

// Initialize Firebase
try {
  initializeFirebase();
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
  process.exit(1);
}

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      fontSrc: ["'self'", "https:"],
      connectSrc: ["'self'", "https:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  // Prevent MIME type sniffing
  noSniff: true,
  // Prevent clickjacking
  frameguard: {
    action: 'deny'
  },
  // XSS protection (legacy browsers)
  xssFilter: true,
  // Referrer policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
}));

// HTTPS enforcement in production
if (process.env.NODE_ENV === 'production') {
  // HTTP Strict Transport Security (HSTS) - forces HTTPS for 1 year
  app.use((req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    next();
  });
  
  // Redirect HTTP to HTTPS
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https' && !req.secure) {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// CORS Configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// General API rate limiting (applied to all /api routes)
app.use('/api', apiLimiter);

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LifeCode API Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/app', registerRoutes);
app.use('/api/app', loginRoutes);
app.use('/api/app', socialAuthRoutes);
app.use('/api/app', userProfileRoutes);
app.use('/api/app', medicalRoutes);
app.use('/api/app', emergencyContactRoutes);
app.use('/api/app', wristbandRoutes);
app.use('/api/app', scanRoutes);
app.use('/api/app', userAccountRoutes);
app.use('/api/app', familyRoutes);
app.use('/api/app', medicalProfileRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to LifeCode API',
    version: '1.0.0',
    profileCompletion: {
      description: 'Profile completion percentage (0-100%) is returned in GET and update responses',
      sections: {
        personalInfo: '15% - name, gender, address',
        photo: '10% - profile photo',
        emergencyContact: '15% - primary/secondary contacts',
        medicalProfile: '15% - blood type, medical conditions',
        allergies: '15% - hasAllergies flag + items',
        medications: '15% - hasMedications flag + items',
        surgeries: '15% - hasSurgeries flag + items'
      },
      levels: {
        low: '0-19% - Just started',
        partial: '20-49% - Some sections completed',
        medium: '50-79% - Most sections completed',
        complete: '80-100% - Profile nearly/fully complete'
      }
    },
    endpoints: {
      auth: {
        register: 'POST /api/app/register (email/password, public)',
        login: 'POST /api/app/login (email/password, public)',
        logout: 'POST /api/app/logout (private)',
        logoutAll: 'POST /api/app/logout-all (private)',
        refreshToken: 'POST /api/app/refresh (public, requires refresh token)',
        sessions: 'GET /api/app/sessions (private - list active sessions)',
        revokeSession: 'DELETE /api/app/sessions/:sessionId (private)',
        authGoogle: 'POST /api/app/auth/google (login OR register, public)',
        authApple: 'POST /api/app/auth/apple (login OR register, public)',
        getProviders: 'GET /api/app/auth/providers (private - linked auth methods)',
        unlinkProvider: 'DELETE /api/app/auth/providers/:provider (private)'
      },
      profile: {
        getPersonalInfo: 'GET /api/app/profile/personal-info (private)',
        updatePersonalInfo: 'PUT /api/app/profile/personal-info (private)',
        getEmergencyContacts: 'GET /api/app/profile/emergency-contacts (private)',
        updateEmergencyContacts: 'PUT /api/app/profile/emergency-contacts (private)'
      },
      medical: {
        createMedicalInfo: 'POST /api/app/medical (private - create full medical profile)',
        updateMedicalInfo: 'PUT /api/app/medical (private - update full medical profile)',
        getMedicalInfo: 'GET /api/app/medical (private - get medical info)'
      },
      medicalProfile: {
        getDashboard: 'GET /api/app/medical/profile (private, includes profileCompletion%)',
        updatePersonalInfo: 'PUT /api/app/medical/personal-info (private, returns profileCompletion%)',
        updateEmergencyContact: 'PUT /api/app/medical/emergency-contact (private, returns profileCompletion%)',
        updateMedicalProfile: 'PUT /api/app/medical/medical-profile (private, returns profileCompletion%)',
        updateAllergies: 'PUT /api/app/medical/allergies (private, hasAllergies flag, returns profileCompletion%)',
        updateMedications: 'PUT /api/app/medical/medications (private, hasMedications flag, returns profileCompletion%)',
        updateSurgeries: 'PUT /api/app/medical/surgeries (private, hasSurgeries flag, returns profileCompletion%)'
      },
      emergencyContacts: {
        addContact: 'POST /api/app/emergency/contact (private, returns profileCompletion%)',
        addMultipleContacts: 'POST /api/app/emergency/contacts/bulk (private, returns profileCompletion%)',
        getContacts: 'GET /api/app/emergency/contacts (private, includes profileCompletion%)',
        getContact: 'GET /api/app/emergency/contact/:id (private)',
        updateContact: 'PUT /api/app/emergency/contact/:id (private, returns profileCompletion%)',
        deleteContact: 'DELETE /api/app/emergency/contact/:id (private, returns profileCompletion%)',
        setPrimary: 'PUT /api/app/emergency/contact/:id/primary (private)'
      },
      userAccount: {
        changePassword: 'POST /api/app/user/password (private)',
        uploadPhoto: 'POST /api/app/user/photo (private, returns profileCompletion%)',
        getPhoto: 'GET /api/app/user/photo (private)',
        getPhotoByUserId: 'GET /api/app/user/:userId/photo (private, respects privacy)',
        deletePhoto: 'DELETE /api/app/user/photo (private, returns profileCompletion%)',
        deleteAccount: 'DELETE /api/app/user/account (private, soft delete)',
        updatePreferences: 'PUT /api/app/user/preferences (private)',
        getPreferences: 'GET /api/app/user/preferences (private)',
        getCompleteProfile: 'GET /api/app/user/complete (private, includes profileCompletion%)'
      },
      family: {
        listFamilyMembers: 'GET /api/app/family (private, includes self)',
        addDependent: 'POST /api/app/family (private)',
        updateDependent: 'PUT /api/app/family/:id (private)',
        deleteDependent: 'DELETE /api/app/family/:id (private, cascade delete)'
      },
      wristband: {
        register:    'POST /api/app/wristband/register (private, upsert — syncs BandID/QRCode/NFCTag to Users doc)',
        activate:    'POST /api/app/wristband/activate (private)',
        revoke:      'POST /api/app/wristband/revoke (private — clears BandID/QRCode/NFCTag from Users doc)',
        list:        'GET /api/app/wristband/list (private)',
        getPrimary:  'GET /api/app/wristband/primary (private)',
        setPrimary:  'PUT /api/app/wristband/:wristbandId/primary (private)',
        getFull:     'GET /api/app/wristband/:wristbandId/full (private)',
        resolveUser: 'POST /api/app/wristband/resolve-user (private, QR/NFC → userID)',
        myBand:      'GET /api/app/wristband/my-band (private — BandID+QRCode+NFCTag from Users doc)',
        bandInfo:    'GET /api/app/wristband/:bandId/info (private — wristband doc by Firestore ID)'
      },
      scan: {
        scanQR:      'POST /api/app/scan/qr   (public — emergency info from QR code)',
        scanNFC:     'POST /api/app/scan/nfc  (public — emergency info from NFC tag)',
        scanBandId:  'POST /api/app/scan/band (public — emergency info from Band ID / NFC chip)',
        history:     'GET /api/app/scan/history (private, paginated)'
      },
      health: 'GET /health (public - server status)'
    },
    totalEndpoints: 50
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.path} not found`,
    code: 404
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: 'Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    code: err.status || 500
  });
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🚀 LifeCode API Server is running!                      ║
  ║                                                           ║
  ║   Port: ${PORT}                                             ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}                          ║
  ║   Firebase Project: ${process.env.FIREBASE_PROJECT_ID || 'lifecode-app'}              ║
  ║                                                           ║
  ║   Health Check: http://localhost:${PORT}/health              ║
  ║   API Base URL: http://localhost:${PORT}/api                ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

module.exports = app;
