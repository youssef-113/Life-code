/**
 * Healthcare API - Main Application Entry Point
 * 
 * A secure Node.js backend API built with Express and Firebase
 * Features:
 * - JWT-based authentication
 * - Firebase Auth integration
 * - Firestore database
 * - Security logging
 * - Session management
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import medicalRoutes from './routes/medicalRoutes.js';
import emergencyRoutes from './routes/emergencyRoutes.js';

// Import error handlers
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Security Middleware
 */

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for API usage
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));

// Request logging
app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Health Check Endpoint
 * Used by load balancers and monitoring services
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Healthcare API is running',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: '1.0.0'
  });
});

/**
 * API Routes
 */

// Authentication routes (public)
app.use('/api/auth', authRoutes);

// User routes (protected)
app.use('/api/users', userRoutes);

// Medical info routes (protected)
app.use('/api/medical', medicalRoutes);

// Emergency contacts routes (protected)
app.use('/api/emergency', emergencyRoutes);

/**
 * API Documentation Endpoint
 */
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Healthcare API',
    version: '1.0.0',
    documentation: {
      auth: {
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        logoutAll: 'POST /api/auth/logout-all (Protected)',
        refresh: 'POST /api/auth/refresh',
        sessions: 'GET /api/auth/sessions (Protected)',
        revokeSession: 'DELETE /api/auth/sessions/:sessionId (Protected)'
      },
      users: {
        getProfile: 'GET /api/users/me (Protected)',
        getCompleteProfile: 'GET /api/users/me/complete (Protected)',
        updateProfile: 'PUT /api/users/me (Protected)',
        deactivate: 'DELETE /api/users/me (Protected)'
      },
      medical: {
        getInfo: 'GET /api/medical (Protected)',
        createOrUpdate: 'POST /api/medical (Protected)',
        update: 'PUT /api/medical (Protected)',
        patch: 'PATCH /api/medical (Protected)',
        delete: 'DELETE /api/medical (Protected)'
      },
      emergency: {
        getContacts: 'GET /api/emergency (Protected)',
        createContact: 'POST /api/emergency (Protected)',
        getContact: 'GET /api/emergency/:contactId (Protected)',
        updateContact: 'PUT /api/emergency/:contactId (Protected)',
        deleteContact: 'DELETE /api/emergency/:contactId (Protected)',
        setPrimary: 'PUT /api/emergency/:contactId/primary (Protected)'
      }
    },
    authentication: {
      type: 'Bearer Token',
      header: 'Authorization: Bearer <your-jwt-token>',
      note: 'Obtain token from /api/auth/login endpoint'
    }
  });
});

/**
 * Error Handling
 */

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

/**
 * Start Server
 */
const startServer = () => {
  try {
    app.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log('🏥 Healthcare API Server');
      console.log('='.repeat(60));
      console.log(`Environment: ${NODE_ENV}`);
      console.log(`Port: ${PORT}`);
      console.log(`Health Check: http://localhost:${PORT}/health`);
      console.log(`API Docs: http://localhost:${PORT}/api`);
      console.log('='.repeat(60));
      console.log('Ready for requests!');
      console.log('='.repeat(60));
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

export default app;
