# Healthcare API - Complete Endpoints Documentation

**Version:** 1.0.0  
**Last Updated:** February 9, 2026  
**Base URL:** `http://localhost:3000/api` or `https://api.lifecode.app`

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Users Collection](#users-collection)
3. [Medical Info Collection](#medical-info-collection)
4. [Emergency Contacts Collection](#emergency-contacts-collection)
5. [User Sessions Collection](#user-sessions-collection)
6. [Security Logs Collection](#security-logs-collection)
7. [Error Responses](#error-responses)

---

## 🔐 Authentication

All endpoints (except login/refresh) require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

### Login (Obtain Tokens)
Get initial access and refresh tokens.

**Endpoint:** `POST /api/auth/login`

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "idToken": "firebase-id-token-from-client"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "uid": "firebase-uid-123",
      "username": "john_doe",
      "email": "john.doe@example.com",
      "gender": "male",
      "nationalId": "12345678901234",
      "photoUrl": "https://storage.example.com/photo.jpg",
      "isActive": true,
      "createdAt": "2025-02-03T10:00:00Z",
      "updatedAt": "2025-02-03T10:00:00Z"
    },
    "session": {
      "id": "session-doc-id",
      "expiresAt": "2025-02-04T10:00:00Z",
      "createdAt": "2025-02-03T10:00:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "uuid-string",
      "tokenType": "Bearer",
      "expiresIn": 86400
    }
  }
}
```

**Firebase Collections Used:**
- `users` (Creates user doc if new)
- `userSessions` (Creates new session)
- `securityLogs` (Logs LOGIN_SUCCESS or LOGIN_FAILED)

---

### Refresh Token
Get a new access token using a refresh token.

**Endpoint:** `POST /api/auth/refresh`

**Authentication:** Not required (but requires refresh token)

**Request Body:**
```json
{
  "refreshToken": "refresh-token-from-login"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "tokens": {
      "accessToken": "new-jwt-token",
      "refreshToken": "new-refresh-token",
      "tokenType": "Bearer",
      "expiresIn": 86400
    }
  }
}
```

**Firebase Collections Used:**
- `userSessions` (Updates session with new tokens)

---

### Logout (Single Session)
Logout from current session only.

**Endpoint:** `POST /api/auth/logout`

**Authentication:** Not required (but requires valid session token)

**Request Body:**
```json
{
  "sessionToken": "access-token-to-logout"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Firebase Collections Used:**
- `userSessions` (Deactivates session, `isActive` = false)
- `securityLogs` (Logs LOGOUT event)

---

### Logout All Sessions
Logout from all active sessions (requires authentication).

**Endpoint:** `POST /api/auth/logout-all`

**Authentication:** Required (Bearer token)

**Request Body:** Empty

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out from all 3 active session(s)"
}
```

**Firebase Collections Used:**
- `userSessions` (Deactivates all active sessions)
- `securityLogs` (Logs LOGOUT event with metadata)

---

### Get Active Sessions
List all active sessions for the authenticated user.

**Endpoint:** `GET /api/auth/sessions`

**Authentication:** Required

**Request Body:** None

**Response (200):**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "session-doc-id-1",
        "isCurrent": true,
        "ipAddress": "192.168.1.10",
        "userAgent": "Mozilla/5.0 (iPhone OS 17.2) AppleWebKit/537.36",
        "createdAt": "2025-02-03T10:00:00Z",
        "lastUsed": "2025-02-03T10:45:00Z",
        "expiresAt": "2025-02-04T10:00:00Z"
      },
      {
        "id": "session-doc-id-2",
        "isCurrent": false,
        "ipAddress": "203.0.113.45",
        "userAgent": "LifeCode Android/2.1.0",
        "createdAt": "2025-02-02T14:30:00Z",
        "lastUsed": "2025-02-02T15:00:00Z",
        "expiresAt": "2025-02-03T14:30:00Z"
      }
    ]
  }
}
```

**Firebase Collections Used:**
- `userSessions` (Queries all active sessions for user)

---

### Revoke Specific Session
Logout from a specific session by session ID.

**Endpoint:** `DELETE /api/auth/sessions/:sessionId`

**Authentication:** Required

**Path Parameters:**
- `sessionId` - The session document ID to revoke

**Request Body:** None

**Response (200):**
```json
{
  "success": true,
  "message": "Session revoked successfully"
}
```

**Firebase Collections Used:**
- `userSessions` (Deactivates specific session)

---

## 👤 Users Collection

Database Schema: `Users` table  
Firebase Collection: `users`

Fields Mapping:
```
Database          Firebase
ID                uid (Firebase Auth)
Username          username
Email             email
Gender            gender
NationalID        nationalId
PhotoURL          photoUrl
IsActive          isActive
CreatedAt         createdAt (Timestamp)
UpdatedAt         updatedAt (Timestamp)
```

### Get Current User Profile
Get the authenticated user's profile.

**Endpoint:** `GET /api/users/me`

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "uid": "firebase-uid-123",
      "username": "john_doe",
      "email": "john.doe@example.com",
      "gender": "male",
      "nationalId": "12345678901234",
      "photoUrl": "https://storage.example.com/photo.jpg",
      "isActive": true,
      "createdAt": "2025-02-03T10:00:00Z",
      "updatedAt": "2025-02-03T15:30:00Z"
    }
  }
}
```

**Firebase Collections Used:**
- `users` (Fetches user document)

---

### Update Current User Profile
Update the authenticated user's profile information.

**Endpoint:** `PUT /api/users/me` or `PATCH /api/users/me`

**Authentication:** Required

**Request Body:**
```json
{
  "username": "john_doe_updated",
  "gender": "male",
  "nationalId": "12345678901234",
  "photoUrl": "https://storage.example.com/new-photo.jpg"
}
```

All fields are optional.

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "uid": "firebase-uid-123",
      "username": "john_doe_updated",
      "email": "john.doe@example.com",
      "gender": "male",
      "nationalId": "12345678901234",
      "photoUrl": "https://storage.example.com/new-photo.jpg",
      "isActive": true,
      "createdAt": "2025-02-03T10:00:00Z",
      "updatedAt": "2025-02-03T15:35:00Z"
    }
  }
}
```

