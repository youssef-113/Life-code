# LifeCode API Documentation

Complete API reference for Flutter integration with the LifeCode Emergency Health Platform.

**Base URL:** `https://life-code--yossfabdla311.replit.app/api/app`

**Authentication:** Bearer Token (`Authorization: Bearer <token>`)

---

## Table of Contents

1. [Authentication](#authentication)
2. [User Profile](#user-profile)
3. [Medical Information](#medical-information)
4. [Medical Profile Dashboard](#medical-profile-dashboard)
5. [Emergency Contacts](#emergency-contacts)
6. [User Account Management](#user-account-management)
7. [Family Management](#family-management)
8. [Wristband Management](#wristband-management)
9. [Scan Operations](#scan-operations)
10. [Profile Completion](#profile-completion)
11. [Flutter Integration Guide](#flutter-integration-guide)
12. [Error Handling](#error-handling)

---

## Authentication

### Register (Email/Password)

Create a new user account with email and password.

**Endpoint:** `POST /register`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "yousseff besso",
  "email": "yousseff@example.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123"
}
```

**Field Requirements:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | string | Yes | 2-50 characters |
| email | string | Yes | Valid email format |
| password | string | Yes | Min 8 characters |
| confirmPassword | string | Yes | Must match password |

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userID": "firebase-uid",
    "username": "yousseff besso",
    "email": "yousseff@example.com",
    "photoURL": null,
    "providers": [
      {
        "provider": "email",
        "providerId": null,
        "linkedAt": "2026-04-01T20:00:00.000Z"
      }
    ],
    "primaryProvider": "email",
    "sessionToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresAt": "2026-04-16T20:00:00.000Z",
    "sessionID": "session-uuid",
    "deviceName": "PostmanRuntime/7.x.x",
    "suspiciousLogin": false,
    "createdAt": "2026-04-01T20:00:00.000Z"
  }
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| photoURL | string | User's profile photo (null if not uploaded) |
| sessionID | string | Unique session identifier |
| suspiciousLogin | boolean | True if signup from unusual location/device |
| expiresAt | string | Token expiration (15 days from creation) |

**Flutter Integration:**
```dart
Future<AuthResponse> register(String name, String email, String password) async {
  final response = await http.post(
    Uri.parse('$baseUrl/register'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'name': name,
      'email': email,
      'password': password,
      'confirmPassword': password,
    }),
  );
  
  if (response.statusCode == 201) {
    final data = jsonDecode(response.body);
    // Save tokens
    await saveToken(data['data']['sessionToken']);
    await saveRefreshToken(data['data']['refreshToken']);
    return AuthResponse.fromJson(data);
  }
  throw Exception('Registration failed: ${response.body}');
}
```

---

### Login (Email/Password)

Authenticate existing user with email and password.

**Endpoint:** `POST /login`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "yousseff@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userID": "firebase-uid",
    "username": "yousseff besso",
    "email": "yousseff@example.com",
    "photoURL": "https://storage.googleapis.com/...",
    "providers": [...],
    "primaryProvider": "email",
    "sessionToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresAt": "2026-04-16T20:00:00.000Z",
    "sessionID": "session-uuid",
    "suspiciousLogin": false
  }
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| photoURL | string | User's profile photo URL |
| sessionID | string | Unique session identifier |
| suspiciousLogin | boolean | True if login from unusual location/device |
| expiresAt | string | Token expiration (15 days from login) |

**Flutter Integration:**
```dart
Future<AuthResponse> login(String email, String password) async {
  final response = await http.post(
    Uri.parse('$baseUrl/login'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'email': email,
      'password': password,
    }),
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    await saveToken(data['data']['sessionToken']);
    return AuthResponse.fromJson(data);
  }
  throw Exception('Login failed');
}
```

---

### Google Sign-In

Authenticate with Google (Auto Login OR Register).

**Endpoint:** `POST /auth/google`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "idToken": "GOOGLE_ID_TOKEN_FROM_SDK"
}
```

**Field Requirements:**
| Field | Type | Required | Source |
|-------|------|----------|--------|
| idToken | string | Yes | Google Sign-In SDK |

**Success Response (200/201):**
```json
{
  "success": true,
  "message": "User logged in with Google successfully",
  "data": {
    "userID": "uuid",
    "username": "yousseff besso",
    "email": "yousseff@gmail.com",
    "photoURL": "https://lh3.googleusercontent.com/...",
    "providers": [
      {
        "provider": "google",
        "providerId": "google-sub-id",
        "linkedAt": "2026-04-01T20:00:00.000Z"
      }
    ],
    "primaryProvider": "google",
    "sessionToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresAt": "2026-04-16T20:00:00.000Z",
    "sessionID": "session-uuid",
    "isNewUser": false,
    "accountLinked": false,
    "suspiciousLogin": false
  }
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| photoURL | string | User's profile photo URL from Google |
| sessionID | string | Unique session identifier |
| suspiciousLogin | boolean | True if login from unusual location/device |

**Account Linked Response:**
```json
{
  "success": true,
  "message": "google account linked successfully. You can now sign in with email or google.",
  "data": {
    "userID": "existing-user-id",
    "providers": [
      { "provider": "email", "providerId": null },
      { "provider": "google", "providerId": "google-sub-id" }
    ],
    "accountLinked": true,
    "linkedMethod": "google"
  }
}
```

**Flutter Integration:**
```dart
import 'package:google_sign_in/google_sign_in.dart';

Future<AuthResponse> signInWithGoogle() async {
  final GoogleSignIn googleSignIn = GoogleSignIn();
  final GoogleSignInAccount? googleUser = await googleSignIn.signIn();
  
  if (googleUser == null) {
    throw Exception('Google Sign-In cancelled');
  }
  
  final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
  
  final response = await http.post(
    Uri.parse('$baseUrl/auth/google'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'idToken': googleAuth.idToken,
    }),
  );
  
  if (response.statusCode == 200 || response.statusCode == 201) {
    final data = jsonDecode(response.body);
    await saveToken(data['data']['sessionToken']);
    return AuthResponse.fromJson(data);
  }
  throw Exception('Google auth failed');
}
```

---

### Apple Sign-In

Authenticate with Apple (Auto Login OR Register).

**Endpoint:** `POST /auth/apple`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "idToken": "APPLE_ID_TOKEN_FROM_SDK",
  "authorizationCode": "optional_auth_code"
}
```

**Field Requirements:**
| Field | Type | Required | Source |
|-------|------|----------|--------|
| idToken | string | Yes | Apple Sign-In SDK |
| authorizationCode | string | No | Apple Sign-In SDK |

**Success Response (200/201):**
```json
{
  "success": true,
  "message": "User logged in with Apple successfully",
  "data": {
    "userID": "uuid",
    "username": "yousseff",
    "email": "yousseff@privaterelay.appleid.com",
    "photoURL": null,
    "providers": [
      {
        "provider": "apple",
        "providerId": "apple-user-id",
        "linkedAt": "2026-04-01T20:00:00.000Z"
      }
    ],
    "primaryProvider": "apple",
    "sessionToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresAt": "2026-04-16T20:00:00.000Z",
    "sessionID": "session-uuid",
    "isNewUser": false,
    "suspiciousLogin": false
  }
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| photoURL | string | User's profile photo (null for Apple) |
| sessionID | string | Unique session identifier |
| suspiciousLogin | boolean | True if login from unusual location/device |

**Flutter Integration:**
```dart
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

Future<AuthResponse> signInWithApple() async {
  final credential = await SignInWithApple.getAppleIDCredential(
    scopes: [
      AppleIDAuthorizationScopes.email,
      AppleIDAuthorizationScopes.fullName,
    ],
  );
  
  final response = await http.post(
    Uri.parse('$baseUrl/auth/apple'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'idToken': credential.identityToken,
      'authorizationCode': credential.authorizationCode,
    }),
  );
  
  if (response.statusCode == 200 || response.statusCode == 201) {
    final data = jsonDecode(response.body);
    await saveToken(data['data']['sessionToken']);
    return AuthResponse.fromJson(data);
  }
  throw Exception('Apple auth failed');
}
```

---

### Get Linked Providers

Get all authentication methods linked to the user's account.

**Endpoint:** `GET /auth/providers`

**Headers:**
```
Authorization: Bearer <sessionToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "userID": "uuid",
    "providers": [
      {
        "provider": "email",
        "providerId": null,
        "linkedAt": "2026-04-01T20:00:00.000Z"
      },
      {
        "provider": "google",
        "providerId": "google-sub-id",
        "linkedAt": "2026-04-01T20:05:00.000Z"
      }
    ],
    "count": 2
  }
}
```

**Flutter Integration:**
```dart
Future<List<Provider>> getLinkedProviders() async {
  final token = await getToken();
  final response = await http.get(
    Uri.parse('$baseUrl/auth/providers'),
    headers: {
      'Authorization': 'Bearer $token',
    },
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return (data['data']['providers'] as List)
        .map((p) => Provider.fromJson(p))
        .toList();
  }
  throw Exception('Failed to get providers');
}
```

---

### Unlink Provider

Remove an authentication method from the account.

**Endpoint:** `DELETE /auth/providers/:provider`

**Headers:**
```
Authorization: Bearer <sessionToken>
```

**URL Parameters:**
| Parameter | Values | Description |
|-----------|--------|-------------|
| provider | `google`, `apple`, `email` | Provider to unlink |

**Success Response (200):**
```json
{
  "success": true,
  "message": "google unlinked successfully",
  "data": {
    "providers": [
      {
        "provider": "email",
        "providerId": null,
        "linkedAt": "2026-04-01T20:00:00.000Z"
      }
    ],
    "primaryProvider": "email"
  }
}
```

**Flutter Integration:**
```dart
Future<void> unlinkProvider(String provider) async {
  final token = await getToken();
  final response = await http.delete(
    Uri.parse('$baseUrl/auth/providers/$provider'),
    headers: {
      'Authorization': 'Bearer $token',
    },
  );
  
  if (response.statusCode != 200) {
    throw Exception('Failed to unlink provider');
  }
}
```

---

### Refresh Token

Get a new access token using refresh token.

**Endpoint:** `POST /refresh`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "sessionToken": "new_access_token",
    "expiresAt": "2026-04-01T20:30:00.000Z"
  }
}
```

**Flutter Integration:**
```dart
Future<String> refreshToken() async {
  final refreshToken = await getRefreshToken();
  final response = await http.post(
    Uri.parse('$baseUrl/refresh'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({'refreshToken': refreshToken}),
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    await saveToken(data['data']['sessionToken']);
    return data['data']['sessionToken'];
  }
  throw Exception('Token refresh failed');
}
```

---

### Logout

Logout from current session.

**Endpoint:** `POST /logout`

**Headers:**
```
Authorization: Bearer <sessionToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Flutter Integration:**
```dart
Future<void> logout() async {
  final token = await getToken();
  await http.post(
    Uri.parse('$baseUrl/logout'),
    headers: {
      'Authorization': 'Bearer $token',
    },
  );
  await clearTokens();
}
```

---

### Logout All Devices

Logout from all active sessions.

**Endpoint:** `POST /logout-all`

**Headers:**
```
Authorization: Bearer <sessionToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out from all devices",
  "data": {
    "sessionsRevoked": 3
  }
}
```

---

### Get Active Sessions

Get all active sessions for the authenticated user.

**Endpoint:** `GET /sessions`

**Headers:**
```
Authorization: Bearer <sessionToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "sessionId": "session-uuid-1",
        "deviceName": "Chrome on Windows",
        "deviceType": "browser",
        "ipAddress": "192.168.1.1",
        "lastActive": "2026-04-01T20:00:00.000Z",
        "createdAt": "2026-04-01T19:00:00.000Z",
        "isCurrent": true
      },
      {
        "sessionId": "session-uuid-2",
        "deviceName": "Flutter App on Android",
        "deviceType": "mobile",
        "ipAddress": "192.168.1.2",
        "lastActive": "2026-04-01T18:30:00.000Z",
        "createdAt": "2026-04-01T10:00:00.000Z",
        "isCurrent": false
      }
    ],
    "count": 2
  }
}
```

**Flutter Integration:**
```dart
Future<List<Session>> getActiveSessions() async {
  final token = await getToken();
  final response = await http.get(
    Uri.parse('$baseUrl/sessions'),
    headers: {'Authorization': 'Bearer $token'},
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return (data['data']['sessions'] as List)
        .map((s) => Session.fromJson(s))
        .toList();
  }
  throw Exception('Failed to get sessions');
}
```

---

### Revoke Session

Revoke a specific session (logout from one device).

**Endpoint:** `DELETE /sessions/:sessionId`

**Headers:**
```
Authorization: Bearer <sessionToken>
```

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| sessionId | string | Session ID to revoke |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Session revoked successfully",
  "data": {
    "revokedSessionId": "session-uuid-2"
  }
}
```

