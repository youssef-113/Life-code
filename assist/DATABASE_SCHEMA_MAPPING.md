# Database Schema ↔ API Endpoints Mapping

**Version:** 1.0.0  
**Last Updated:** February 9, 2026

This document shows the relationship between your database schema and API endpoints.

---

## 📊 Collections Overview

### Collections & Their Relationships

```
Users (1 user)
├── Medical Info (0-1 medical record per user)
├── Emergency Contacts (0-many contacts per user)
├── User Sessions (0-many active sessions per user)
├── Security Logs (0-many log entries per user)
└── Scan Logs (0-many scans per user)
```

---

## 👤 USERS Collection

**Database Table:** `Users`  
**Firebase Collection:** `users`  
**Document ID:** Firebase UID (uid)  
**Relationships:** 
- One-to-One with MedicalInfo
- One-to-Many with EmergencyContacts
- One-to-Many with UserSessions
- One-to-Many with SecurityLogs

### Schema Fields

```javascript
{
  // Document ID = Firebase UID (uid)
  username: string,              // Username (2-50 chars)
  email: string,                 // Email (unique)
  gender: string,                // male, female, other, prefer_not_to_say
  nationalId: string,            // National ID (5-20 chars)
  photoUrl: string,              // URL to profile photo
  isActive: boolean,             // Account active/deactivated
  createdAt: Timestamp,          // Account creation time
  updatedAt: Timestamp           // Last profile update
}
```

### Related Endpoints

| Method | Endpoint | Operation | Firestore Operation |
|--------|----------|-----------|---------------------|
| GET | `/api/users/me` | Get my profile | Read user doc |
| PUT | `/api/users/me` | Update profile | Update user doc |
| PATCH | `/api/users/me` | Partial update | Update user doc (partial) |
| DELETE | `/api/users/me` | Deactivate account | Update `isActive=false`, deactivate all sessions |
| GET | `/api/users/me/complete` | Get profile + medical + contacts | Read user, medicalInfo, emergencyContacts docs |

### Related Security Logs

- **LOGIN_SUCCESS** - Created when user logs in
- **LOGIN_FAILED** - Created when login fails (isActive=false)
- **LOGOUT** - Created when user logs out
- **SESSION_REVOKED** - Created when session is revoked
- **UNAUTHORIZED_ACCESS** - Attempted access to other user's data

### Database Queries

```javascript
// Get user profile
db.collection('users').doc(uid).get()

// Update user profile
db.collection('users').doc(uid).update({...})

// Check if user exists (for new account)
db.collection('users').doc(uid).get()

// Deactivate account
db.collection('users').doc(uid).update({ isActive: false })

// Get all users (admin - not exposed in API)
db.collection('users')
  .where('isActive', '==', true)
  .orderBy('createdAt', 'desc')
```

---

## 🏥 MEDICAL INFO Collection

**Database Table:** `MedicalInfo`  
**Firebase Collection:** `medicalInfo`  
**Document ID:** Auto-generated  
**Relationships:**
- One-to-One with Users (userId is unique)

### Schema Fields

```javascript
{
  userId: string,                // Unique - one medical record per user
  bloodType: string,             // A+, A-, B+, B-, AB+, AB-, O+, O-
  height: number,                // Height in cm
  weight: number,                // Weight in kg
  chronicDiseases: string,       // Comma-separated list
  allergies: string,             // Comma-separated list
  medications: string,           // Comma-separated list
  surgeries: string,             // Comma-separated list
  notes: string,                 // Additional medical notes
  updatedAt: Timestamp           // Last update time
}
```

### Related Endpoints

| Method | Endpoint | Operation | Firestore Operation |
|--------|----------|-----------|---------------------|
| GET | `/api/medical` | Get medical info | Query where userId == uid, limit 1 |
| POST | `/api/medical` | Create or update | Create new or update existing |
| PUT | `/api/medical` | Update (alias) | Update document |
| PATCH | `/api/medical` | Partial update | Update specified fields only |
| DELETE | `/api/medical` | Delete medical info | Delete document |

### Database Queries

```javascript
// Get user's medical info
db.collection('medicalInfo')
  .where('userId', '==', uid)
  .limit(1)
  .get()

// Create medical info
db.collection('medicalInfo').add({
  userId: uid,
  // ... other fields
})

// Update medical info
db.collection('medicalInfo')
  .where('userId', '==', uid)
  .limit(1)
  .get()
  // then update the found document

// Delete medical info
// Delete the found document
```

### Validation Rules

