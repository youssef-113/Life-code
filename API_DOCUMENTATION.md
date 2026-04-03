# LifeCode API Documentation

Complete API reference for Flutter integration with the LifeCode Emergency Health Platform.

**Base URL:** `https://life-code--yossfabdla311.replit.app/api/app`

**Authentication:** Bearer Token (`Authorization: Bearer <token>`)

---

## Table of Contents

1. [Authentication](#authentication)
2. [User Profile](#user-profile)
3. [Medical Information](#medical-information)
4. [Emergency Contacts](#emergency-contacts)
5. [Family Management](#family-management)
6. [Wristband Management](#wristband-management)
7. [Scan Operations](#scan-operations)
8. [Flutter Integration Guide](#flutter-integration-guide)
9. [Error Handling](#error-handling)

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
  "name": "John Doe",
  "email": "john@example.com",
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
    "username": "John Doe",
    "email": "john@example.com",
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
    "expiresAt": "2026-04-01T20:15:00.000Z",
    "deviceName": "PostmanRuntime/7.x.x",
    "createdAt": "2026-04-01T20:00:00.000Z"
  }
}
```

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
  "email": "john@example.com",
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
    "username": "John Doe",
    "email": "john@example.com",
    "providers": [...],
    "sessionToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresAt": "2026-04-01T20:15:00.000Z"
  }
}
```

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
    "username": "John Doe",
    "email": "john@gmail.com",
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
    "expiresAt": "2026-04-01T20:15:00.000Z",
    "isNewUser": false,
    "accountLinked": false
  }
}
```

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
    "username": "John",
    "email": "john@privaterelay.appleid.com",
    "providers": [
      {
        "provider": "apple",
        "providerId": "apple-user-id",
        "linkedAt": "2026-04-01T20:00:00.000Z"
      }
    ],
    "primaryProvider": "apple",
    "sessionToken": "eyJhbGciOiJIUzI1NiIs...",
    "isNewUser": false
  }
}
```

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
    "fullName": "John Doe",
    "email": "john@example.com",
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
  "fullName": "John Doe",
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
    "fullName": "John Doe",
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
    "primaryContact": {
      "fullName": "Jane Doe",
      "phoneNumber": "+201234567890",
      "relationship": "Spouse"
    },
    "secondaryContact": {
      "fullName": "Bob Smith",
      "phoneNumber": "+201234567891",
      "relationship": "Friend"
    }
  }
}
```

---

### Update Emergency Contacts (Profile)

Update emergency contacts in profile.

**Endpoint:** `PUT /profile/emergency-contacts`

**Headers:**
```
Authorization: Bearer <sessionToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "primaryContact": {
    "fullName": "Jane Doe",
    "phoneNumber": "+201234567890",
    "relationship": "Spouse"
  },
  "secondaryContact": {
    "fullName": "Bob Smith",
    "phoneNumber": "+201234567891",
    "relationship": "Friend"
  }
}
```

**Relationship Values:** `Father`, `Mother`, `Friend`, `Sister`, `Brother`, `Spouse`, `Other`

**Flutter Integration:**
```dart
Future<void> updateEmergencyContacts(
  EmergencyContact primary,
  EmergencyContact? secondary,
) async {
  final token = await getToken();
  final response = await http.put(
    Uri.parse('$baseUrl/profile/emergency-contacts'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'primaryContact': primary.toJson(),
      'secondaryContact': secondary?.toJson(),
    }),
  );
  
  if (response.statusCode != 200) {
    throw Exception('Failed to update emergency contacts');
  }
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
    "name": "John Doe",
    "gender": "male",
    "address": "123 Main St"
  },
  "emergencyContact": {
    "primary": {
      "fullName": "Jane Doe",
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
      "name": "John Doe",
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

## Emergency Contacts (Legacy)

### Add Emergency Contact

Add a new emergency contact.

**Endpoint:** `POST /emergency/contact`

**Headers:**
```
Authorization: Bearer <sessionToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "ContactName": "Jane Doe",
  "Relation": "Spouse",
  "PhoneNumber": "+201234567890",
  "SecondaryPhone": "+201234567891",
  "Email": "jane@example.com",
  "IsPrimary": true,
  "Priority": 1,
  "Notes": "Emergency contact"
}
```

**Field Requirements:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| ContactName | string | Yes | 2-100 chars |
| PhoneNumber | string | Yes | E.164 format (10-15 digits) |
| Relation | string | No | Max 50 chars |
| IsPrimary | boolean | No | true/false |

---

### Get All Emergency Contacts

**Endpoint:** `GET /emergency/contacts`

**Headers:**
```
Authorization: Bearer <sessionToken>
```

---

### Update Emergency Contact

**Endpoint:** `PUT /emergency/contact/:id`

**Headers:**
```
Authorization: Bearer <sessionToken>
Content-Type: application/json
```

---

### Delete Emergency Contact

**Endpoint:** `DELETE /emergency/contact/:id`

**Headers:**
```
Authorization: Bearer <sessionToken>
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
      "Username": "John Doe",
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
        "ContactName": "Jane Doe",
        "Relation": "Spouse",
        "PhoneNumber": "+201234567890",
        "IsPrimary": true
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
| 404 | Not Found | Resource doesn't exist |
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
  final String fullName;
  final String phoneNumber;
  final String relationship;
  
  EmergencyContact({
    required this.fullName,
    required this.phoneNumber,
    required this.relationship,
  });
  
  Map<String, dynamic> toJson() => {
    'fullName': fullName,
    'phoneNumber': phoneNumber,
    'relationship': relationship,
  };
  
  factory EmergencyContact.fromJson(Map<String, dynamic> json) =>
    EmergencyContact(
      fullName: json['fullName'],
      phoneNumber: json['phoneNumber'],
      relationship: json['relationship'],
    );
}
```

---

## API Summary

| Category | Endpoints | Auth Required |
|----------|-----------|---------------|
| **Auth** | Register, Login, Google, Apple, Refresh | Some public |
| **Profile** | Personal Info, Emergency Contacts | Yes |
| **Medical** | Medical Info, Profile Dashboard | Yes |
| **Emergency** | Contacts CRUD | Yes |
| **Family** | Family Members CRUD | Yes |
| **Wristband** | Register, List, Activate, Revoke | Yes |
| **Scan** | QR Scan (Public), NFC Scan (Public), History | Partial |

**Total Endpoints:** 30+

---

*Generated for LifeCode Flutter Integration*