**Flutter Integration:**
```dart
Future<void> revokeSession(String sessionId) async {
  final token = await getToken();
  final response = await http.delete(
    Uri.parse('$baseUrl/sessions/$sessionId'),
    headers: {'Authorization': 'Bearer $token'},
  );
  
  if (response.statusCode != 200) {
    throw Exception('Failed to revoke session');
  }
}
```

---

## User Profile

### Get Personal Info

Get user's personal information.

**Endpoint:** `GET /profile/personal-info`

**Headers:**
```
Authorization: Bearer <sessionToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "userID": "uuid",
    "fullName": "yousseff besso",
    "email": "yousseff@example.com",
    "providers": [...],
    "primaryProvider": "email",
    "gender": "male",
    "address": "123 Main St",
    "photoURL": "https://...",
    "updatedAt": "2026-04-01T20:00:00.000Z"
  }
}
```

**Flutter Integration:**
```dart
Future<PersonalInfo> getPersonalInfo() async {
  final token = await getToken();
  final response = await http.get(
    Uri.parse('$baseUrl/profile/personal-info'),
    headers: {'Authorization': 'Bearer $token'},
  );
  
  if (response.statusCode == 200) {
    return PersonalInfo.fromJson(jsonDecode(response.body)['data']);
  }
  throw Exception('Failed to get personal info');
}
```

---

### Update Personal Info

Update user's personal information.

**Endpoint:** `PUT /profile/personal-info`

**Headers:**
```
Authorization: Bearer <sessionToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "fullName": "yousseff besso",
  "gender": "male",
  "address": "123 Main St, City"
}
```

