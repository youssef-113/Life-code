# Authentication Endpoints Test Plan

## Base URL
```
Development: http://localhost:3000/api/app
Production: https://your-domain.com/api/app
```

## Headers
```
Content-Type: application/json
Authorization: Bearer <sessionToken> (for protected routes)
```

---

# 1. LOGIN ENDPOINT

## POST /api/app/login

### Request Body
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userID": "abc123",
    "username": "johndoe",
    "email": "user@example.com",
    "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "550e8400-e29b-41d4-a716-446655440000",
    "expiresAt": "2026-03-31T20:00:00.000Z",
    "sessionID": "session123",
    "deviceName": "Windows PC",
    "suspiciousLogin": null
  }
}
```

### Error Responses

#### Invalid Credentials (401)
```json
{
  "success": false,
  "error": "Authentication Failed",
  "message": "Wrong password. Please try again.",
  "code": 401,
  "remainingAttempts": 4,
  "delayMs": 1000
}
```

#### Account Locked (423)
```json
{
  "success": false,
  "error": "Account Locked",
  "message": "Account temporarily locked. Try again in 15 minutes.",
  "code": 423,
  "remainingTimeMinutes": 15
}
```

#### Rate Limited (429)
```json
{
  "success": false,
  "error": "Too Many Requests",
  "message": "Too many login attempts. Please try again after 15 minutes.",
  "code": 429
}
```

#### Validation Error (400)
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Invalid email address",
  "code": 400
}
```

### Test Cases

| Test Case | Body | Expected Status | Expected Message |
|-----------|------|-----------------|------------------|
| Valid login | Valid email/password | 200 | "Login successful" |
| Wrong password | Valid email, wrong password | 401 | "Wrong password..." |
| Non-existent user | Fake email | 401 | "Invalid email or password" |
| Invalid email format | "notanemail" | 400 | "Invalid email address" |
| Missing password | Email only | 400 | "Password is required" |
| 6th failed attempt | After 5 failures | 423 | "Account temporarily locked" |
| Rate limit exceeded | 6+ requests rapidly | 429 | "Too many login attempts" |

---

# 2. REGISTER ENDPOINT

## POST /api/app/register

### Request Body
```json
{
  "name": "John Doe",
  "email": "newuser@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!"
}
```

### Success Response (201)
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userID": "newUid123",
    "username": "John Doe",
    "email": "newuser@example.com",
    "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "550e8400-e29b-41d4-a716-446655440000",
    "expiresAt": "2026-03-31T20:00:00.000Z",
    "deviceName": "Windows PC",
    "createdAt": "2026-03-31T18:00:00.000Z"
  }
}
```

### Error Responses

#### Email Exists (400)
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Email already exists",
  "code": 400
}
```