**Firebase Collections Used:**
- `users` (Updates user document)

---

### Get Complete User Profile
Get user profile with medical information and emergency contacts.

**Endpoint:** `GET /api/users/me/complete`

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "uid": "firebase-uid-123",
      "username": "john_doe",
      "email": "john.doe@example.com",
      "gender": "male",
      "nationalId": "12345678901234",
      "photoUrl": "https://storage.example.com/photo.jpg",
      "isActive": true,
      "createdAt": "2025-02-03T10:00:00Z",
      "updatedAt": "2025-02-03T15:30:00Z"
    },
    "medicalInfo": {
      "id": "medical-doc-id",
      "bloodType": "A+",
      "chronicDiseases": "Diabetes Type 2, Hypertension",
      "allergies": "Penicillin, Shellfish",
      "medications": "Metformin 500mg twice daily",
      "notes": "Prefers no ibuprofen",
      "updatedAt": "2025-02-03T12:00:00Z"
    },
    "emergencyContacts": [
      {
        "id": "contact-doc-id-1",
        "contactName": "Jane Doe",
        "relation": "Spouse",
        "phoneNumber": "+20123456789",
        "secondaryPhone": "+20198765432",
        "isPrimary": true,
        "createdAt": "2025-02-03T10:00:00Z"
      },
      {
        "id": "contact-doc-id-2",
        "contactName": "John Smith",
        "relation": "Brother",
        "phoneNumber": "+20198765432",
        "secondaryPhone": null,
        "isPrimary": false,
        "createdAt": "2025-02-01T10:00:00Z"
      }
    ]
  }
}
```

**Firebase Collections Used:**
- `users` (Main user data)
- `medicalInfo` (Medical information)
- `emergencyContacts` (Emergency contacts list)

---

### Deactivate Account
Soft delete - deactivates the user account and all active sessions.

**Endpoint:** `DELETE /api/users/me`

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "message": "Account deactivated successfully"
}
```

**Firebase Collections Used:**
- `users` (Sets `isActive` = false)
- `userSessions` (Deactivates all active sessions)

---

## 🏥 Medical Info Collection

Database Schema: `MedicalInfo` table  
Firebase Collection: `medicalInfo`

Fields Mapping:
```
Database          Firebase
ID                doc id
UserID            userId
BloodType         bloodType
Height            height
Weight            weight
ChronicDiseases   chronicDiseases
Allergies         allergies
Medications       medications
Surgeries         surgeries
Notes             notes
UpdatedAt         updatedAt (Timestamp)
```

One-to-one relationship with Users (userId is unique).

### Get Medical Information
Retrieve the authenticated user's medical information.

**Endpoint:** `GET /api/medical`

**Authentication:** Required

