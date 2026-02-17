# LifeCode Healthcare API - Project Documentation Summary

**Project:** Healthcare API for LifeCode App  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026  
**Status:** ✅ Production Ready

---

## 📚 Documentation Files

### Core Documentation

1. **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** (Main Reference)
   - Complete endpoint specifications
   - Request/response examples
   - Error handling
   - Database schema reference
   - Firebase security rules summary

2. **[DATABASE_SCHEMA_MAPPING.md](./DATABASE_SCHEMA_MAPPING.md)** (Developer Reference)
   - Database ↔ Firebase Collections mapping
   - Field-level documentation
   - Firestore queries used by each endpoint
   - Data relationships and indexes
   - Performance optimization tips

3. **[API_IMPLEMENTATION_EXAMPLES.md](./API_IMPLEMENTATION_EXAMPLES.md)** (Code Samples)
   - cURL examples
   - JavaScript/Node.js examples
   - Python examples
   - iOS Swift examples
   - Android Kotlin examples
   - Error handling patterns

4. **[POSTMAN_COLLECTION.json](./POSTMAN_COLLECTION.json)** (API Testing)
   - Import this into Postman
   - Pre-configured endpoints
   - Environment variables
   - Auto-save auth tokens
   - Ready to test all endpoints

### Infrastructure Files

5. **[firebase.json](./firebase.json)**
   - Firebase configuration
   - Emulator ports
   - Rules and indexes file paths

6. **[firestore.rules](./firestore.rules)**
   - Security rules for all collections
   - Owner-only write access
   - Public read permissions
   - Immutable fields
   - Server-only collections

7. **[firestore.indexes.json](./firestore.indexes.json)**
   - Performance indexes
   - Query optimization

8. **[storage.rules](./storage.rules)**
   - File upload security rules
   - Size and type restrictions

9. **[.firebaserc](./.firebaserc)**
   - Environment configuration
   - Project aliases

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Firebase
```bash
npm install -g firebase-tools
firebase login
firebase deploy  # Deploys rules and indexes
```

### 3. Start Development Server
```bash
npm start
```

Server runs on `http://localhost:3000`

### 4. Test API Health
```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "success": true,
  "message": "Healthcare API is running",
  "version": "1.0.0"
}
```

### 5. View API Documentation
```bash
curl http://localhost:3000/api
```

Or visit: `http://localhost:3000/api`

---

## 📋 API Endpoints Overview

### Authentication (Public)
- `POST /api/auth/login` - Login with Firebase token
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout from session

### Authentication (Protected)
- `POST /api/auth/logout-all` - Logout all sessions
- `GET /api/auth/sessions` - List active sessions
- `DELETE /api/auth/sessions/:sessionId` - Revoke session

### Users (Protected)
- `GET /api/users/me` - Get current user profile
- `GET /api/users/me/complete` - Get profile with medical & contacts
- `PUT /api/users/me` - Update profile
- `PATCH /api/users/me` - Partial update
- `DELETE /api/users/me` - Deactivate account

### Medical Information (Protected)
- `GET /api/medical` - Get medical info
- `POST /api/medical` - Create/update medical info
- `PUT /api/medical` - Update
- `PATCH /api/medical` - Partial update
- `DELETE /api/medical` - Delete

### Emergency Contacts (Protected)
- `GET /api/emergency` - Get all contacts
- `GET /api/emergency/:contactId` - Get one contact
- `POST /api/emergency` - Create contact
- `PUT /api/emergency/:contactId` - Update contact
- `PATCH /api/emergency/:contactId` - Partial update
- `DELETE /api/emergency/:contactId` - Delete contact
- `PUT /api/emergency/:contactId/primary` - Set as primary

---

## 🗄️ Collections & Relationships

```
Users (uid)
├── Medical Info (1-to-1 relationship)
├── Emergency Contacts (1-to-many)
├── User Sessions (1-to-many)
├── Security Logs (1-to-many, auto-created)
└── Scan Logs (1-to-many, auto-created)
```

### Collection Purposes

| Collection | Purpose | Access |
|------------|---------|--------|
| `users` | User profiles and authentication | Owner only |
| `medicalInfo` | Medical info (one per user) | Public read, owner write |
| `emergencyContacts` | Emergency contact list | Public read, owner write |
| `userSessions` | Active sessions | Server only |
| `securityLogs` | Audit trail | Server only |

---

## 🔐 Security Architecture

### Authentication Flow
1. User logs in with Firebase ID token
2. Server verifies token with Firebase Auth
3. Creates session record in Firestore
4. Returns access and refresh tokens
5. Client includes access token in all API calls

### Authorization
- Every protected endpoint requires Bearer token
- Middleware verifies token and session in Firestore
- User can only access own data
- Automated ownership checks

### Security Logging
- All auth events logged automatically
- Action types: LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, etc.
- Includes: userId, IP address, user agent, timestamp
- Accessible in securityLogs collection