#### Password Mismatch (400)
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Passwords do not match",
  "code": 400
}
```

#### Rate Limited (429)
```json
{
  "success": false,
  "error": "Too Many Requests",
  "message": "Too many registration attempts. Please try again after 1 hour.",
  "code": 429
}
```

### Test Cases

| Test Case | Body | Expected Status | Expected Message |
|-----------|------|-----------------|------------------|
| Valid registration | All valid fields | 201 | "User registered successfully" |
| Duplicate email | Existing email | 400 | "Email already exists" |
| Password mismatch | Different passwords | 400 | "Passwords do not match" |
| Short password | 5 char password | 400 | "Password must be at least 8 characters" |
| Short name | 1 char name | 400 | "Name must be between 2 and 50 characters" |
| Invalid email | "notanemail" | 400 | "Invalid email address" |
| Rate limit | 4+ registrations/hour | 429 | "Too many registration attempts" |

---

# 3. GOOGLE OAUTH REGISTER

## POST /api/app/register/google

### Request Body
```json
{
  "googleID": "google-unique-id-123",
  "email": "googleuser@gmail.com",
  "username": "GoogleUser",
  "photoURL": "https://lh3.googleusercontent.com/...",
  "gender": "male"
}
```

### Success Response (201)
```json
{
  "success": true,
  "message": "User registered with Google successfully",
  "data": {
    "userID": "generated-uid",
    "username": "GoogleUser",
    "email": "googleuser@gmail.com",
    "googleID": "google-unique-id-123",
    "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "550e8400-e29b-41d4-a716-446655440000",
    "expiresAt": "2026-03-31T20:00:00.000Z",
    "deviceName": "Windows PC"
  }
}
```

### Test Cases

| Test Case | Body | Expected Status | Expected Message |
|-----------|------|-----------------|------------------|
| New Google user | Valid googleID, email | 201 | "User registered with Google successfully" |
| Existing user | Existing email | 200 | "User logged in with Google successfully" |
| Missing googleID | No googleID | 400 | "Google ID is required" |
| Invalid email | Bad email format | 400 | "Invalid email address" |
| Rate limit | 11+ requests/hour | 429 | "Too many OAuth attempts" |

---

# 4. APPLE REGISTER

## POST /api/app/register/apple

### Request Body
```json
{
  "appleID": "apple-unique-id-123",
  "email": "appleuser@privaterelay.appleid.com",
  "name": "Apple User"
}
```

### Success Response (201)
```json
{
  "success": true,
  "message": "User registered with Apple successfully",
  "data": {
    "userID": "generated-uid",
    "username": "Apple User",
    "email": "appleuser@privaterelay.appleid.com",
    "appleID": "apple-unique-id-123",
    "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "550e8400-e29b-41d4-a716-446655440000",
    "expiresAt": "2026-03-31T20:00:00.000Z",
    "deviceName": "iPhone"
  }
}
```

### Test Cases

| Test Case | Body | Expected Status | Expected Message |
|-----------|------|-----------------|------------------|
| New Apple user | Valid appleID, email | 201 | "User registered with Apple successfully" |
| Existing user | Existing email | 200 | "User logged in with Apple successfully" |
| Missing appleID | No appleID | 400 | "Apple ID is required" |
| Rate limit | 11+ requests/hour | 429 | "Too many OAuth attempts" |

---

# 5. LOGOUT ENDPOINT

## POST /api/app/logout

### Headers
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Request Body
```json
{}
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": {
    "loggedOutAt": "2026-03-31T19:00:00.000Z"
  }
}
```

### Error Responses

#### No Token (401)
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "No token provided",
  "code": 401
}
```

#### Invalid Token (401)
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid session",
  "code": 401
}
```

### Test Cases

| Test Case | Headers | Expected Status | Expected Message |
|-----------|---------|-----------------|------------------|
| Valid logout | Valid Bearer token | 200 | "Logged out successfully" |
| No token | No Authorization header | 401 | "No token provided" |
| Invalid token | Fake token | 401 | "Invalid session" |
| Expired token | Expired JWT | 401 | "Invalid session" |

---

# 6. LOGOUT ALL DEVICES

## POST /api/app/logout-all

### Headers
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Request Body
```json
{}
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Logged out from all devices successfully",
  "data": {
    "sessionsLoggedOut": 3,
    "loggedOutAt": "2026-03-31T19:00:00.000Z"
  }
}
```

### Test Cases

| Test Case | Headers | Expected Status | Expected Message |
|-----------|---------|-----------------|------------------|
| Valid logout all | Valid Bearer token | 200 | "Logged out from all devices successfully" |
| No active sessions | Valid token | 200 | "No active sessions found" |
| No token | No Authorization | 401 | "No token provided" |

---

# 7. REFRESH TOKEN

## POST /api/app/refresh

### Request Body
```json
{
  "refreshToken": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "new-refresh-token-uuid",
    "expiresAt": "2026-03-31T20:15:00.000Z"
  }
}
```

### Error Responses

#### Invalid Refresh Token (401)
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid or expired refresh token",
  "code": 401
}
```

#### Rate Limited (429)
```json
{
  "success": false,
  "error": "Too Many Requests",
  "message": "Too many token refresh attempts.",
  "code": 429
}
```

### Test Cases

| Test Case | Body | Expected Status | Expected Message |
|-----------|------|-----------------|------------------|
| Valid refresh | Valid refreshToken | 200 | "Token refreshed successfully" |
| Invalid refresh | Fake refreshToken | 401 | "Invalid or expired refresh token" |
| Missing token | Empty body | 400 | "Refresh token is required" |
| Rate limit | 11+ refreshes/15min | 429 | "Too many token refresh attempts" |

---

# 8. GET ACTIVE SESSIONS

## GET /api/app/sessions