**Field Requirements:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| fullName | string | Yes | 2-100 characters |
| gender | string | No | `male`, `female`, `other` |
| address | string | No | Max 500 characters |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Personal information updated successfully",
  "data": {
    "userID": "uuid",
    "fullName": "yousseff besso",
    "gender": "male",
    "address": "123 Main St, City",
    "updatedAt": "2026-04-01T20:00:00.000Z"
  }
}
```

---

### Get Emergency Contacts (Profile)

Get emergency contacts from profile.

**Endpoint:** `GET /profile/emergency-contacts`

**Headers:**
```
Authorization: Bearer <sessionToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "userID": "uuid",
    "contacts": [
      {
        "ContactName": "Jane besso",
        "phoneNumbers": ["+201234567890", "+201234567891"],
        "relationship": "Spouse",
        "isPrimary": true,
        "notes": "Primary emergency contact"
      },
      {
        "ContactName": "Bob Smith",
        "phoneNumbers": ["+201234567892"],
        "relationship": "Friend",
        "isPrimary": false,
        "notes": ""
      }
    ]
  }
}
```

**Field Details:**
| Field | Type | Description |
|-------|------|-------------|
| ContactName | string | Contact's full name |
| phoneNumbers | array | Array of phone numbers (1-5 per contact) |
| relationship | string | Relationship type |
| isPrimary | boolean | Whether this is the primary contact |
| notes | string | Optional notes about the contact |

---

### Update Emergency Contacts (Profile)

Update emergency contacts in profile. Supports multiple contacts with multiple phone numbers per contact.

**Endpoint:** `PUT /profile/emergency-contacts`

**Headers:**
```
Authorization: Bearer <sessionToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "contacts": [
    {
      "ContactName": "Jane besso",
      "phoneNumbers": ["+201234567890", "+201234567891"],
      "relationship": "Spouse",
      "isPrimary": true,
      "notes": "Primary emergency contact"
    },
    {
      "ContactName": "Bob Smith",
      "phoneNumbers": ["+201234567892"],
      "relationship": "Friend",
      "isPrimary": false
    }
  ]
}
```

**Field Requirements:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| contacts | array | Yes | 1-10 contacts |
| contacts[].ContactName | string | Yes | 2-100 characters |
| contacts[].phoneNumbers | array | Yes | 1-5 phone numbers per contact |
| contacts[].phoneNumbers[] | string | Yes | E.164 format (10-15 digits) |
| contacts[].relationship | string | No | `Father`, `Mother`, `Friend`, `Sister`, `Brother`, `Spouse`, `Other` |
| contacts[].isPrimary | boolean | No | Only one contact can be primary |
| contacts[].notes | string | No | Max 255 characters |

**Relationship Values:** `Father`, `Mother`, `Friend`, `Sister`, `Brother`, `Spouse`, `Other`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Emergency contacts updated successfully",
  "data": {
    "userID": "uuid",
    "contacts": [
      {
        "ContactName": "Jane besso",
        "phoneNumbers": ["+201234567890", "+201234567891"],
        "relationship": "Spouse",
        "isPrimary": true,
        "notes": "Primary emergency contact"
      }
    ]
  },
  "profileCompletion": 75,
  "completionLevel": "medium",
  "nextRecommendedStep": "Add your blood type"
}
```

**Backward Compatibility:** The API also accepts the old format with `primaryContact` and `secondaryContact` fields for existing integrations.

**Flutter Integration:**
```dart
Future<void> updateEmergencyContacts(
  List<EmergencyContact> contacts,
) async {
  final token = await getToken();
  final response = await http.put(
    Uri.parse('$baseUrl/profile/emergency-contacts'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'contacts': contacts.map((c) => c.toJson()).toList(),
    }),
  );
  
  if (response.statusCode != 200) {
    throw Exception('Failed to update emergency contacts');
  }
}

class EmergencyContact {
  final String ContactName;
  final List<String> phoneNumbers;
  final String relationship;
  final bool isPrimary;
  final String? notes;
  
  EmergencyContact({
    required this.ContactName,
    required this.phoneNumbers,
    required this.relationship,
    this.isPrimary = false,
    this.notes,
  });
  
  Map<String, dynamic> toJson() => {
    'ContactName': ContactName,
    'phoneNumbers': phoneNumbers,
    'relationship': relationship,
    'isPrimary': isPrimary,
    'notes': notes,
  };
}
```

---

## Medical Information

### Create Medical Info

Create medical information for the user.

**Endpoint:** `POST /medical`

**Headers:**
```
Authorization: Bearer <sessionToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "personalInfo": {
    "name": "yousseff besso",
    "gender": "male",
    "address": "123 Main St"
  },
  "emergencyContact": {
    "primary": {
      "fullName": "Jane besso",
      "phoneNumber": "+201234567890",
      "relationship": "Spouse"
    },
    "secondary": [
      {
        "fullName": "Bob Smith",
        "phoneNumber": "+201234567891",
        "relationship": "Friend"
      }
    ]
  },
  "medicalProfile": {
    "bloodType": "A+",
    "medicalConditions": ["Diabetes", "Hypertension"]
  },
  "allergies": [
    {
      "allergyType": "Peanuts",
      "severity": "High",
      "notes": "Anaphylaxis risk"
    }
  ],
  "medications": [
    {
      "medicationName": "Insulin",
      "dosage": "10 units",
      "schedule": "Daily",
      "notes": "Before meals"
    }
  ],
  "surgeries": [
    {
      "surgeryName": "Appendectomy",
      "surgeryDate": "2020-01-15",
      "notes": "No complications"
    }
  ]
}
```

**Flutter Integration:**
```dart
Future<void> createMedicalInfo(MedicalInfo info) async {
  final token = await getToken();
  final response = await http.post(
    Uri.parse('$baseUrl/medical'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode(info.toJson()),
  );
  
  if (response.statusCode != 201) {
    throw Exception('Failed to create medical info');
  }
}
```

---

### Get Medical Info

Get user's medical information.

**Endpoint:** `GET /medical`

**Headers:**
```
Authorization: Bearer <sessionToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "userID": "uuid",
    "personalInfo": {...},
    "emergencyContact": {...},
    "medicalProfile": {...},
    "allergies": [...],
    "medications": [...],
    "surgeries": [...]
  }
}
```

---

### Update Medical Info

Update user's medical information.

**Endpoint:** `PUT /medical`

**Headers:**
```
Authorization: Bearer <sessionToken>
Content-Type: application/json
```

**Request Body:** Same as Create (all fields optional)

---

### Get Medical Profile Dashboard

Get complete medical profile for dashboard.

**Endpoint:** `GET /medical/profile`

**Headers:**
```
Authorization: Bearer <sessionToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "userHeader": {
      "name": "yousseff besso",
      "photoURL": "https://...",
      "updatedAt": "..."
    },
    "quickStats": {
      "bloodType": "A+",
      "allergiesCount": 2,
      "medicationsCount": 3
    },
    "sections": {
      "personalInfo": {
        "completed": true,
        "data": {...}
      },
      "emergencyContact": {
        "completed": true,
        "data": {...}
      },
      "medicalProfile": {
        "completed": true,
        "data": {...}
      },
      "allergies": {
        "count": 2,
        "items": [...]
      },
      "medications": {
        "count": 3,
        "items": [...]
      },
      "surgeries": {
        "count": 1,
        "items": [...]
      }
    },
    "profileCompletion": 85
  }
}
```

---

### Update Medical Profile Section