**Response (200) - With Data:**
```json
{
  "success": true,
  "data": {
    "medicalInfo": {
      "id": "medical-doc-id",
      "userId": "firebase-uid-123",
      "bloodType": "A+",
      "height": 175.5,
      "weight": 75.0,
      "chronicDiseases": "Diabetes Type 2, Hypertension",
      "allergies": "Penicillin, Shellfish, Peanuts",
      "medications": "Metformin 500mg twice daily, Lisinopril 10mg",
      "surgeries": "Appendectomy (2015), Knee surgery (2020)",
      "notes": "Patient prefers no ibuprofen due to stomach sensitivity",
      "updatedAt": "2025-02-03T12:00:00Z"
    }
  }
}
```

**Response (200) - No Data Found:**
```json
{
  "success": true,
  "data": {
    "medicalInfo": null
  },
  "message": "No medical information found"
}
```

**Firebase Collections Used:**
- `medicalInfo` (Queries by userId)

---

### Create or Update Medical Information
Create new medical information or update existing (upsert).

**Endpoint:** `POST /api/medical`

**Authentication:** Required

**Request Body:**
```json
{
  "bloodType": "A+",
  "height": 175.5,
  "weight": 75.0,
  "chronicDiseases": "Diabetes Type 2, Hypertension",
  "allergies": "Penicillin, Shellfish, Peanuts",
  "medications": "Metformin 500mg twice daily, Lisinopril 10mg",
  "surgeries": "Appendectomy (2015), Knee surgery (2020)",
  "notes": "Patient prefers no ibuprofen due to stomach sensitivity"
}
```

All fields are optional.

**Response (201) - New:**
```json
{
  "success": true,
  "message": "Medical information created successfully",
  "data": {
    "medicalInfo": {
      "id": "medical-doc-id",
      "userId": "firebase-uid-123",
      "bloodType": "A+",
      "chronicDiseases": "Diabetes Type 2, Hypertension",
      "allergies": "Penicillin, Shellfish, Peanuts",
      "medications": "Metformin 500mg twice daily, Lisinopril 10mg",
      "surgeries": "Appendectomy (2015), Knee surgery (2020)",
      "notes": "Patient prefers no ibuprofen due to stomach sensitivity",
      "updatedAt": "2025-02-03T12:05:00Z"
    }
  }
}
```

**Response (200) - Updated:**
```json
{
  "success": true,
  "message": "Medical information updated successfully",
  "data": {
    "medicalInfo": {
      "id": "medical-doc-id",
      "userId": "firebase-uid-123",
      "bloodType": "O+",
      "chronicDiseases": "Diabetes Type 2, Hypertension",
      "allergies": "Penicillin, Shellfish, Peanuts",
      "medications": "Metformin 500mg twice daily, Lisinopril 10mg",
      "surgeries": null,
      "notes": "Updated notes",
      "updatedAt": "2025-02-03T12:10:00Z"
    }
  }
}
```

**Firebase Collections Used:**
- `medicalInfo` (Creates or updates document)

---

### Update Medical Information
Alias for POST /api/medical

**Endpoint:** `PUT /api/medical`

**Authentication:** Required

**Request Body:** Same as POST

**Response:** Same as POST

---

### Partial Update Medical Information
Partial update (PATCH) - only update specified fields.

**Endpoint:** `PATCH /api/medical`

**Authentication:** Required

**Request Body:**
```json
{
  "bloodType": "O+",
  "weight": 80.0
}
```

Only provided fields will be updated. Other fields remain unchanged.

**Response:** Same as POST

**Firebase Collections Used:**
- `medicalInfo` (Updates specific fields)

---

### Delete Medical Information
Delete the authenticated user's medical information.