### Headers
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "session1",
        "UserID": "user123",
        "UserAgent": "Mozilla/5.0 (Windows NT 10.0...)",
        "IPAddress": "192.168.1.1",
        "DeviceName": "Windows PC",
        "DeviceType": "desktop",
        "IsActive": true,
        "CreatedAt": "2026-03-31T10:00:00.000Z",
        "LastUsed": "2026-03-31T18:00:00.000Z",
        "ExpiresAt": "2026-04-07T10:00:00.000Z"
      },
      {
        "id": "session2",
        "DeviceName": "iPhone",
        "DeviceType": "mobile",
        "IsActive": true,
        "LastUsed": "2026-03-31T15:00:00.000Z"
      }
    ],
    "totalActiveSessions": 2
  }
}
```

### Test Cases

| Test Case | Headers | Expected Status | Expected Result |
|-----------|---------|-----------------|-----------------|
| Valid request | Valid Bearer token | 200 | Array of sessions |
| No sessions | Valid token, no sessions | 200 | Empty array |
| No token | No Authorization | 401 | "No token provided" |

---

# 9. REVOKE SESSION

## DELETE /api/app/sessions/:sessionId

### Headers
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### URL Parameters
- `sessionId`: The session ID to revoke

### Success Response (200)
```json
{
  "success": true,
  "message": "Session revoked successfully",
  "data": {
    "sessionId": "session123",
    "revokedAt": "2026-03-31T19:00:00.000Z"
  }
}
```

### Error Responses

#### Session Not Found (404)
```json
{
  "success": false,
  "error": "Not Found",
  "message": "Session not found",
  "code": 404
}
```

#### Not Owner (403)
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "You do not have permission to revoke this session",
  "code": 403
}
```

### Test Cases

| Test Case | URL | Headers | Expected Status |
|-----------|-----|---------|-----------------|
| Revoke own session | /sessions/session1 | Valid token (owner) | 200 |
| Revoke other's session | /sessions/otherSession | Valid token (not owner) | 403 |
| Invalid session ID | /sessions/fakeId | Valid token | 404 |
| No token | /sessions/session1 | No Authorization | 401 |

---

# SECURITY TESTING SCENARIOS

## 1. Brute Force Attack Test

### Steps
1. Send 5 failed login attempts with same email
2. Verify progressive delay increases (1s, 2s, 4s...)
3. Verify account locks on 6th attempt
4. Wait 15 minutes
5. Verify account unlocks

### Expected Behavior
```
Attempt 1: 401, remainingAttempts: 4, delayMs: 1000
Attempt 2: 401, remainingAttempts: 3, delayMs: 2000
Attempt 3: 401, remainingAttempts: 2, delayMs: 4000
Attempt 4: 401, remainingAttempts: 1, delayMs: 8000
Attempt 5: 401, remainingAttempts: 0, delayMs: 16000
Attempt 6: 423, locked: true, remainingTimeMinutes: 15
```

## 2. Rate Limiting Test

### Steps
1. Send 6 rapid login requests from same IP
2. Verify rate limit triggers
3. Wait 15 minutes
4. Verify rate limit resets

### Expected Behavior
```
Requests 1-5: Normal processing
Request 6+: 429 Too Many Requests
After 15 min: Normal processing resumes
```

## 3. Token Expiry Test

### Steps
1. Login and get sessionToken
2. Wait 15 minutes
3. Try to access protected route
4. Use refreshToken to get new token
5. Access protected route again

### Expected Behavior
```
After 15 min: 401 Unauthorized
After refresh: 200 OK with new token
```

## 4. Suspicious Login Test

### Steps
1. Login from Device A (Windows PC)
2. Login from Device B (iPhone) within 5 minutes
3. Check response for suspiciousLogin field

### Expected Behavior
```json
{
  "suspiciousLogin": {
    "detected": true,
    "reason": "Rapid login from different device - possible account takeover"
  }
}
```

---

# POSTMAN COLLECTION SETUP

## Environment Variables
```
BASE_URL: http://localhost:3000/api/app
SESSION_TOKEN: (auto-set from login response)
REFRESH_TOKEN: (auto-set from login response)
USER_ID: (auto-set from login response)
```

## Collection Variables
```json
{
  "email": "test@example.com",
  "password": "TestPassword123!",
  "name": "Test User"
}
```

## Test Scripts (Postman)

### Auto-save tokens after login
```javascript
pm.test("Save tokens", function() {
  const response = pm.response.json();
  if (response.success) {
    pm.environment.set("SESSION_TOKEN", response.data.sessionToken);
    pm.environment.set("REFRESH_TOKEN", response.data.refreshToken);
    pm.environment.set("USER_ID", response.data.userID);
  }
});
```

### Verify response structure
```javascript
pm.test("Response has required fields", function() {
  const response = pm.response.json();
  pm.expect(response).to.have.property('success');
  pm.expect(response).to.have.property('message');
  if (response.success) {
    pm.expect(response).to.have.property('data');
  }
});
```