Update specific section of medical profile.

**Endpoints:**
- `PUT /medical/profile/general-info`
- `PUT /medical/profile/emergency-contact`
- `PUT /medical/profile/medical-profile`
- `PUT /medical/profile/allergies`
- `PUT /medical/profile/medications`
- `PUT /medical/profile/surgeries`

**Headers:**
```
Authorization: Bearer <sessionToken>
Content-Type: application/json
```

---

## Medical Profile Dashboard

### Get Medical Profile Dashboard

Get complete medical profile for dashboard with profile completion percentage.

**Endpoint:** `GET /medical/profile`

**Headers:**
```
Authorization: Bearer <sessionToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "userHeader": {
      "name": "yousseff besso",
      "photoURL": "https://...",
      "updatedAt": "2026-04-01T20:00:00.000Z"
    },
    "profileCompletion": 75,
    "completionLevel": "medium",
    "nextRecommendedStep": "Add your blood type and medical conditions",
    "quickStats": {
      "bloodType": "A+",
      "allergiesCount": 2,
      "medicationsCount": 3,
      "surgeriesCount": 1
    },
    "sections": {
      "personalInfo": {
        "completed": true,
        "hasName": true,
        "hasGender": true,
        "hasAddress": true,
        "data": {
          "name": "yousseff besso",
          "gender": "male",
          "address": "123 Main St"
        }
      },
      "emergencyContact": {
        "completed": true,
        "hasPrimaryContact": true,
        "data": {...}
      },
      "medicalProfile": {
        "completed": true,
        "hasBloodType": true,
        "hasConditions": true,
        "data": {
          "bloodType": "A+",
          "medicalConditions": ["Diabetes"]
        }
      },
      "allergies": {
        "completed": true,
        "hasAllergiesFlag": true,
        "count": 2,
        "items": [...]
      },
      "medications": {
        "completed": true,
        "hasMedicationsFlag": true,
        "count": 3,
        "items": [...]
      },
      "surgeries": {
        "completed": false,
        "hasSurgeriesFlag": false,
        "count": 0,
        "items": []
      }
    }
  }
}
```

**Profile Completion Levels:**
| Level | Percentage | Description |
|-------|------------|-------------|
| `low` | 0-19% | Just started |
| `partial` | 20-49% | Some sections completed |
| `medium` | 50-79% | Most sections completed |
| `complete` | 80-100% | Profile nearly/fully complete |

---

### Update Personal Information

Update personal information section.

**Endpoint:** `PUT /medical/personal-info`

**Headers:**
```
Authorization: Bearer <sessionToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "yousseff besso",
  "gender": "male",
  "address": "123 Main St, City"
}
```

**Field Requirements:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | string | No | 1-100 characters |
| gender | string | No | `male`, `female`, `other` |
| address | string | No | Max 500 characters |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Personal information updated successfully",
  "data": {
    "name": "yousseff besso",
    "gender": "male",
    "address": "123 Main St, City",
    "updatedAt": "2026-04-01T20:00:00.000Z"
  },
  "profileCompletion": 80,
  "completionLevel": "medium",
  "nextRecommendedStep": "Add an emergency contact"
}
```

---

### Update Emergency Contact (Medical Profile)

Update emergency contact section in medical profile.

**Endpoint:** `PUT /medical/emergency-contact`

**Headers:**
```
Authorization: Bearer <sessionToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "primary": {
    "fullName": "Jane besso",
    "phoneNumber": "+201234567890",
    "relationship": "Spouse"
  },
  "secondary": [
    {
      "fullName": "Bob Smith",
      "phoneNumber": "+201234567891",
      "relationship": "Friend"
    }
  ]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Emergency contact updated successfully",
  "data": {
    "primary": {...},
    "secondary": [...],
    "updatedAt": "2026-04-01T20:00:00.000Z"
  },
  "profileCompletion": 85,
  "completionLevel": "medium",
  "nextRecommendedStep": "Add your allergies"
}
```

---

### Update Medical Profile

Update medical profile section (blood type, conditions).

**Endpoint:** `PUT /medical/medical-profile`

**Headers:**
```
Authorization: Bearer <sessionToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "bloodType": "A+",
  "medicalConditions": ["Diabetes", "Hypertension"]
}
```

**Blood Type Values:** `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Medical profile updated successfully",
  "data": {
    "bloodType": "A+",
    "medicalConditions": ["Diabetes", "Hypertension"],
    "updatedAt": "2026-04-01T20:00:00.000Z"
  },
  "profileCompletion": 90,
  "completionLevel": "complete",
  "nextRecommendedStep": "Profile complete!"
}
```

---

### Update Allergies (with Yes/No Flag)

Update allergies section with confirmation flag.

**Endpoint:** `PUT /medical/allergies`

**Headers:**
```
Authorization: Bearer <sessionToken>
Content-Type: application/json
```

**Request Body (User has allergies - clicked "Yes"):**
```json
{
  "hasAllergies": true,
  "allergies": [
    {
      "allergyType": "Peanuts",
      "severity": "Severe",
      "notes": "Anaphylaxis risk"
    },
    {
      "allergyType": "Shellfish",
      "severity": "Moderate",
      "notes": ""
    }
  ]
}
```

**Request Body (User has NO allergies - clicked "No"):**
```json
{
  "hasAllergies": false
}
```

**Field Requirements:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| hasAllergies | boolean | Yes* | User confirmation flag |
| allergies | array | No | Array of allergy objects |

*Either `hasAllergies` or `allergies` must be provided

**Severity Values:** `Mild`, `Moderate`, `Severe`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Allergies updated successfully",
  "data": {
    "hasAllergies": true,
    "allergies": [...],
    "count": 2,
    "updatedAt": "2026-04-01T20:00:00.000Z"
  },
  "profileCompletion": 95,
  "completionLevel": "complete",
  "nextRecommendedStep": "Profile complete!"
}
```

**Flutter Integration:**
```dart
Future<void> updateAllergies({
  required bool hasAllergies,
  List<Allergy>? allergies,
}) async {
  final token = await getToken();
  final body = <String, dynamic>{'hasAllergies': hasAllergies};
  if (allergies != null) {
    body['allergies'] = allergies.map((a) => a.toJson()).toList();
  }
  
  final response = await http.put(
    Uri.parse('$baseUrl/medical/allergies'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode(body),
  );
}
```

---

### Update Medications (with Yes/No Flag)

Update medications section with confirmation flag.

**Endpoint:** `PUT /medical/medications`

**Headers:**
```
Authorization: Bearer <sessionToken>
Content-Type: application/json
```

**Request Body (User has medications - clicked "Yes"):**
```json
{
  "hasMedications": true,
  "medications": [
    {
      "medicationName": "Insulin",
      "dosage": "10 units",
      "schedule": "Daily before meals",
      "notes": "Check blood sugar first"
    }
  ]
}
```

**Request Body (User has NO medications - clicked "No"):**
```json
{
  "hasMedications": false
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Medications updated successfully",
  "data": {
    "hasMedications": true,
    "medications": [...],
    "count": 1,
    "updatedAt": "2026-04-01T20:00:00.000Z"
  },
  "profileCompletion": 85,
  "completionLevel": "medium",
  "nextRecommendedStep": "Add your surgical history"
}
```

---

### Update Surgeries (with Yes/No Flag)

Update surgeries section with confirmation flag.

