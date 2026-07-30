<div align="center">

<img src="https://img.shields.io/badge/LifeCode-Scan%20For%20Life-1a56db?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0zIDNoNnYySDN6TTMgN2g0djJIM3pNMyAxMWg2djJIM3pNMyAxNWg0djJIM3pNMyAxOWg2djJIM3pNMTUgM2g2djJoLTZ6TTE1IDdoNHYyaC00ek0xNSAxMWg2djJoLTZ6TTE1IDE1aDR2MmgtNHpNMTUgMTloNnYyaC02ek05IDVoNnY2SDl6TTkgMTNoNnY2SDl6Ii8+PC9zdmc+" />

# 🏥 LifeCode — Backend, AI & Integration

### *Your Vital Information, Always Within Reach*

[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-life--code--yossfabdla311.replit.app-00b4d8?style=flat-square)](https://life-code-delta.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-youssef--113%2FLife--code-181717?style=flat-square&logo=github)](https://github.com/youssef-113/Life-code)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![NFC](https://img.shields.io/badge/NFC-QR%20Integration-1a56db?style=flat-square&logo=nfc)](./assist/NFC_BARCODE_WORKFLOW.md)
[![API](https://img.shields.io/badge/API-RESTful%20%7C%20Public%20Emergency-ff6b6b?style=flat-square&logo=postman)]()
[![Status](https://img.shields.io/badge/Status-Production%20Ready-22c55e?style=flat-square)]()

---

> **LifeCode** is a digital health identification ecosystem that bridges physical wearables (the LifeBand — NFC + QR) with a cloud-powered backend, ensuring first responders can access critical patient data instantly — even when the patient cannot speak.

---

## 📋 Table of Contents

1. [📄 Description](#-description)
2. [✨ Features](#-features)
3. [🛠️ Tech Stack](#%EF%B8%8F-tech-stack)
4. [📁 Project Structure](#-project-structure)
5. [⚙️ Installation](#%EF%B8%8F-installation)
6. [🔐 Environment Variables](#-environment-variables)
7. [▶️ Running the Project](#%EF%B8%8F-running-the-project)
8. [📡 API Documentation](#-api-documentation)
9. [🔗 API Endpoints](#-api-endpoints)
10. [🗄️ Database](#%EF%B8%8F-database)
11. [🔒 Security](#-security)
12. [🧪 Testing](#-testing)
13. [🚀 Deployment](#-deployment)
14. [🚧 Future Improvements](#-future-improvements)
15. [👨‍💻 Author](#-author)

---

## 📄 Description

**LifeCode** is an emergency health identification platform that bridges **physical NFC/QR wearables** with **cloud-based medical data**. When every second counts, first responders can instantly access critical patient information — even when the patient cannot speak.

### 🎯 Core Capabilities

| Feature | Description | Impact |
|---------|-------------|--------|
| **📲 NFC/QR Integration** | Read/write KCAD data to NFC tags; generate scannable QR codes | Offline + Online access |
| **⚡ Emergency Access** | Public API for first responders | <2 seconds data retrieval |
| **🔐 Secure Auth** | Multi-provider (Email, Google, Apple) with JWT | Enterprise-grade security |
| **📊 Medical Profiles** | Blood type, allergies, medications, emergency contacts | Complete health picture |
| **⌚ LifeBand Management** | Pair and manage wearable devices | Always-on identification |

### 🔄 The LifeCode Workflow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Patient has   │     │  First Responder │     │  Emergency Data │
│  LifeBand/NFC   │ →   │    Scans Code   │ →   │  Retrieved in <2s │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         ↓                       ↓                       ↓
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  NFC: Local     │     │  QR: Cloud API  │     │  Medical Info   │
│  Data Storage   │     │  `/public/user` │     │  Contacts       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Designed for zero-latency emergency access** — because in an emergency, every second matters.

---

## ✨ Features

### 🔐 Authentication & Security
- **Multi-Provider Auth**: Email/password, Google Sign-In, Apple Sign-In
- **Account Linking**: Link multiple providers to one account
- **JWT Tokens**: 15-day session expiration with refresh token support
- **Suspicious Login Detection**: Flags unusual access patterns
- **Session Management**: View and revoke active sessions across devices

### 👤 User Management
- **Profile Management**: Personal info, photo upload to Firebase Storage
- **Preferences**: Notification settings, privacy controls
- **Complete Profile**: Aggregate view of user + medical + wristbands + contacts

### 🏥 Medical Information
- **Medical Profile**: Blood type, height, weight, chronic conditions
- **Allergies**: With severity levels and yes/no confirmation
- **Medications**: Dosage, schedule, and notes
- **Surgeries**: History with dates and complications
- **Emergency Instructions**: Critical notes for first responders

### 📞 Emergency Contacts
- **Multiple Contacts**: Up to 10 contacts per user
- **Multiple Phone Numbers**: Up to 5 numbers per contact
- **Primary Contact Designation**: Mark most important contact
- **Relationship Types**: Father, Mother, Friend, Sister, Brother, Spouse, Other

### ⌚ Wristband (LifeBand) Management
- **Registration**: Pair wristband via QR code or NFC tag
- **Activation/Revocation**: Control wristband status
- **Primary Wristband**: Designate main wearable
- **User Resolution**: Lookup users by QR/NFC for scanning

### 📱 Scan Operations & NFC/Barcode Integration
- **QR Code Generation**: Create scannable codes linking to emergency profiles
- **NFC Tag Management**: Read/write KCAD data directly to NFC tags
- **Public Emergency Access**: Unauthenticated endpoint for first responders
- **Scan History**: Track who accessed your information with location metadata
- **Privacy Controls**: Choose what data appears on scan

**🔄 NFC & Barcode Workflow:**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  NFC Tag    │ ↔️ │  Mobile App │ ↔️ │   Cloud     │
│  (Local)    │    │  (Bridge)   │    │  (Online)   │
└─────────────┘    └─────────────┘    └─────────────┘
       ↓                                      ↓
┌─────────────┐                         ┌─────────────┐
│ QR/Barcode  │ ←── User ID encoded ───→│ Emergency   │
│  Scanner    │                         │  Access     │
└─────────────┘                         └─────────────┘
```

**Key Capabilities:**
- **Offline Access**: NFC stores critical data locally
- **Online Verification**: Barcodes link to cloud profiles
- **Dual Mode**: Works with or without internet connectivity
- **Instant Response**: <2 seconds emergency data retrieval

### 👨‍👩‍👧 Family Management
- **Dependent Profiles**: Manage profiles for children/elderly
- **Lost Child Mode**: Special emergency flag for minors
- **Relationship Tracking**: Spouse, Son, Daughter, Parent, Sibling

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Runtime** | Node.js 18+ | JavaScript runtime environment |
| **Framework** | Express.js 4.x | RESTful API framework |
| **Database** | Firebase Firestore | NoSQL document database |
| **Authentication** | Firebase Auth + JWT | Secure user authentication |
| **Storage** | Firebase Storage | Profile photo storage |
| **Validation** | express-validator | Input validation & sanitization |
| **Security** | Helmet + express-rate-limit | Security headers & rate limiting |
| **File Upload** | Multer | Multipart form data handling |
| **Testing** | Jest | Unit testing framework |
| **Process Manager** | Nodemon | Development auto-restart |

### Key Dependencies
```json
{
  "express": "^4.18.2",
  "firebase-admin": "^12.0.0",
  "express-validator": "^7.0.1",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3",
  "multer": "^1.4.5-lts.1",
  "helmet": "^7.1.0",
  "express-rate-limit": "^7.1.5",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1"
}
```

---

## 📁 Project Structure

```
Life-code/
├── 📁 config/              # Configuration files
│   └── firebase.js        # Firebase Admin SDK initialization
│
├── 📁 controllers/        # Route controllers (request handlers)
│   ├── emergencyContactController.js
│   ├── familyController.js
│   ├── loginController.js
│   ├── medicalController.js
│   ├── medicalProfileController.js
│   ├── registerController.js
│   ├── scanController.js
│   ├── socialAuthController.js
│   ├── userAccountController.js
│   ├── userProfileController.js
│   └── wristbandController.js
│
├── 📁 middleware/          # Express middleware
│   ├── authMiddleware.js         # JWT verification
│   ├── errorHandler.js           # Global error handling
│   ├── rateLimitMiddleware.js  # Rate limiting
│   └── validationMiddleware.js # Validation helpers
│
├── 📁 routes/              # API route definitions
│   ├── emergencyContactRoutes.js
│   ├── familyRoutes.js
│   ├── loginRoutes.js
│   ├── medicalProfileRoutes.js
│   ├── medicalRoutes.js
│   ├── registerRoutes.js
│   ├── scanRoutes.js
│   ├── socialAuthRoutes.js
│   ├── userAccountRoutes.js
│   ├── userProfileRoutes.js
│   └── wristbandRoutes.js
│
├── 📁 services/            # Business logic layer
│   ├── authService.js
│   ├── emergencyContactService.js
│   ├── familyService.js
│   ├── medicalProfileService.js
│   ├── medicalService.js
│   ├── profileCompletionService.js
│   ├── scanService.js
│   ├── socialAuthService.js
│   ├── userAccountService.js
│   ├── userProfileService.js
│   └── wristbandService.js
│
├── 📁 src/
│   └── index.js            # Application entry point
│
├── 📁 utils/               # Utility functions
│
├── 📁 assist/              # Documentation & assets
│
├── .env.example            # Environment variable template
├── .env                    # Environment variables (not in git)
├── package.json            # Dependencies & scripts
├── API_DOCUMENTATION.md    # Complete API reference
├── firebase.json           # Firebase configuration
├── firestore.rules         # Firestore security rules
└── readme.md               # This file
```

---

## ⚙️ Installation

### Prerequisites
- **Node.js**: Version 18 or higher
- **npm**: Comes with Node.js
- **Firebase Project**: Create at [Firebase Console](https://console.firebase.google.com/)
- **Google Cloud**: For OAuth credentials (optional)

### Step-by-Step Setup

1. **Clone the repository**
```bash
git clone https://github.com/youssef-113/Life-code.git
cd Life-code
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Firebase**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project (or use existing)
   - Enable **Authentication** (Email/Password, Google, Apple)
   - Enable **Firestore Database** (start in test mode for development)
   - Enable **Firebase Storage**
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download the JSON file and save as `firebase-service-account.json` in project root

4. **Configure environment variables**
```bash
cp .env.example .env
```

   Edit `.env` with your values (see [Environment Variables](#-environment-variables) section)

5. **Set up Firestore indexes** (if needed)
   - The app will run without custom indexes
   - Check Firestore console for index suggestions if you see query errors

---

## 🔐 Environment Variables

Create a `.env` file in the project root with the following variables:

### Required Variables

```bash
# Server Configuration
PORT=3000                          # Server port (default: 3000)
NODE_ENV=development               # Environment: development, production

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# CORS Configuration
CORS_ORIGIN=*                      # Allowed origins (* for all, or specific domains)
```





---

## Running the Project

### Development Mode (with auto-restart)
```bash
npm run dev
```
Server runs at `http://localhost:3000` with nodemon watching for changes.

### Production Mode
```bash
npm start
```

### Verify Installation
Once running, test the health endpoint:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-04-05T12:00:00.000Z",
  "version": "1.0.0"
}
```

### Base URL
```
Development: http://localhost:3000/api/app
Production:  https://your-domain.com/api/app
```

---

## API Documentation

### Complete Documentation
📄 **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference with:
- Detailed request/response examples
- Field validation rules
- Flutter integration code snippets
- Error handling guides
- Data models

### Postman Collection
🚀 **[LifeCode_API_Collection.postman_collection.json](./LifeCode_API_Collection.postman_collection.json)** - Import into Postman for testing

### Interactive API Explorer
The API does not include Swagger UI, but you can use:
- **Postman** (recommended)
- **Insomnia**
- **curl** commands
- Flutter app for end-to-end testing

---

## API Endpoints

### Authentication

#### Register a new user

```bash
POST /api/auth/register HTTP/1.1
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Login an existing user

```bash
POST /api/auth/login HTTP/1.1
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Logout the current user

```bash
POST /api/auth/logout HTTP/1.1
Content-Type: application/json
```

### User Management

#### Get the current user's profile

```bash
GET /api/users/me HTTP/1.1
Content-Type: application/json
```

#### Update the current user's profile

```bash
PUT /api/users/me HTTP/1.1
Content-Type: application/json

{
  "name": "John Doe",
  "email": "user@example.com"
}
```

#### Delete the current user's account

```bash
DELETE /api/users/me HTTP/1.1
Content-Type: application/json
```

### Medical Information

#### Get the current user's medical profile

```bash
GET /api/medical/me HTTP/1.1
Content-Type: application/json
```

#### Update the current user's medical profile

```bash
PUT /api/medical/me HTTP/1.1
Content-Type: application/json

{
  "bloodType": "A+",
  "allergies": ["Penicillin"]
}
```

#### Delete the current user's medical profile

```bash
DELETE /api/medical/me HTTP/1.1
Content-Type: application/json
```

### Emergency Contacts

#### Get the current user's emergency contacts

```bash
GET /api/contacts/me HTTP/1.1
Content-Type: application/json
```

#### Add a new emergency contact

```bash
POST /api/contacts/me HTTP/1.1
Content-Type: application/json

{
  "name": "Jane Doe",
  "phone": "+1234567890"
}
```

#### Update an existing emergency contact

```bash
PUT /api/contacts/me/:id HTTP/1.1
Content-Type: application/json

{
  "name": "Jane Doe",
  "phone": "+1234567890"
}
```

#### Delete an emergency contact

```bash
DELETE /api/contacts/me/:id HTTP/1.1
Content-Type: application/json
```

### Wristband Management

#### Get the current user's wristbands

```bash
GET /api/wristbands/me HTTP/1.1
Content-Type: application/json
```

#### Register a new wristband

```bash
POST /api/wristbands/me HTTP/1.1
Content-Type: application/json

{
  "wristbandId": "1234567890"
}
```

#### Update an existing wristband

```bash
PUT /api/wristbands/me/:id HTTP/1.1
Content-Type: application/json

{
  "wristbandId": "1234567890"
}
```

#### Delete a wristband

```bash
DELETE /api/wristbands/me/:id HTTP/1.1
Content-Type: application/json
```

### Scan Operations

#### Get the current user's scan history

```bash
GET /api/scan/me HTTP/1.1
Content-Type: application/json
```

#### Scan a new QR code or NFC tag

```bash
POST /api/scan/me HTTP/1.1
Content-Type: application/json

{
  "qrCode": "https://example.com/qr-code"
}
```

---

## 🗄️ Database

### Firebase Firestore

LifeCode uses **Firebase Firestore** (NoSQL document database) for flexible, scalable data storage.

### Collections

#### `Users` - Core user accounts
```javascript
{
  UserID: "auto-generated-uid",
  Username: "yousseff besso",
  Email: "user@example.com",
  PhoneNumber: "+20xxxxxxxxxx",
  PhotoURL: "https://storage.googleapis.com/...",
  PhotoType: "storage",
  Providers: ["email", "google"],
  PrimaryProvider: "email",
  IsActive: true,
  CreatedAt: Timestamp,
  UpdatedAt: Timestamp
}
```

#### `MedicalInfo` - Medical profiles
```javascript
{
  UserID: "reference-to-users",
  BloodType: "A+",
  Height: "180cm",
  Weight: "75kg",
  MedicalConditions: ["Diabetes", "Hypertension"],
  HasAllergies: true,
  Allergies: [
    { AllergyType: "Peanuts", Severity: "Severe", Notes: "Anaphylaxis risk" }
  ],
  HasMedications: true,
  Medications: [
    { MedicationName: "Insulin", Dosage: "10 units", Schedule: "Daily", Notes: "" }
  ],
  HasSurgeries: true,
  Surgeries: [
    { SurgeryName: "Appendectomy", SurgeryDate: "2020-01-15", Notes: "" }
  ],
  EmergencyInstructions: "Check blood sugar immediately"
}
```

#### `EmergencyContacts` - Emergency contacts
```javascript
{
  UserID: "reference-to-users",
  ContactName: "Jane besso",
  PhoneNumbers: ["+201234567890", "+201234567891"],
  Relationship: "Spouse",
  IsPrimary: true,
  Notes: "Primary emergency contact",
  CreatedAt: Timestamp
}
```

#### `Wristbands` - LifeBand devices
```javascript
{
  UserID: "reference-to-users",
  SerialNumber: "SN-2026-00001",
  QRCode: "QR123456",
  NFCTag: "NFC-ABC-123",
  Status: "active", // active, revoked, pending
  IsActive: true,
  IsPrimary: true,
  ActivatedAt: Timestamp,
  CreatedAt: Timestamp
}
```

#### `UserProfiles` - Extended profile data
```javascript
{
  UserID: "reference-to-users",
  EmergencyContacts: [...], // Array format
  MedicalInfoID: "reference",
  Preferences: {
    PushNotifications: true,
    EmailNotifications: true,
    ShowMedicalOnScan: true,
    ShowContactsOnScan: true,
    ShowPhotoOnScan: true
  }
}
```

#### `FamilyMembers` - Dependent profiles
```javascript
{
  GuardianUserID: "reference-to-users",
  Name: "Child Name",
  Relation: "Son",
  DateOfBirth: "2020-01-15",
  IsChild: true,
  LostChildMode: false,
  MedicalProfileID: "reference"
}
```

#### `UserSessions` - Session tracking
```javascript
{
  UserID: "reference-to-users",
  SessionToken: "jwt-token-hash",
  RefreshToken: "refresh-token-hash",
  DeviceName: "Chrome on Windows",
  DeviceType: "browser",
  IPAddress: "192.168.1.1",
  IsActive: true,
  ExpiresAt: Timestamp,
  LastUsed: Timestamp,
  CreatedAt: Timestamp
}
```

#### `SecurityLogs` - Security events
```javascript
{
  UserID: "reference-to-users",
  EventType: "LOGIN | LOGOUT | PASSWORD_CHANGED | SUSPICIOUS_LOGIN",
  IPAddress: "192.168.1.1",
  DeviceInfo: "Chrome on Windows",
  Timestamp: Timestamp
}
```

#### `ScanLogs` - Scan tracking
```javascript
{
  UserID: "scanned-user-id",
  ScannerUserID: "scanner-user-id",
  QRCode: "QR123456",
  Latitude: 30.0444,
  Longitude: 31.2357,
  Location: "Cairo, Egypt",
  ScannerType: "emergency",
  ScannedAt: Timestamp
}
```

---

## 🔒 Security

### Authentication
- **JWT Tokens**: Stateless authentication with 15-day expiration
- **Refresh Tokens**: Long-lived tokens for session renewal
- **Firebase Auth**: Industry-standard authentication backend
- **Multi-Factor**: Support for email verification and device trust

### Authorization
- **Bearer Token**: All protected endpoints require `Authorization: Bearer <token>`
- **Ownership Verification**: Users can only access their own data
- **Privacy Controls**: Users choose what data appears on public scans

### Data Protection
- **TLS 1.3**: All API traffic encrypted in transit
- **Firebase Security Rules**: Database-level access control
- **AES-256**: Data encrypted at rest in Firestore
- **Helmet.js**: Security headers (XSS, CSRF protection)
- **Rate Limiting**: DDoS protection with request throttling

### Input Validation
- **express-validator**: Strict input validation on all endpoints
- **Sanitization**: SQL/NoSQL injection prevention
- **File Upload**: Image type validation, 5MB size limit

### Security Headers
```javascript
// Helmet.js provides:
- Strict-Transport-Security
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Content-Security-Policy
- X-DNS-Prefetch-Control
- X-Powered-By: hidden
```

### Rate Limiting
- **Window**: 15 minutes
- **Max Requests**: 100 per IP per window
- **Authenticated**: 1000 per user per window

---

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.js
```

### Test Structure
```
📁 tests/
├── 📁 unit/              # Unit tests for services
│   ├── authService.test.js
│   ├── medicalService.test.js
│   └── ...
├── 📁 integration/       # API endpoint tests
│   ├── authRoutes.test.js
│   └── ...
└── 📁 fixtures/          # Test data
    └── users.json
```

### Manual Testing with Postman
1. Import `LifeCode_API_Collection.postman_collection.json`
2. Create environment with `baseUrl` variable
3. Use "Register" request to create test user
4. Save returned token to environment
5. Test protected endpoints

### Testing Checklist
- [ ] User registration (email, Google, Apple)
- [ ] Login and token refresh
- [ ] Profile CRUD operations
- [ ] Emergency contacts management
- [ ] Medical profile updates
- [ ] Wristband registration
- [ ] QR/NFC scanning (public endpoints)
- [ ] File upload (profile photo)
- [ ] Session management
- [ ] Account deletion

---

## 🚀 Deployment

### Option 1: Replit (Current)
The project is currently hosted on Replit:
- **URL**: https://life-code--yossfabdla311.replit.app
- **Status**: Live development environment

### Option 2: Traditional VPS/Cloud

#### Deploy to Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create lifecode-api

# Set environment variables
heroku config:set JWT_SECRET=your-secret
heroku config:set FIREBASE_PROJECT_ID=your-project
# ... (set all env vars)

# Deploy
git push heroku main
```

#### Deploy to AWS/VPS
```bash
# Build for production
npm ci --only=production

# Use PM2 for process management
npm install -g pm2

# Start with PM2
pm2 start src/index.js --name lifecode-api

# Save PM2 config
pm2 save
pm2 startup
```

#### Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "src/index.js"]
```

```bash
# Build and run
docker build -t lifecode-api .
docker run -p 3000:3000 --env-file .env lifecode-api
```

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT_SECRET (min 32 chars)
- [ ] Configure CORS for specific domains only
- [ ] Enable Firebase App Check
- [ ] Set up monitoring (PM2, New Relic, etc.)
- [ ] Configure log rotation
- [ ] Set up SSL certificate
- [ ] Configure backup strategy
- [ ] Set up error tracking (Sentry)
- [ ] Performance testing

---

## 🚧 Future Improvements

### Planned Features
- **HL7 FHIR Integration**: Hospital system interoperability (Epic, Cerner)
- **AI Medical OCR**: Upload documents, auto-extract medical data
- **Emergency Alerts**: Real-time notifications to emergency contacts
- **Medication Reminders**: Push notifications for medication schedules
- **Health Insights**: AI-powered health trend analysis
- **Multi-Language Support**: i18n for Arabic, French, Spanish

### Compliance Roadmap
| Standard | Market | Status |
|----------|--------|--------|
| **HIPAA** | United States | Architecture mapped |
| **GDPR** | European Union | Data deletion pipeline ready |
| **HL7 FHIR R4** | Global | Planned v4.0 |

### Performance Enhancements
- Redis caching for frequent queries
- GraphQL API for flexible data fetching
- WebSocket support for real-time updates
- CDN optimization for photo delivery

---

## 👨‍💻 Author

**Youssef Besso**

- GitHub: [@youssef-113](https://github.com/youssef-113)
- Project: [Life-code](https://life-code-delta.vercel.app/)

### Contributors
Team LifeCode - Building to save lives

---

<div align="center">

**LifeCode** · Scan For Life · 2026

[![Live](https://img.shields.io/badge/🌐%20Visit%20Live%20App-00b4d8?style=for-the-badge)](https://life-code-delta.vercel.app/)

*Built with my and my team to save lives*

</div>