### Firebase Rules
- Helper functions: `isSignedIn()`, `isOwner()`, `immutable()`
- Public read, restricted write
- Server-only collections
- Immutable fields (QR codes, NFC tags)

---

## 🛠️ Implementation Stack

### Backend
- **Framework:** Express.js
- **Language:** Node.js (with ES modules)
- **Authentication:** Firebase Auth + JWT
- **Database:** Firestore
- **Security:** Helmet, CORS, Morgan
- **Utilities:** multer, UUID, dotenv

### Database
- **Primary:** Google Firestore
- **Auth:** Firebase Authentication
- **Storage:** Firebase Storage (optional)

### Development
- **Package Manager:** npm
- **Environment:** Node.js 18+
- **Development Server:** nodemon

---

## 📂 Project Structure

```
healthcare-api/
├── .firebaserc                          # Firebase env config
├── firebase.json                        # Firebase setup
├── firestore.rules                      # Firestore security rules
├── firestore.indexes.json               # Performance indexes
├── storage.rules                        # Storage security rules
├── firebase-service-account.json        # Service account (git-ignored)
├── package.json                         # Dependencies
├── 
├── API_DOCUMENTATION.md                 # Main API docs (THIS GIVES COMPLETE API REFERENCE)
├── DATABASE_SCHEMA_MAPPING.md           # DB schema guide
├── API_IMPLEMENTATION_EXAMPLES.md       # Code examples
├── POSTMAN_COLLECTION.json              # Postman collection
│
└── src/
    ├── app.js                           # Express app setup
    ├── config/
    │   └── firebase.js                  # Firebase Admin SDK init
    ├── routes/
    │   ├── authRoutes.js                # Auth endpoints
    │   ├── userRoutes.js                # User endpoints
    │   ├── medicalRoutes.js             # Medical info endpoints
    │   └── emergencyRoutes.js           # Emergency contacts endpoints
    ├── controllers/
    │   ├── authController.js            # Auth logic (login, logout, refresh, sessions)
    │   ├── userController.js            # User logic (profile, complete profile, deactivate)
    │   ├── medicalController.js         # Medical info CRUD
    │   └── emergencyController.js       # Emergency contacts CRUD
    ├── middleware/
    │   ├── auth.js                      # JWT verification & session validation
    │   └── errorHandler.js              # Global error handling
    └── utils/
        └── securityLogger.js            # Security event logging
```

---

## 🔄 Workflow Examples

### Complete Login & Profile Update Flow

```
1. User logs in with Firebase token
   POST /api/auth/login
   ├─ Verify Firebase ID token
   ├─ Create/get user in 'users' collection
   ├─ Create session in 'userSessions'
   ├─ Log in 'securityLogs'
   └─ Return access & refresh tokens

2. Store tokens in client (localStorage/secure storage)

3. Update user profile
   PUT /api/users/me
   ├─ Auth middleware verifies token
   ├─ Queries 'userSessions' to validate
   ├─ Updates 'users' collection
   └─ Return updated profile

4. Get complete profile with medical info
   GET /api/users/me/complete
   ├─ Query 'users' collection
   ├─ Query 'medicalInfo' (where userId == uid)
   ├─ Query 'emergencyContacts' (where userId == uid)
   └─ Return aggregated data
```

### Medical Information Workflow

```
1. Create medical info
   POST /api/medical
   ├─ Authenticate
   ├─ Query 'medicalInfo' (where userId == uid)
   ├─ If exists: Update | If not: Create
   └─ Return document

2. Update specific fields
   PATCH /api/medical
   ├─ Only update provided fields
   ├─ Set updatedAt timestamp
   └─ Return updated document

3. Delete medical info
   DELETE /api/medical
   ├─ Find and delete user's medical document
   └─ Confirm deletion
```

### Emergency Contacts Workflow

```
1. Create contact
   POST /api/emergency
   ├─ Validate phone numbers
   ├─ If isPrimary=true: Set all others to false (transaction)
   ├─ Create document with userId
   └─ Return contact

2. List contacts
   GET /api/emergency
   ├─ Query where userId == uid
   ├─ Sort by isPrimary DESC, createdAt DESC
   └─ Return contacts array with primary indicator

3. Update contact
   PUT /api/emergency/:contactId
   ├─ Verify ownership (contactData.userId == uid)
   ├─ Update fields
   ├─ Handle primary status change if needed
   └─ Return updated contact

4. Set as primary
   PUT /api/emergency/:contactId/primary
   ├─ Set all to isPrimary=false (batch)
   ├─ Set selected to isPrimary=true
   └─ Return updated contact
```

---

## 🧪 Testing

### Using Postman (Recommended)

1. Import `POSTMAN_COLLECTION.json` into Postman
2. Set `base_url` variable to `http://localhost:3000/api`
3. Login with `/api/auth/login` endpoint
4. Tokens auto-save to environment
5. Test all endpoints with pre-configured requests