**Endpoint:** `PUT /medical/surgeries`

**Headers:**
```
Authorization: Bearer <sessionToken>
Content-Type: application/json
```

**Request Body (User has surgeries - clicked "Yes"):**
```json
{
  "hasSurgeries": true,
  "surgeries": [
    {
      "surgeryName": "Appendectomy",
      "surgeryDate": "2020-01-15",
      "notes": "No complications"
    }
  ]
}
```

**Request Body (User has NO surgeries - clicked "No"):**
```json
{
  "hasSurgeries": false
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Surgeries updated successfully",
  "data": {
    "hasSurgeries": true,
    "surgeries": [...],
    "count": 1,
    "updatedAt": "2026-04-01T20:00:00.000Z"
  },
  "profileCompletion": 100,
  "completionLevel": "complete",
  "nextRecommendedStep": "Profile complete!"
}
```

---

## Emergency Contacts

### Add Emergency Contact

Add a new emergency contact with support for multiple phone numbers.

**Endpoint:** `POST /emergency/contact`

**Headers:**
```
Authorization: Bearer <sessionToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "ContactName": "Jane besso",
  "relationship": "Spouse",
  "phoneNumbers": ["+201234567890", "+201234567891"],
  "isPrimary": true,
  "notes": "Primary emergency contact"
}
```

**Field Requirements:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| ContactName | string | Yes | 2-100 characters |
| phoneNumbers | array | Yes | 1-5 phone numbers |
| phoneNumbers[] | string | Yes | E.164 format (10-15 digits) |
| relationship | string | No | `Father`, `Mother`, `Friend`, `Sister`, `Brother`, `Spouse`, `Other` |
| isPrimary | boolean | No | true/false |
| notes | string | No | Max 255 characters |

**Success Response (201):**
```json
{
  "success": true,
  "message": "Emergency contact added successfully",
  "data": {
    "id": "contact-id",
    "ContactName": "Jane besso",
    "relationship": "Spouse",
    "phoneNumbers": ["+201234567890", "+201234567891"],
    "isPrimary": true,
    "notes": "Primary emergency contact",
    "CreatedAt": "2026-04-01T20:00:00.000Z"
  },
  "profileCompletion": 75,
  "completionLevel": "medium",
  "nextRecommendedStep": "Upload a profile photo"
}
```

---

### Add Multiple Emergency Contacts (Bulk)

Add multiple emergency contacts at once. Supports up to 10 contacts.

**Endpoint:** `POST /emergency/contacts/bulk`

**Headers:**
```
Authorization: Bearer <sessionToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "contacts": [
    {
      "ContactName": "Jane besso",
      "relationship": "Spouse",
      "phoneNumbers": ["+201234567890"],
      "isPrimary": true
    },
    {
      "ContactName": "Bob Smith",
      "relationship": "Friend",
      "phoneNumbers": ["+201234567891", "+201234567892"],
      "isPrimary": false
    }
  ]
}
```

**Field Requirements:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| contacts | array | Yes | 1-10 contacts |
| contacts[].ContactName | string | Yes | 2-100 characters |
| contacts[].phoneNumbers | array | Yes | 1-5 phone numbers per contact |
| contacts[].phoneNumbers[] | string | Yes | E.164 format (10-15 digits) |
| contacts[].relationship | string | No | `Father`, `Mother`, `Friend`, `Sister`, `Brother`, `Spouse`, `Other` |
| contacts[].isPrimary | boolean | No | Only one contact can be primary |
| contacts[].notes | string | No | Max 255 characters |

**Success Response (201):**
```json
{
  "success": true,
  "message": "2 emergency contact(s) added successfully",
  "data": {
    "contacts": [
      {
        "id": "contact-id-1",
        "ContactName": "Jane besso",
        "relationship": "Spouse",
        "phoneNumbers": ["+201234567890"],
        "isPrimary": true
      },
      {
        "id": "contact-id-2",
        "ContactName": "Bob Smith",
        "relationship": "Friend",
        "phoneNumbers": ["+201234567891", "+201234567892"],
        "isPrimary": false
      }
    ],
    "count": 2
  },
  "profileCompletion": 80,
  "completionLevel": "medium",
  "nextRecommendedStep": "Add your blood type"
}
```

---

### Get All Emergency Contacts

Get all emergency contacts for user.

**Endpoint:** `GET /emergency/contacts`

**Headers:**
```
Authorization: Bearer <sessionToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "contact-id-1",
      "ContactName": "Jane besso",
      "relationship": "Spouse",
      "phoneNumbers": ["+201234567890", "+201234567891"],
      "isPrimary": true,
      "notes": "Primary emergency contact"
    },
    {
      "id": "contact-id-2",
      "ContactName": "Bob Smith",
      "relationship": "Friend",
      "phoneNumbers": ["+201234567892"],
      "isPrimary": false,
      "notes": ""
    }
  ],
  "count": 2,
  "profileCompletion": 75,
  "completionLevel": "medium",
  "nextRecommendedStep": "Complete your medical profile"
}
```

---

### Get Single Emergency Contact

**Endpoint:** `GET /emergency/contact/:id`

**Headers:**
```
Authorization: Bearer <sessionToken>
```

---

### Update Emergency Contact

Update an existing emergency contact.

**Endpoint:** `PUT /emergency/contact/:id`

**Headers:**
```
Authorization: Bearer <sessionToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "ContactName": "Jane besso Updated",
  "phoneNumbers": ["+201234567890", "+201234567893"],
  "relationship": "Spouse",
  "isPrimary": true,
  "notes": "Updated contact information"
}
```

**Field Requirements:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| ContactName | string | No | 2-100 characters |
| phoneNumbers | array | No | 1-5 phone numbers |
| phoneNumbers[] | string | Yes* | E.164 format (10-15 digits) |
| relationship | string | No | `Father`, `Mother`, `Friend`, `Sister`, `Brother`, `Spouse`, `Other` |
| isPrimary | boolean | No | true/false |
| notes | string | No | Max 255 characters |

*Required if phoneNumbers array is provided

**Success Response (200):**
```json
{
  "success": true,
  "message": "Contact updated successfully",
  "data": {
    "id": "contact-id",
    "ContactName": "Jane besso Updated",
    "phoneNumbers": ["+201234567890", "+201234567893"],
    "relationship": "Spouse",
    "isPrimary": true,
    "notes": "Updated contact information",
    "UpdatedAt": "2026-04-01T20:00:00.000Z"
  },
  "profileCompletion": 75,
  "completionLevel": "medium",
  "nextRecommendedStep": "Add your blood type"
}
```

---

### Delete Emergency Contact

**Endpoint:** `DELETE /emergency/contact/:id`

**Headers:**
```
Authorization: Bearer <sessionToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Contact deleted successfully",
  "data": {
    "deletedId": "contact-id"
  },
  "profileCompletion": 70,
  "completionLevel": "medium",
  "nextRecommendedStep": "Add an emergency contact"
}
```

---

### Set Primary Contact

**Endpoint:** `PUT /emergency/contact/:id/primary`

**Headers:**
```
Authorization: Bearer <sessionToken>
```

---

## User Account Management

### Change Password

Change user password.

**Endpoint:** `POST /user/password`