**Endpoint:** `DELETE /api/medical`

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "message": "Medical information deleted successfully"
}
```

**Response (404) - Not Found:**
```json
{
  "success": false,
  "message": "Medical information not found"
}
```

**Firebase Collections Used:**
- `medicalInfo` (Deletes user's document)

---

## 🚨 Emergency Contacts Collection

Database Schema: `EmergencyContacts` table  
Firebase Collection: `emergencyContacts`

Fields Mapping:
```
Database          Firebase
ID                doc id
UserID            userId
ContactName       contactName
Relation          relation
PhoneNumber       phoneNumber
SecondaryPhone    secondaryPhone
IsPrimary         isPrimary
CreatedAt         createdAt (Timestamp)
```

One-to-many relationship with Users.

### Get All Emergency Contacts
Retrieve all emergency contacts for the authenticated user.

**Endpoint:** `GET /api/emergency`

**Authentication:** Required

**Response (200):**
```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "id": "contact-doc-id-1",
        "contactName": "Jane Doe",
        "relation": "Spouse",
        "phoneNumber": "+20123456789",
        "secondaryPhone": "+20198765432",
        "isPrimary": true,
        "createdAt": "2025-02-03T10:00:00Z"
      },
      {
        "id": "contact-doc-id-2",
        "contactName": "John Smith",
        "relation": "Brother",
        "phoneNumber": "+20198765432",
        "secondaryPhone": null,
        "isPrimary": false,
        "createdAt": "2025-02-01T10:00:00Z"
      }
    ],
    "count": 2,
    "primaryContact": {
      "id": "contact-doc-id-1",
      "contactName": "Jane Doe",
      "relation": "Spouse",
      "phoneNumber": "+20123456789",
      "secondaryPhone": "+20198765432",
      "isPrimary": true,
      "createdAt": "2025-02-03T10:00:00Z"
    }
  }
}
```

**Firebase Collections Used:**
- `emergencyContacts` (Queries all for userId, ordered by isPrimary desc, createdAt desc)

---

### Get Specific Emergency Contact
Retrieve a single emergency contact by ID.

**Endpoint:** `GET /api/emergency/:contactId`

**Authentication:** Required

**Path Parameters:**
- `contactId` - The emergency contact document ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "contact": {
      "id": "contact-doc-id-1",
      "contactName": "Jane Doe",
      "relation": "Spouse",
      "phoneNumber": "+20123456789",
      "secondaryPhone": "+20198765432",
      "isPrimary": true,
      "createdAt": "2025-02-03T10:00:00Z"
    }
  }
}
```

**Firebase Collections Used:**
- `emergencyContacts` (Fetches specific document and verifies ownership)

---

### Create Emergency Contact
Create a new emergency contact for the authenticated user.

**Endpoint:** `POST /api/emergency`

**Authentication:** Required

**Request Body:**
```json
{
  "contactName": "Jane Doe",
  "relation": "Spouse",
  "phoneNumber": "+20123456789",
  "secondaryPhone": "+20198765432",
  "isPrimary": false
}
```

Required fields: `contactName`, `phoneNumber`  
Optional fields: `relation`, `secondaryPhone`, `isPrimary` (defaults to false)

**Response (201):**
```json
{
  "success": true,
  "message": "Emergency contact created successfully",
  "data": {
    "contact": {
      "id": "contact-doc-id-1",
      "contactName": "Jane Doe",
      "relation": "Spouse",
      "phoneNumber": "+20123456789",
      "secondaryPhone": "+20198765432",
      "isPrimary": false,
      "createdAt": "2025-02-03T10:00:00Z"
    }
  }
}
```

**Note:** If `isPrimary` is true, all other contacts for the user will have `isPrimary` set to false.

**Firebase Collections Used:**
- `emergencyContacts` (Creates new document)

---

### Update Emergency Contact
Update an existing emergency contact.

**Endpoint:** `PUT /api/emergency/:contactId`

**Authentication:** Required

**Path Parameters:**
- `contactId` - The emergency contact document ID

**Request Body:**
```json
{
  "contactName": "Jane Doe",
  "relation": "Spouse",
  "phoneNumber": "+20123456789",
  "secondaryPhone": "+20198765432",
  "isPrimary": true
}
```

All fields are optional.

**Response (200):**
```json
{
  "success": true,
  "message": "Emergency contact updated successfully",
  "data": {
    "contact": {
      "id": "contact-doc-id-1",
      "contactName": "Jane Doe",
      "relation": "Spouse",
      "phoneNumber": "+20123456789",
      "secondaryPhone": "+20198765432",
      "isPrimary": true,
      "createdAt": "2025-02-03T10:00:00Z"
    }
  }
}
```

**Firebase Collections Used:**
- `emergencyContacts` (Updates specific document)

---

### Partial Update Emergency Contact (PATCH)
Partial update - only update specified fields.

**Endpoint:** `PATCH /api/emergency/:contactId`

**Authentication:** Required

**Request Body:**
```json
{
  "phoneNumber": "+20166666666",
  "isPrimary": true
}
```

Only provided fields will be updated.

**Response:** Same as PUT

---

### Delete Emergency Contact
Delete an emergency contact.

**Endpoint:** `DELETE /api/emergency/:contactId`

**Authentication:** Required

**Path Parameters:**
- `contactId` - The emergency contact document ID