```javascript
bloodType:         Must be A+, A-, B+, B-, AB+, AB-, O+, O-
height:            Number (positive)
weight:            Number (positive)
chronicDiseases:   String (max 500 chars)
allergies:         String (max 500 chars)
medications:       String (max 500 chars)
surgeries:         String (max 500 chars)
notes:             String (max 1000 chars)
```

### Firebase Security Rules

```
match /medicalInfo/{id} {
  allow read: if true;  // Public read access
  allow write: if isOwner(resource.data.userId);  // Only owner can write
}
```

---

## 🚨 EMERGENCY CONTACTS Collection

**Database Table:** `EmergencyContacts`  
**Firebase Collection:** `emergencyContacts`  
**Document ID:** Auto-generated  
**Relationships:**
- Many-to-One with Users (one-to-many)
- isPrimary property distinguishes the primary contact

### Schema Fields

```javascript
{
  userId: string,                // User who owns this contact
  contactName: string,           // Contact's name (2-100 chars)
  relation: string,              // Relationship (e.g., Spouse, Brother)
  phoneNumber: string,           // E.164 format (+201234567890)
  secondaryPhone: string,        // Secondary phone (optional)
  isPrimary: boolean,            // Is this the primary contact?
  createdAt: Timestamp           // When contact was created
}
```

### Related Endpoints

| Method | Endpoint | Operation | Firestore Operation |
|--------|----------|-----------|---------------------|
| GET | `/api/emergency` | Get all contacts | Query where userId == uid |
| GET | `/api/emergency/:contactId` | Get one contact | Read specific doc, verify userId |
| POST | `/api/emergency` | Create contact | Create new doc, manage isPrimary |
| PUT | `/api/emergency/:contactId` | Update contact | Update doc, manage isPrimary |
| PATCH | `/api/emergency/:contactId` | Partial update | Update specified fields |
| DELETE | `/api/emergency/:contactId` | Delete contact | Delete doc |
| PUT | `/api/emergency/:contactId/primary` | Set as primary | Update isPrimary flags |

### Database Queries

```javascript
// Get all contacts for user
db.collection('emergencyContacts')
  .where('userId', '==', uid)
  .orderBy('isPrimary', 'desc')
  .orderBy('createdAt', 'desc')
  .get()

// Get specific contact and verify ownership
db.collection('emergencyContacts').doc(contactId).get()
// Check: contactData.userId === uid

// Create contact
db.collection('emergencyContacts').add({
  userId: uid,
  contactName: name,
  // ...
})

// Set as primary
// First, set all other isPrimary to false
db.collection('emergencyContacts')
  .where('userId', '==', uid)
  .where('isPrimary', '==', true)
  .get()
  // Update all to false
// Then set the selected one to true

// Delete contact
db.collection('emergencyContacts').doc(contactId).delete()
```

### Validation Rules

```javascript
contactName:      String (2-100 chars, required)
phoneNumber:      E.164 format (+20...), required
secondaryPhone:   E.164 format (optional)
relation:         String (optional)
isPrimary:        Boolean (default: false)
```

### Firebase Security Rules

```
match /emergencyContacts/{id} {
  allow read: if true;  // Public read access
  allow write: if isOwner(request.resource.data.userId);  // Only owner can write
}
```

---

## 🔐 USER SESSIONS Collection

**Database Table:** `UserSessions`  
**Firebase Collection:** `userSessions`  
**Document ID:** Auto-generated  
**Relationships:**
- Many-to-One with Users (one-to-many)
- Read/managed by AUTH_MIDDLEWARE

### Schema Fields

```javascript
{
  userId: string,                // User who owns this session
  sessionToken: string,          // JWT access token (unique)
  refreshToken: string,          // Refresh token UUID (unique)
  userAgent: string,             // Browser/app user agent
  ipAddress: string,             // Client IP address
  isActive: boolean,             // Is session still valid?
  createdAt: Timestamp,          // Session creation time
  expiresAt: Timestamp,          // Session expiration time (24hrs)
  lastUsed: Timestamp            // Last API call with this token
}
```

### Related Endpoints

| Method | Endpoint | Operation | Firestore Operation |
|--------|----------|-----------|---------------------|
| POST | `/api/auth/login` | Create session | Create new session doc |
| POST | `/api/auth/logout` | Deactivate session | Set isActive=false |
| POST | `/api/auth/logout-all` | Deactivate all | Batch update all to isActive=false |
| POST | `/api/auth/refresh` | Refresh tokens | Update session with new tokens |
| GET | `/api/auth/sessions` | List active sessions | Query where userId==uid and isActive==true |
| DELETE | `/api/auth/sessions/:sessionId` | Revoke session | Set isActive=false |