**Headers:**
```
Authorization: Bearer <sessionToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewSecurePass456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

### Upload Profile Photo

Upload or update user profile photo. Photos are stored in Firebase Storage and served via CDN URL.

**Endpoint:** `POST /user/photo`

**Headers:**
```
Authorization: Bearer <sessionToken>
Content-Type: multipart/form-data
```

**Option 1: Direct File Upload (Mobile/PC)**

Send as `multipart/form-data` with file field named `photo`:

```
POST /user/photo
Authorization: Bearer <token>
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="photo"; filename="profile.jpg"
Content-Type: image/jpeg

<binary image data>
------WebKitFormBoundary--
```

**Option 2: Pre-uploaded URL**

If you've already uploaded to Firebase Storage, send the URL:

```json
{
  "photoURL": "https://storage.googleapis.com/bucket/users/userId/profile.jpg"
}
```

**File Requirements:**
| Property | Limit |
|----------|-------|
| Max file size | 5MB |
| Allowed types | image/jpeg, image/png, image/webp |

**Success Response (200):**
```json
{
  "success": true,
  "message": "Photo uploaded successfully",
  "data": {
    "userID": "user-id",
    "photoURL": "https://storage.googleapis.com/bucket/users/userId/profile_123.jpg",
    "photoType": "storage",
    "uploadedAt": "2026-04-01T20:00:00.000Z"
  },
  "profileCompletion": 85,
  "completionLevel": "medium",
  "nextRecommendedStep": "Add your allergies"
}
```

**Flutter Integration:**
```dart
Future<void> uploadPhoto(File imageFile) async {
  final token = await getToken();
  
  // Create multipart request
  final request = http.MultipartRequest(
    'POST',
    Uri.parse('$baseUrl/user/photo'),
  );
  
  // Add authorization header
  request.headers['Authorization'] = 'Bearer $token';
  
  // Add file
  request.files.add(await http.MultipartFile.fromPath(
    'photo',
    imageFile.path,
    contentType: MediaType('image', 'jpeg'),
  ));
  
  final response = await request.send();
  
  if (response.statusCode == 200) {
    final responseData = await response.stream.bytesToString();
    final data = jsonDecode(responseData);
    print('Photo uploaded: ${data['data']['photoURL']}');
  }
}
```

---

### Get Profile Photo

Get current user's profile photo.

**Endpoint:** `GET /user/photo`

**Headers:**
```
Authorization: Bearer <sessionToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "userID": "user-id",
    "photoURL": "https://storage.googleapis.com/...",
    "photoType": "storage",
    "uploadedAt": "2026-04-01T20:00:00.000Z"
  }
}
```

**Photo Types:**
| Type | Description |
|------|-------------|
| `storage` | Photo stored in Firebase Storage (CDN URL) |
| `url` | External URL provided by user |

---

### Get Photo by User ID

Get another user's profile photo (respects privacy settings).

**Endpoint:** `GET /user/:userId/photo`

**Headers:**
```
Authorization: Bearer <sessionToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "userID": "target-user-id",
    "photoURL": "https://storage.googleapis.com/...",
    "photoType": "storage",
    "uploadedAt": "2026-04-01T20:00:00.000Z"
  }
}
```

---

### Delete Profile Photo

Delete user's profile photo.

**Endpoint:** `DELETE /user/photo`

**Headers:**
```
Authorization: Bearer <sessionToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Photo deleted successfully",
  "data": {
    "deletedAt": "2026-04-01T20:00:00.000Z"
  },
  "profileCompletion": 75,
  "completionLevel": "medium",
  "nextRecommendedStep": "Upload a profile photo"
}
```

---

### Delete Account

Soft delete user account.

**Endpoint:** `DELETE /user/account`

**Headers:**
```
Authorization: Bearer <sessionToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Account deleted successfully",
  "data": {
    "deactivatedAt": "2026-04-01T20:00:00.000Z",
    "sessionsDeactivated": 3
  }
}
```

---

### Update Preferences

Update user notification and privacy preferences.

**Endpoint:** `PUT /user/preferences`

**Headers:**
```
Authorization: Bearer <sessionToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "pushNotifications": true,
  "emailNotifications": true,
  "showMedicalOnScan": true,
  "showContactsOnScan": true,
  "showPhotoOnScan": false
}
```

---

### Get Preferences

**Endpoint:** `GET /user/preferences`

**Headers:**
```
Authorization: Bearer <sessionToken>
```

---

### Get Complete Profile

Get complete user profile with all related data.

**Endpoint:** `GET /user/complete`

**Headers:**
```
Authorization: Bearer <sessionToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "Username": "yousseff besso",
      "Email": "yousseff@example.com",
      "PhotoURL": "...",
      ...
    },
    "medical": {...},
    "emergencyContacts": [...],
    "wristbands": [...]
  },
  "profileCompletion": 90,
  "completionLevel": "complete",
  "nextRecommendedStep": "Profile complete!"
}
```

---

## Profile Completion

### Overview

The profile completion system tracks user progress through the onboarding workflow. Each section contributes to the overall completion percentage.

**Section Weights:**
| Section | Weight | Description |
|---------|--------|-------------|
| Personal Info | 15% | Name, Gender, Address |
| Photo | 10% | Profile photo uploaded |
| Emergency Contact | 15% | At least one contact |
| Medical Profile | 15% | Blood type, Conditions |
| Allergies | 15% | HasAllergies flag + items |
| Medications | 15% | HasMedications flag + items |
| Surgeries | 15% | HasSurgeries flag + items |

**Total: 100%**

### Completion Logic

- **Allergies/Medications/Surgeries:**
  - If user clicks "No" (`hasXxx = false`): Section marked 100% complete
  - If user clicks "Yes" (`hasXxx = true`) with items: Section marked 100% complete
  - If user clicks "Yes" with no items yet: Section marked 50% complete

### Response Fields

All update and get endpoints now include:
```json
{
  "profileCompletion": 75,
  "completionLevel": "medium",
  "nextRecommendedStep": "Add your blood type and medical conditions"
}
```

| Field | Type | Description |
|-------|------|-------------|
| profileCompletion | number | 0-100 percentage |
| completionLevel | string | `low`, `partial`, `medium`, `complete` |
| nextRecommendedStep | string | Human-readable next action |

### Flutter Integration

```dart
class ProfileCompletion {
  final int percentage;
  final String level;
  final String nextStep;
  
  ProfileCompletion.fromJson(Map<String, dynamic> json)
    : percentage = json['profileCompletion'] ?? 0,
      level = json['completionLevel'] ?? 'low',
      nextStep = json['nextRecommendedStep'] ?? '';
}