**Response (200):**
```json
{
  "success": true,
  "message": "Emergency contact deleted successfully"
}
```

**Firebase Collections Used:**
- `emergencyContacts` (Deletes specific document)

---

### Set Contact as Primary
Set a specific emergency contact as the primary contact.

**Endpoint:** `PUT /api/emergency/:contactId/primary`

**Authentication:** Required

**Path Parameters:**
- `contactId` - The emergency contact document ID

**Request Body:** Empty object `{}` or no body needed

**Response (200):**
```json
{
  "success": true,
  "message": "Primary contact updated successfully",
  "data": {
    "contact": {
      "id": "contact-doc-id-1",
      "contactName": "Jane Doe",
      "relation": "Spouse",
      "phoneNumber": "+20123456789",
      "secondaryPhone": "+20198765432",
      "isPrimary": true,
      "createdAt": "2025-02-03T10:00:00Z"
    }
  }
}
```

**Note:** This will automatically set all other contacts as non-primary.

**Firebase Collections Used:**
- `emergencyContacts` (Updates isPrimary status)

---

## 📋 User Sessions Collection

Database Schema: `UserSessions` table  
Firebase Collection: `userSessions`

Fields Mapping:
```
Database          Firebase
ID                doc id
UserID            userId
SessionToken      sessionToken
RefreshToken      refreshToken
UserAgent         userAgent
IPAddress         ipAddress
IsActive          isActive
CreatedAt         createdAt (Timestamp)
ExpiresAt         expiresAt (Timestamp)
LastUsed          lastUsed (Timestamp)
```

**Auto-managed by system.** Users interact through login/logout endpoints.

Session properties:
- `isActive: true` - Session is valid
- `isActive: false` - Session has been revoked
- `lastUsed` - Updated on every authenticated request
- `expiresAt` - Fixed 24 hours from creation

---

## 🔒 Security Logs Collection

Database Schema: `SecurityLogs` table  
Firebase Collection: `securityLogs`

Fields Mapping:
```
Database          Firebase
LogID             doc id
UserID            userId
ActionType        actionType
IPAddress         ipAddress
UserAgent         userAgent
Metadata          metadata (object)
Timestamp         timestamp (Timestamp)
```

**Auto-logged by system.** Users don't directly interact with this collection.

### Security Log Action Types

```
LOGIN_SUCCESS           - Successful user login
LOGIN_FAILED            - Failed login attempt
LOGOUT                  - User logout
PASSWORD_CHANGED        - User changed password
SESSION_REVOKED         - Session was revoked
UNAUTHORIZED_ACCESS     - Attempted unauthorized access
TOKEN_REFRESHED         - Token was refreshed
ACCOUNT_LOCKED          - Account locked due to multiple failed attempts
SUSPICIOUS_ACTIVITY     - Suspicious activity detected
```

### Automatic Security Logging

The system automatically logs:

1. **Login Success** - When user successfully authenticates
   - Records: userId, ipAddress, userAgent, sessionId
   
2. **Login Failed** - When login attempt fails
   - Records: userId (if known), ipAddress, userAgent, failure reason
   
3. **Logout** - When user logs out
   - Records: userId, ipAddress, userAgent, sessionId
   
4. **Session Activity** - On every authenticated request
   - Updates: lastUsed timestamp in userSessions collection

---

## ❌ Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error Type",
  "message": "Human-readable error message",
  "code": 400
}
```

### HTTP Status Codes

| Status | Meaning | Scenario |
|--------|---------|----------|
| 200 | OK | Successful request |
| 201 | Created | Resource successfully created |
| 400 | Bad Request | Invalid input data or missing required fields |
| 401 | Unauthorized | Missing, invalid, or expired authentication token |
| 403 | Forbidden | Verified user but lacks permission for this resource |
| 404 | Not Found | Resource not found |
| 405 | Method Not Allowed | Wrong HTTP method for endpoint |
| 409 | Conflict | Resource already exists (e.g., duplicate email) |
| 422 | Unprocessable Entity | Validation error with details |
| 500 | Server Error | Internal server error |

### Common Error Examples

**Missing Authentication:**
```json
{
  "success": false,
  "message": "Access denied. No token provided or invalid format. Use: Bearer <token>",
  "code": 401
}
```

**Invalid Token:**
```json
{
  "success": false,
  "message": "Token has expired. Please login again.",
  "code": 401
}
```

**Validation Error:**
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Invalid blood type. Must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-",
  "code": 400
}
```

