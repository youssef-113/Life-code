require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { initializeFirebase } = require('../config/firebase');
const { apiLimiter } = require('../middleware/rateLimitMiddleware');

// Import routes
const registerRoutes = require('../routes/registerRoutes');
const loginRoutes = require('../routes/loginRoutes');
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
    endpoints: {
      auth: {
        register: 'POST /api/app/register',
        registerGoogle: 'POST /api/app/register/google',
        registerApple: 'POST /api/app/register/apple',
        login: 'POST /api/app/login',
        logout: 'POST /api/app/logout',
        logoutAll: 'POST /api/app/logout-all',
        refreshToken: 'POST /api/app/refresh',
        sessions: 'GET /api/app/sessions',
        revokeSession: 'DELETE /api/app/sessions/:sessionId'
      },
      profile: {
        getPersonalInfo: 'GET /api/app/profile/personal-info',
        updatePersonalInfo: 'PUT /api/app/profile/personal-info',
        getEmergencyContacts: 'GET /api/app/profile/emergency-contacts',
        updateEmergencyContacts: 'PUT /api/app/profile/emergency-contacts'
      },
      medical: {
        createMedicalInfo: 'POST /api/app/medical',
        updateMedicalInfo: 'PUT /api/app/medical',
        getMedicalInfo: 'GET /api/app/medical'
      },
      medicalProfile: {
        getDashboard: 'GET /api/app/medical/profile',
        updateGeneralInfo: 'PUT /api/app/medical/general-info',
        updateConditions: 'PUT /api/app/medical/conditions',
        updateAllergies: 'PUT /api/app/medical/allergies',
        updateMedications: 'PUT /api/app/medical/medications',
        updateSurgeries: 'PUT /api/app/medical/surgeries',
        updateEmergencyInstructions: 'PUT /api/app/medical/emergency-instructions'
      },
      emergencyContacts: {
        addContact: 'POST /api/app/emergency/contact',
        getContacts: 'GET /api/app/emergency/contacts',
        getContact: 'GET /api/app/emergency/contact/:id',
        updateContact: 'PUT /api/app/emergency/contact/:id',
        deleteContact: 'DELETE /api/app/emergency/contact/:id',
        setPrimary: 'PUT /api/app/emergency/contact/:id/primary'
      },
      wristband: {
        register: 'POST /api/app/wristband/register',
        activate: 'POST /api/app/wristband/activate',
        revoke: 'POST /api/app/wristband/revoke',
        list: 'GET /api/app/wristband/list'
      },
      scan: {
        scanQR: 'POST /api/app/scan/qr (public)',
        scanNFC: 'POST /api/app/scan/nfc (public)',
        history: 'GET /api/app/scan/history'
      },
      userAccount: {
        changePassword: 'POST /api/app/user/password',
        uploadPhoto: 'POST /api/app/user/photo',
        deleteAccount: 'DELETE /api/app/user/account',
        updatePreferences: 'PUT /api/app/user/preferences',
        getPreferences: 'GET /api/app/user/preferences',
        getCompleteProfile: 'GET /api/app/user/complete'
      },
      family: {
        listFamilyMembers: 'GET /api/app/family',
        addDependent: 'POST /api/app/family',
        updateDependent: 'PUT /api/app/family/:id',
        deleteDependent: 'DELETE /api/app/family/:id'
      },
      health: 'GET /health'
    }
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