// Usage in API response handling
void handleUpdateResponse(http.Response response) {
  final data = jsonDecode(response.body);
  
  if (data['success']) {
    // Update UI with new completion
    final completion = ProfileCompletion.fromJson(data);
    updateProgressBar(completion.percentage);
    showNextStep(completion.nextStep);
  }
}
```

---

## Family Management

### Get Family Profiles

Get all family members including self.

**Endpoint:** `GET /family`

**Headers:**
```
Authorization: Bearer <sessionToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "user-id",
      "ProfileType": "Main",
      "Name": "My Profile",
      "Relation": "Self",
      "Age": 30,
      "BloodType": "A+",
      "QRCode": "QR123456",
      "IsChild": false,
      "LostChildMode": false
    },
    {
      "id": "family-member-id",
      "ProfileType": "Dependent",
      "Name": "Child Name",
      "Relation": "Son",
      "Age": 5,
      "BloodType": "O+",
      "QRCode": "QR789012",
      "IsChild": true,
      "LostChildMode": true
    }
  ]
}
```

**Flutter Integration:**
```dart
Future<List<FamilyProfile>> getFamilyProfiles() async {
  final token = await getToken();
  final response = await http.get(
    Uri.parse('$baseUrl/family'),
    headers: {'Authorization': 'Bearer $token'},
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return (data['data'] as List)
        .map((f) => FamilyProfile.fromJson(f))
        .toList();
  }
  throw Exception('Failed to get family profiles');
}
```

---

### Add Family Member

Add a new family member dependent.

**Endpoint:** `POST /family`

**Headers:**
```
Authorization: Bearer <sessionToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "Name": "Child Name",
  "Relation": "Son",
  "DateOfBirth": "2020-01-15",
  "IsChild": true
}
```

**Relation Values:** `Spouse`, `Son`, `Daughter`, `Parent`, `Sibling`, `Other`

---

### Update Family Member

**Endpoint:** `PUT /family/:id`

---

### Delete Family Member

**Endpoint:** `DELETE /family/:id`

---

## Wristband Management

### Register Wristband

Register a new wristband.

**Endpoint:** `POST /wristband/register`

**Headers:**
```
Authorization: Bearer <sessionToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "qrCode": "QR123456789",
  "nfcTag": "NFC-ABC-123"
}
```

**Note:** Provide at least one of `qrCode` or `nfcTag`

---

### Get Wristbands

Get all wristbands for user.

**Endpoint:** `GET /wristband/list`

**Headers:**
```
Authorization: Bearer <sessionToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "wristband-id",
      "SerialNumber": "SN-2026-00001",
      "QRCode": "QR123456",
      "NFCTag": "NFC-ABC",
      "Status": "active",
      "IsActive": true,
      "ActivatedAt": "2026-04-01T20:00:00.000Z"
    }
  ]
}
```

---

### Activate Wristband

**Endpoint:** `POST /wristband/activate`

**Request Body:**
```json
{
  "wristbandId": "wristband-id"
}
```

---

### Revoke Wristband

**Endpoint:** `POST /wristband/revoke`

**Request Body:**
```json
{
  "wristbandId": "wristband-id",
  "reason": "Lost wristband"
}
```

---

### Get Primary Wristband

Get the user's primary wristband.

**Endpoint:** `GET /wristband/primary`

**Headers:**
```
Authorization: Bearer <sessionToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "wristband-id",
    "SerialNumber": "SN-2026-00001",
    "QRCode": "QR123456",
    "NFCTag": "NFC-ABC",
    "Status": "active",
    "IsPrimary": true,
    "ActivatedAt": "2026-04-01T20:00:00.000Z"
  }
}
```

---

### Set Primary Wristband

Set a wristband as the primary one.

**Endpoint:** `PUT /wristband/:wristbandId/primary`

**Headers:**
```
Authorization: Bearer <sessionToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Primary wristband updated successfully",
  "data": {
    "wristbandId": "wristband-id",
    "IsPrimary": true
  }
}
```

---

### Get Wristband with Full User Info

Get wristband details with complete user information.

**Endpoint:** `GET /wristband/:wristbandId/full`

**Headers:**
```
Authorization: Bearer <sessionToken>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "wristband": {
      "id": "wristband-id",
      "QRCode": "QR123456",
      "NFCTag": "NFC-ABC",
      "Status": "active"
    },
    "user": {
      "userID": "user-id",
      "Username": "yousseff besso",
      "Email": "yousseff@example.com",
      "PhotoURL": "..."
    },
    "medical": {...}
  }
}
```

---

### Resolve User from QR/NFC

Resolve user ID from QR code or NFC tag identifier.

**Endpoint:** `POST /wristband/resolve-user`

**Headers:**
```
Authorization: Bearer <sessionToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "identifier": "QR123456789",
  "type": "qr"
}
```

**Type Values:** `qr`, `nfc`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "userID": "user-uuid",
    "wristbandId": "wristband-id"
  }
}
```

---

## Scan Operations

### Scan QR Code (Public)

Scan a QR code to get emergency information (no auth required).

**Endpoint:** `POST /scan/qr`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "qrCode": "QR123456789",
  "latitude": 30.0444,
  "longitude": 31.2357,
  "location": "Cairo, Egypt",
  "scannerType": "emergency"
}
```

**Scanner Types:** `emergency`, `hospital`, `public`, `personal`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Scan successful",
  "data": {
    "user": {
      "Username": "yousseff besso",
      "Gender": "male",
      "PhotoURL": "https://..."
    },
    "medical": {
      "BloodType": "A+",
      "Allergies": "Peanuts, Shellfish",
      "Medications": "Insulin",
      "EmergencyInstructions": "Check blood sugar immediately"
    },
    "emergencyContacts": [
      {
        "ContactName": "Jane besso",
        "relationship": "Spouse",
        "phoneNumbers": ["+201234567890"],
        "isPrimary": true
      }
    ]
  }
}
```

**Flutter Integration:**
```dart
Future<ScanResult> scanQRCode(String qrCode, {
  double? latitude,
  double? longitude,
  String? location,
}) async {
  final response = await http.post(
    Uri.parse('$baseUrl/scan/qr'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'qrCode': qrCode,
      'latitude': latitude,
      'longitude': longitude,
      'location': location,
      'scannerType': 'emergency',
    }),
  );
  
  if (response.statusCode == 200) {
    return ScanResult.fromJson(jsonDecode(response.body));
  }
  throw Exception('Scan failed');
}
```

---

### Scan NFC Tag (Public)

**Endpoint:** `POST /scan/nfc`

**Request Body:**
```json
{
  "nfcTag": "NFC-ABC-123",
  "latitude": 30.0444,
  "longitude": 31.2357,
  "scannerType": "hospital"
}
```

---

### Get Scan History

Get scan history for authenticated user.

**Endpoint:** `GET /scan/history`

**Headers:**
```
Authorization: Bearer <sessionToken>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 50 | Results per page |
| page | number | 1 | Page number |

---

## Flutter Integration Guide

### Base Configuration

```dart
class ApiConfig {
  static const String baseUrl = 'http://your-api-domain.com/api/app';
  static const String apiVersion = 'v1';
  
  static Map<String, String> getHeaders(String? token) {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    
    return headers;
  }
}
```

### Token Management

```dart
class TokenManager {
  static const String _tokenKey = 'session_token';
  static const String _refreshTokenKey = 'refresh_token';
  
  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }
  
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }
  
  static Future<void> saveRefreshToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_refreshTokenKey, token);
  }
  
  static Future<void> clearTokens() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_refreshTokenKey);
  }
}
```

### API Client with Interceptor

```dart
class ApiClient {
  static Future<http.Response> get(
    String endpoint, {
    bool requiresAuth = true,
  }) async {
    String? token;
    if (requiresAuth) {
      token = await TokenManager.getToken();
    }
    
    final response = await http.get(
      Uri.parse('${ApiConfig.baseUrl}$endpoint'),
      headers: ApiConfig.getHeaders(token),
    );
    
    if (response.statusCode == 401) {
      // Try to refresh token
      final newToken = await refreshToken();
      if (newToken != null) {
        return http.get(
          Uri.parse('${ApiConfig.baseUrl}$endpoint'),
          headers: ApiConfig.getHeaders(newToken),
        );
      }
    }
    
    return response;
  }
  