### Database Queries

```javascript
// Create session after successful login
db.collection('userSessions').add({
  userId: uid,
  sessionToken: accessToken,
  refreshToken: refreshToken,
  userAgent: getUserAgent(req),
  ipAddress: getClientIp(req),
  isActive: true,
  createdAt: Timestamp.now(),
  expiresAt: Timestamp.fromDate(expiresAt),
  lastUsed: Timestamp.now()
})

// Verify session in auth middleware
db.collection('userSessions')
  .where('sessionToken', '==', token)
  .where('isActive', '==', true)
  .limit(1)
  .get()

// Get all active sessions
db.collection('userSessions')
  .where('userId', '==', uid)
  .where('isActive', '==', true)
  .orderBy('lastUsed', 'desc')
  .get()

// Logout - deactivate session
db.collection('userSessions').doc(sessionId).update({
  isActive: false,
  lastUsed: Timestamp.now()
})

// Logout all - batch update
batch.update(sessionRef, { isActive: false })
```

### Session Lifecycle

```
user logs in
    ↓
creates -> userSessions doc (isActive: true)
    ↓
user makes authenticated request
    ↓
middleware verifies sessionToken in userSessions
    ↓
updates lastUsed timestamp
    ↓
user logs out
    ↓
sets isActive: false
```

### Security

- JWT tokens are stored as `sessionToken` in Firestore
- Middleware checks: token exists, isActive=true, not expired
- Automatic expiration: 24 hours from creation
- Manual revocation: set isActive=false
- Multi-device support: multiple sessions per user

### Firebase Security Rules

```
match /userSessions/{id} {
  allow read, write: if request.auth.token.admin == true;
  // Server-only access
}
```

---

## 🔒 SECURITY LOGS Collection

**Database Table:** `SecurityLogs`  
**Firebase Collection:** `securityLogs`  
**Document ID:** Auto-generated  
**Relationships:**
- Many-to-One with Users (one-to-many)
- Read-only for users (via audit queries)

### Schema Fields

```javascript
{
  userId: string,                // User (nullable for failed logins)
  actionType: string,            // Type of security event
  ipAddress: string,             // Client IP address
  userAgent: string,             // Browser/app user agent
  metadata: object,              // Additional data (reason, sessionId, etc)
  timestamp: Timestamp           // When event occurred
}
```

### Security Log Action Types

```
LOGIN_SUCCESS           - User successfully logged in
LOGIN_FAILED            - Login attempt failed
LOGOUT                  - User logged out
PASSWORD_CHANGED        - User changed password
SESSION_REVOKED         - Session was revoked
UNAUTHORIZED_ACCESS     - Attempted access to other user's data
TOKEN_REFRESHED         - Token was refreshed
ACCOUNT_LOCKED          - Account locked (future use)
SUSPICIOUS_ACTIVITY     - Suspicious activity detected
```

### Auto-Logged Events

| Event | When | What's Logged |
|-------|------|--------------|
| LOGIN_SUCCESS | User logs in successfully | userId, ipAddress, userAgent, sessionId |
| LOGIN_FAILED | Login fails | attempt details, ipAddress, userAgent, reason |
| LOGOUT | User logs out | userId, ipAddress, userAgent, sessionId |
| SESSION_REVOKED | Session is revoked | userId, sessionId, ipAddress, userAgent |
| UNAUTHORIZED_ACCESS | User accesses other user's data | userId, resource, ipAddress |

### Database Queries

```javascript
// Log security event
db.collection('securityLogs').add({
  userId: uid,
  actionType: 'LOGIN_SUCCESS',
  ipAddress: clientIp,
  userAgent: userAgent,
  metadata: { sessionId: sessionId },
  timestamp: Timestamp.now()
})

// Get user's security logs (for audit)
db.collection('securityLogs')
  .where('userId', '==', uid)
  .orderBy('timestamp', 'desc')
  .limit(50)
  .get()

// Find failed login attempts
db.collection('securityLogs')
  .where('actionType', '==', 'LOGIN_FAILED')
  .orderBy('timestamp', 'desc')
  .get()
```

### Firebase Security Rules

```
match /securityLogs/{id} {
  allow read: if false;  // No client read access
  allow write: if request.auth.token.admin == true;  // Server only
}
```

---

## 📊 Data Flow Diagram

### Login Flow