**Permission Denied:**
```json
{
  "success": false,
  "message": "You do not have permission to access this contact",
  "code": 403
}
```

**Not Found:**
```json
{
  "success": false,
  "message": "Medical information not found",
  "code": 404
}
```

---

## 📊 Database Schema Reference

### Users Collection (Firestore)

```
{
  uid: string (Firebase Auth UID, document ID),
  username: string (2-50 chars, index),
  email: string (unique, index),
  gender: string (male, female, other, prefer_not_to_say),
  nationalId: string (5-20 chars),
  photoUrl: string (URL format),
  isActive: boolean (index),
  createdAt: Timestamp (index),
  updatedAt: Timestamp (auto-update)
}
```

### Medical Info Collection (Firestore)

```
{
  userId: string (unique, one-to-one with users),
  bloodType: string (A+, A-, B+, B-, AB+, AB-, O+, O-),
  height: number,
  weight: number,
  chronicDiseases: string,
  allergies: string,
  medications: string,
  surgeries: string,
  notes: string,
  updatedAt: Timestamp (auto-update)
}
```

### Emergency Contacts Collection (Firestore)

```
{
  userId: string (index),
  contactName: string (2-100 chars),
  relation: string,
  phoneNumber: string (E.164 format),
  secondaryPhone: string (E.164 format, optional),
  isPrimary: boolean (index),
  createdAt: Timestamp (index)
}
```

### User Sessions Collection (Firestore)

```
{
  userId: string (index),
  sessionToken: string (unique, the JWT access token),
  refreshToken: string (unique, UUID format),
  userAgent: string,
  ipAddress: string,
  isActive: boolean (index),
  createdAt: Timestamp,
  expiresAt: Timestamp (index),
  lastUsed: Timestamp
}
```

### Security Logs Collection (Firestore)

```
{
  userId: string (index, nullable for failed logins),
  actionType: string (index),
  ipAddress: string,
  userAgent: string,
  metadata: object (reason, sessionId, etc),
  timestamp: Timestamp (index)
}
```

---

## 🔄 Firebase Security Rules Summary

The `firestore.rules` file enforces:

✅ **Users Collection**
- Only owner can read/write own document
- Email, GoogleID, UserID immutable fields

✅ **Wristbands Collection**
- Public read access
- Only owner can create/update
- QR Code and NFC Tag immutable

✅ **Medical Info Collection**
- Public read access
- Only owner can write

✅ **Emergency Contacts Collection**
- Public read access
- Only owner can write

✅ **Security Logs Collection**
- Server only (no client read/write)
- Admin token required

✅ **User Sessions Collection**
- Server only (no client read/write)
- Admin token required

✅ **Scan Logs Collection**
- Public create access
- Only owner can read
- Immutable (no update/delete)

---

## 💡 Implementation Notes

1. **Timestamps** - All timestamps are Firestore Timestamp objects, returned as ISO 8601 strings (UTC)

2. **Authorization** - All protected endpoints verify:
   - Valid JWT token in Authorization header
   - Token signature
   - Token expiration
   - Session exists and is active in Firestore

3. **Ownership Verification** - User can only:
   - Update their own profile
   - Manage their own medical info
   - Manage their own emergency contacts
   - View and revoke their own sessions

4. **Soft Deletes** - Account deactivation is a soft delete (isActive = false)

5. **Error Handling** - All errors include:
   - success: false
   - error: Error type
   - message: Human-readable description
   - code: HTTP status code

6. **Security Logging** - Automatic logging for:
   - All login attempts (success/failure)
   - All logouts
   - Session revocations
   - Unauthorized access attempts

---

## 🚀 Getting Started

### 1. Start the Server
```bash
npm install
npm start
```

Server runs on `http://localhost:3000`

### 2. Check Health
```bash
GET http://localhost:3000/health
```

### 3. View Documentation
```bash
GET http://localhost:3000/api
```

### 4. Authenticate
```bash
POST http://localhost:3000/api/auth/login
Body: {
  "email": "user@example.com",
  "idToken": "firebase-id-token"
}
```

### 5. Use Returned Tokens
```bash
GET http://localhost:3000/api/users/me
Headers: Authorization: Bearer <accessToken>
```

---

## 📞 Support

For issues or questions:
1. Check firebase.rules for security rule errors
2. Review securityLogs collection for audit trail
3. Verify JWT_SECRET environment variable
4. Check Firebase credentials and service account

---

**API Version:** 1.0.0  
**Last Updated:** February 9, 2026