### Using cURL

See `API_DOCUMENTATION.md` for cURL examples

### Using Your App Code

See `API_IMPLEMENTATION_EXAMPLES.md` for:
- JavaScript/Node.js
- Python
- iOS Swift
- Android Kotlin

---

## 📊 Database Queries Reference

### Key Queries Used

**Get user's medical info:**
```
db.collection('medicalInfo').where('userId', '==', uid).limit(1).get()
```

**Get active sessions:**
```
db.collection('userSessions')
  .where('userId', '==', uid)
  .where('isActive', '==', true)
  .orderBy('lastUsed', 'desc')
  .get()
```

**Get emergency contacts (primary first):**
```
db.collection('emergencyContacts')
  .where('userId', '==', uid)
  .orderBy('isPrimary', 'desc')
  .orderBy('createdAt', 'desc')
  .get()
```

**Get security logs:**
```
db.collection('securityLogs')
  .where('userId', '==', uid)
  .orderBy('timestamp', 'desc')
  .limit(50)
  .get()
```

---

## ⚙️ Configuration

### Environment Variables

Create `.env` file:
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-email@project.iam.gserviceaccount.com
JWT_SECRET=your-jwt-secret-key
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*
```

### Firebase Setup

1. Create Firebase project
2. Enable Firestore Database
3. Generate service account
4. Deploy security rules: `firebase deploy --only firestore:rules,firestore:indexes`

---

## 🚨 Common Issues & Solutions

### "Session is invalid or has been revoked"
- Token may have expired (24 hours)
- Session deleted or logged out
- Solution: Re-login to get new tokens

### "You do not have permission"
- Accessing another user's data
- Security rule blocking write
- Solution: Verify userId matches

### "Email already exists"
- Email already registered
- Solution: Use different email or reset account

### "Invalid blood type"
- Use: A+, A-, B+, B-, AB+, AB-, O+, O-
- Solution: Select from valid options

### "Validation Error"
- Missing required fields
- Invalid data format
- Solution: Check request body in API docs

---

## 📞 Support & Next Steps

### For Developers
1. Read `API_DOCUMENTATION.md` for complete specs
2. Check `DATABASE_SCHEMA_MAPPING.md` for data relationships
3. Review `API_IMPLEMENTATION_EXAMPLES.md` for code patterns
4. Use `POSTMAN_COLLECTION.json` for testing

### For Deployment
1. Set up Firebase project
2. Deploy security rules and indexes
3. Configure environment variables
4. Deploy Node.js server
5. Test all endpoints in production

### For Maintenance
1. Monitor `securityLogs` for suspicious activity
2. Check `userSessions` for orphaned sessions
3. Review error logs
4. Update Firestore indexes as needed

---

## 📝 File Descriptions

| File | Purpose | When to Use |
|------|---------|------------|
| API_DOCUMENTATION.md | Complete API reference | Building API clients |
| DATABASE_SCHEMA_MAPPING.md | DB ↔ API mapping | Understanding data flow |
| API_IMPLEMENTATION_EXAMPLES.md | Code samples | Writing client code |
| POSTMAN_COLLECTION.json | API testing tool | Testing endpoints |
| firebase.json | Firebase config | Deploying to Firebase |
| firestore.rules | Security rules | Protecting data |
| firestore.indexes.json | Query indexes | Performance tuning |

---

## ✅ Checklist

- [x] Express.js server with all routes
- [x] Firebase Auth integration
- [x] Firestore collections and queries
- [x] JWT token generation and verification
- [x] Session management system
- [x] Security logging (comprehensive)
- [x] Error handling middleware
- [x] CORS and security headers
- [x] Complete API documentation
- [x] Database schema mapping
- [x] Implementation examples
- [x] Postman collection
- [x] Firebase configuration files
- [x] Security rules

---

## 📈 What's Built

✅ **Authentication System**
- Login with Firebase tokens
- JWT-based session management
- Token refresh mechanism
- Multi-device session support
- Logout all sessions capability

✅ **User Management**
- Get/update user profiles
- Soft delete (deactivation)
- Complete profile retrieval
- Profile field validation

✅ **Medical Information**
- CRUD operations
- Blood type validation
- Chronic diseases/allergies/medications tracking
- Surgical history
- One-to-one user relationship

✅ **Emergency Contacts**
- CRUD operations
- Multi-contact support
- Primary contact designation
- Phone number validation
- One-to-many user relationship

✅ **Security**
- Password-less auth (Firebase)
- Role-based access control
- Ownership verification
- Immutable field protection
- Comprehensive audit logging

✅ **Database**
- Firestore collections
- Optimized indexes
- Security rules
- Data relationships

---

**API Version:** 1.0.0  
**Last Updated:** February 9, 2026  
**Status:** ✅ Ready for Production

For detailed information, refer to the individual documentation files listed above.