```
POST /api/auth/login
  ↓
Firebase Auth verifies idToken
  ↓
Check if user exists in 'users' collection
  ├─ If not: Create new user doc
  └─ If yes: Get user data
  ↓
Create session record in 'userSessions'
  ↓
Log LOGIN_SUCCESS in 'securityLogs'
  ↓
Return accessToken & refreshToken
```

### Authenticated Request Flow

```
GET /api/users/me
+ Header: Authorization: Bearer <token>
  ↓
auth middleware extracts token
  ↓
Verify JWT signature
  ↓
Query 'userSessions' where sessionToken == token
  ├─ If not found: Return 401
  ├─ If expired: Return 401
  └─ If valid:
      ↓
      Update lastUsed timestamp
      ↓
      Attach user info to request
      ↓
      Call endpoint handler
      ↓
      Read from 'users' collection
      ↓
      Return user profile
```

### Create Medical Info Flow

```
POST /api/medical
+ Header: Authorization: Bearer <token>
+ Body: { bloodType, allergies, ... }
  ↓
Authenticate request (see above)
  ↓
Query 'medicalInfo' where userId == uid
  ├─ If exists: Update document
  └─ If not exists: Create document
  ↓
Return updated medicalInfo
```

### Logout All Flow

```
POST /api/auth/logout-all
+ Header: Authorization: Bearer <token>
  ↓
Authenticate request
  ↓
Query 'userSessions' where userId == uid and isActive == true
  ↓
Batch update all: isActive = false
  ↓
Log LOGOUT in 'securityLogs'
  ↓
Return success
```

---

## 🔄 Indexes & Performance

### Recommended Firestore Indexes

```javascript
// Users collection
- Index on: isActive ASC, createdAt DESC
  Purpose: Query active users with sorting

// UserSessions collection
- Index on: userId ASC, isActive ASC
  Purpose: Get active sessions for user
- Index on: sessionToken ASC (single field index)
  Purpose: Find session by token

// Wristbands collection
- Index on: QRCode ASC, isActive ASC
  Purpose: Public scans
- Index on: NFCTag ASC, isActive ASC
  Purpose: NFC scans

// EmergencyContacts collection
- Index on: userId ASC, isPrimary DESC
  Purpose: Find primary contact quickly

// SecurityLogs collection
- Index on: userId ASC, timestamp DESC
  Purpose: Get user's security audit trail
- Index on: actionType ASC, timestamp DESC
  Purpose: Find specific action types
```

See `firestore.indexes.json` for current index configuration.

---

## 📋 Collection Sizes Reference

Expected document sizes:

```
users:                    ~0.5 KB
medicalInfo:              ~1 KB
emergencyContacts:        ~0.3 KB (per contact)
userSessions:             ~0.4 KB
securityLogs:             ~0.3 KB
```

Read Operations per Request:
- Login: 1-2 reads (check user, check email)
- Get Profile: 1 read
- Get Complete: 3-4 reads (user, medical, contacts)
- Authenticated Request: 1 read (verify session)

---

## 🚀 Best Practices

### Query Optimization

✅ **Always use indexes** - Firestore creates them automatically if needed
✅ **Limit queries** - Use `.limit()` to prevent large result sets
✅ **Order by indexed fields** - Improves query performance
✅ **Filter by active status first** - `where('isActive', '==', true)`

### Security

✅ **Always verify userId** - Check ownership before accessing data
✅ **Use Firebase Rules** - Enforce security at database level
✅ **Log sensitive actions** - All auth events are logged
✅ **Timestamp everything** - Enables audit trails

### Data Integrity

✅ **OneToOne via userId** - MedicalInfo has unique userId
✅ **OneToMany via userId** - EmergencyContacts queries by userId
✅ **Immutable fields** - QR/NFC codes can't be changed
✅ **Soft deletes** - Use isActive flag instead of deleting

---

## 📞 Troubleshooting

### Session Validation Fails
- Check token is in Authorization header
- Verify token exists in userSessions collection
- Check isActive = true
- Check expiresAt > current time

### Can't See Medical Info
- Query filters: `where('userId', '==', uid)`
- Check user has permission in Firebase Rules
- Verify document was created with correct userId

### Emergency Contact Not Found
- Verify contactId from previous GET request
- Check ownership: `contactData.userId === uid`
- Confirm contact wasn't deleted

### Security Log Not Created
- Check service account has write permissions
- Enable securityLogs collection in Firestore
- Verify admin token set in environment

---

**Last Updated:** February 9, 2026  
**API Version:** 1.0.0