  static Future<http.Response> post(
    String endpoint,
    Map<String, dynamic> body, {
    bool requiresAuth = true,
  }) async {
    String? token;
    if (requiresAuth) {
      token = await TokenManager.getToken();
    }
    
    return http.post(
      Uri.parse('${ApiConfig.baseUrl}$endpoint'),
      headers: ApiConfig.getHeaders(token),
      body: jsonEncode(body),
    );
  }
  
  static Future<http.Response> put(
    String endpoint,
    Map<String, dynamic> body, {
    bool requiresAuth = true,
  }) async {
    final token = await TokenManager.getToken();
    return http.put(
      Uri.parse('${ApiConfig.baseUrl}$endpoint'),
      headers: ApiConfig.getHeaders(token),
      body: jsonEncode(body),
    );
  }
  
  static Future<http.Response> delete(
    String endpoint, {
    bool requiresAuth = true,
  }) async {
    final token = await TokenManager.getToken();
    return http.delete(
      Uri.parse('${ApiConfig.baseUrl}$endpoint'),
      headers: ApiConfig.getHeaders(token),
    );
  }
}
```

### Social Auth Setup

```yaml
# pubspec.yaml
dependencies:
  google_sign_in: ^6.1.6
  sign_in_with_apple: ^5.0.0
  http: ^1.1.0
  shared_preferences: ^2.2.2
```

```dart
// Android build.gradle
// Add to android/app/build.gradle defaultConfig:
minSdkVersion 21

// Add to android/build.gradle:
classpath 'com.google.gms:google-services:4.3.15'
```

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": "Error Type",
  "message": "Human readable error message",
  "code": 400
}
```

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 201 | Created | New resource created |
| 400 | Bad Request | Check request body |
| 401 | Unauthorized | Token expired/invalid, refresh or login |
| 403 | Forbidden | No permission for this action |
| 404 | Not Found | Resource bessosn't exist |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit hit, retry later |
| 500 | Server Error | Server issue, report to admin |

### Flutter Error Handler

```dart
class ApiException implements Exception {
  final String message;
  final int code;
  
  ApiException(this.message, this.code);
  
  @override
  String toString() => 'ApiException: $message (Code: $code)';
}

void handleApiError(http.Response response) {
  final body = jsonDecode(response.body);
  final message = body['message'] ?? 'Unknown error';
  
  switch (response.statusCode) {
    case 401:
      throw ApiException('Session expired. Please login again.', 401);
    case 403:
      throw ApiException('You do not have permission.', 403);
    case 404:
      throw ApiException('Resource not found.', 404);
    case 429:
      throw ApiException('Too many requests. Please wait.', 429);
    default:
      throw ApiException(message, response.statusCode);
  }
}
```

---

## Data Models

### User Model

```dart
class User {
  final String userID;
  final String username;
  final String email;
  final List<Provider> providers;
  final String primaryProvider;
  final String? photoURL;
  
  User.fromJson(Map<String, dynamic> json)
    : userID = json['userID'],
      username = json['username'],
      email = json['email'],
      providers = (json['providers'] as List)
          .map((p) => Provider.fromJson(p))
          .toList(),
      primaryProvider = json['primaryProvider'],
      photoURL = json['photoURL'];
}

class Provider {
  final String provider;
  final String? providerId;
  final DateTime linkedAt;
  
  Provider.fromJson(Map<String, dynamic> json)
    : provider = json['provider'],
      providerId = json['providerId'],
      linkedAt = DateTime.parse(json['linkedAt']);
}
```

### Emergency Contact Model

```dart
class EmergencyContact {
  final String ContactName;
  final List<String> phoneNumbers;
  final String relationship;
  final bool isPrimary;
  final String? notes;
  
  EmergencyContact({
    required this.ContactName,
    required this.phoneNumbers,
    required this.relationship,
    this.isPrimary = false,
    this.notes,
  });
  
  Map<String, dynamic> toJson() => {
    'ContactName': ContactName,
    'phoneNumbers': phoneNumbers,
    'relationship': relationship,
    'isPrimary': isPrimary,
    'notes': notes,
  };
  
  factory EmergencyContact.fromJson(Map<String, dynamic> json) =>
    EmergencyContact(
      ContactName: json['ContactName'],
      phoneNumbers: List<String>.from(json['phoneNumbers'] ?? []),
      relationship: json['relationship'],
      isPrimary: json['isPrimary'] ?? false,
      notes: json['notes'],
    );
}
```

**Field Details:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| ContactName | string | Yes | Contact's full name (2-100 chars) |
| phoneNumbers | List<String> | Yes | Array of phone numbers (1-5) |
| relationship | string | Yes | `Father`, `Mother`, `Friend`, `Sister`, `Brother`, `Spouse`, `Other` |
| isPrimary | bool | No | Whether this is the primary contact |
| notes | string | No | Optional notes (max 255 chars) |

### Session Model

```dart
class Session {
  final String sessionId;
  final String deviceName;
  final String deviceType;
  final String ipAddress;
  final DateTime lastActive;
  final DateTime createdAt;
  final bool isCurrent;
  
  Session.fromJson(Map<String, dynamic> json)
    : sessionId = json['sessionId'],
      deviceName = json['deviceName'],
      deviceType = json['deviceType'],
      ipAddress = json['ipAddress'],
      lastActive = DateTime.parse(json['lastActive']),
      createdAt = DateTime.parse(json['createdAt']),
      isCurrent = json['isCurrent'] ?? false;
}
```

### Profile Completion Model

```dart
class ProfileCompletion {
  final int percentage;
  final String level;
  final String nextStep;
  
  ProfileCompletion.fromJson(Map<String, dynamic> json)
    : percentage = json['profileCompletion'] ?? 0,
      level = json['completionLevel'] ?? 'low',
      nextStep = json['nextRecommendedStep'] ?? '';
  
  // Check if profile is complete
  bool get isComplete => percentage >= 80;
  
  // Get progress color for UI
  String get progressColor {
    if (percentage >= 80) return 'green';
    if (percentage >= 50) return 'yellow';
    if (percentage >= 20) return 'orange';
    return 'red';
  }
}
```

---

## API Summary

| Category | Endpoints | Auth Required |
|----------|-----------|---------------|
| **Auth** | Register, Login, Google, Apple, Refresh, Logout, Logout All, Sessions, Revoke Session, Get Providers, Unlink Provider | Some public |
| **Profile** | Get/Update Personal Info, Get/Update Emergency Contacts | Yes |
| **Medical** | Create/Update/Get Medical Info | Yes |
| **Medical Profile** | Dashboard, Personal Info, Emergency Contact, Medical Profile, Allergies, Medications, Surgeries | Yes |
| **Emergency Contacts** | Add, Bulk Add, Get All, Get One, Update, Delete, Set Primary | Yes |
| **User Account** | Change Password, Upload/Get/Delete Photo, Delete Account, Preferences, Complete Profile | Yes |
| **Family** | List, Add, Update, Delete Dependent | Yes |
| **Wristband** | Register, Activate, Revoke, List, Primary, Set Primary, Full Info, Resolve User | Yes |
| **Scan** | QR Scan (Public), NFC Scan (Public), History | Partial |
| **Health** | Health Check | Public |

**Total Endpoints:** 47

---

*Generated for LifeCode Flutter Integration*
