# Postman Testing Guide

This guide provides step-by-step instructions for testing the new APIs and updates in Postman.

## Table of Contents
1. [Public User Profile Endpoint](#1-public-user-profile-endpoint)
2. [QR Code URL Generation](#2-qr-code-url-generation)
3. [Emergency Contact Field Mapping](#3-emergency-contact-field-mapping)
4. [Complete Postman Collection](#4-complete-postman-collection)

---

## 1. Public User Profile Endpoint

### Endpoint Information
- **Method**: `GET`
- **URL**: `/api/app/public/user/:userID`
- **Authentication**: None (Public endpoint)
- **Description**: Retrieve user emergency information by user ID

### Test Steps

#### Step 1: Get a Valid User ID
First, you need a valid user ID from your database. You can get this by:
1. Logging in via `/api/app/login` and getting the `userID` from the response
2. Or using a known user ID from your Firestore database

#### Step 2: Create Request in Postman

**Request Details:**
- **Method**: `GET`
- **URL**: `{{base_url}}/api/app/public/user/YOUR_USER_ID`
- **Headers**: 
  - `Content-Type`: `application/json`

**Example URL:**
```
http://localhost:3000/api/app/public/user/abc123xyz456
```

#### Step 3: Send Request and Verify Response

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "reportType": "complete_user_report",
    "userID": "abc123xyz456",
    "accessedAt": "2026-04-07T14:20:00.000Z",
    "user": {
      "id": "abc123xyz456",
      "Username": "John Doe",
      "Email": "john@example.com",
      "Gender": "Male",
      "PhotoURL": "https://res.cloudinary.com/...",
      "PhoneNumber": "+1234567890",
      "Address": "123 Main St, City",
      "DateOfBirth": "1990-01-15",
      "IsActive": true
    },
    "medical": {
      "BloodType": "A+",
      "Height": 180,
      "Weight": 75,
      "MedicalConditions": ["Diabetes Type 2"],
      "HasAllergies": true,
      "Allergies": ["Penicillin"],
      "EmergencyInstructions": "Administer insulin if unconscious"
    },
    "emergencyContacts": [
      {
        "id": "contact123",
        "ContactName": "Jane Doe",
        "phoneNumbers": ["+1234567890", "+0987654321"],
        "relationship": "Spouse",
        "isPrimary": true,
        "notes": "Primary emergency contact"
      }
    ],
    "wristband": {
      "BandID": "band789",
      "SerialNumber": "SN-2026-00001",
      "QRCode": "QR123456",
      "NFCTag": "NFC789012",
      "IsPrimary": true
    }
  }
}
```

**Error Response - Invalid User ID (400 Bad Request):**
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "Invalid user ID format",
  "code": 400
}
```

**Error Response - User Not Found (404 Not Found):**
```json
{
  "success": false,
  "error": "Not Found",
  "message": "User not found",
  "code": 404
}
```

**Error Response - Inactive Account (403 Forbidden):**
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "This user account is not active",
  "code": 403
}
```

#### Step 4: Test with Query Parameters (Optional)

You can add optional query parameters for location tracking:

**URL with location:**
```
http://localhost:3000/api/app/public/user/abc123xyz456?latitude=40.7128&longitude=-74.0060&location=New%20York%20City
```

---

## 2. QR Code URL Generation

### Endpoint Information
- **Method**: `GET`
- **URL**: `/api/app/wristband/qr-url/:userID`
- **Authentication**: Bearer Token required
- **Description**: Generate QR code URL for web-based access

### Test Steps

#### Step 1: Get Authentication Token
1. Login via `/api/app/login` to get your JWT token
2. Copy the `sessionToken` from the response

#### Step 2: Create Request in Postman

**Request Details:**
- **Method**: `GET`
- **URL**: `{{base_url}}/api/app/wristband/qr-url/YOUR_USER_ID`
- **Headers**: 
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer YOUR_JWT_TOKEN`

**Example URL:**
```
http://localhost:3000/api/app/wristband/qr-url/abc123xyz456
```

#### Step 3: Send Request and Verify Response

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userID": "abc123xyz456",
    "qrCodeURL": "http://localhost:3000/api/app/public/user/abc123xyz456",
    "qrCodeContent": "abc123xyz456",
    "format": "url",
    "description": "QR code can contain either the full URL or just the user ID"
  }
}
```

#### Step 4: Test with Custom Base URL

**URL with custom base URL:**
```
http://localhost:3000/api/app/wristband/qr-url/abc123xyz456?baseURL=https://api.yourdomain.com
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userID": "abc123xyz456",
    "qrCodeURL": "https://api.yourdomain.com/api/app/public/user/abc123xyz456",
    "qrCodeContent": "abc123xyz456",
    "format": "url"
  }
}
```

---

## 3. Emergency Contact Field Mapping

### Test 3.1: Add Contact with PascalCase Fields

#### Endpoint Information
- **Method**: `POST`
- **URL**: `/api/app/emergency/contact`
- **Authentication**: Bearer Token required
- **Description**: Add emergency contact using PascalCase field names

#### Request Details

**URL:**
```
http://localhost:3000/api/app/emergency/contact
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body (PascalCase):**
```json
{
  "ContactName": "Jane besso home",
  "Relation": "Spouse",
  "phoneNumbers": ["+201234567890", "+201234567891"],
  "IsPrimary": true,
  "Priority": 1,
  "Notes": "Primary emergency contact"
}
```

#### Expected Response

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Emergency contact added successfully",
  "data": {
    "id": "76nNLNDOrhNpIFjRmC7o",
    "ContactName": "Jane besso home",
    "phoneNumbers": ["+201234567890", "+201234567891"],
    "relationship": "Spouse",
    "isPrimary": true,
    "notes": "Primary emergency contact",
    "priority": 1,
    "updatedAt": "2026-04-07T22:27:51.151Z"
  },
  "profileCompletion": 57,
  "completionLevel": "medium",
  "nextRecommendedStep": "Complete your personal information"
}
```

**Note:** The response uses camelCase (`relationship`, `isPrimary`, `notes`) but the values match what you sent in PascalCase.

### Test 3.2: Add Contact with camelCase Fields

#### Request Body (camelCase):**
```json
{
  "ContactName": "John Doe",
  "relationship": "Brother",
  "phoneNumbers": ["+201234567892"],
  "isPrimary": false,
  "Priority": 2,
  "notes": "Secondary emergency contact"
}
```

#### Expected Response

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Emergency contact added successfully",
  "data": {
    "id": "xyz123abc456",
    "ContactName": "John Doe",
    "phoneNumbers": ["+201234567892"],
    "relationship": "Brother",
    "isPrimary": false,
    "notes": "Secondary emergency contact",
    "priority": 2,
    "updatedAt": "2026-04-07T22:30:00.000Z"
  },
  "profileCompletion": 72,
  "completionLevel": "medium",
  "nextRecommendedStep": "Complete your medical profile"
}
```

### Test 3.3: Add Contact with Free-Text Relationship

**Request Body (custom relationship):**
```json
{
  "ContactName": "Best Friend",
  "Relation": "Best Friend from College",
  "phoneNumbers": ["+201234567893"],
  "IsPrimary": false,
  "Priority": 3,
  "Notes": "College roommate"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Emergency contact added successfully",
  "data": {
    "id": "def456ghi789",
    "ContactName": "Best Friend",
    "phoneNumbers": ["+201234567893"],
    "relationship": "Best Friend from College",
    "isPrimary": false,
    "notes": "College roommate",
    "priority": 3,
    "updatedAt": "2026-04-07T22:35:00.000Z"
  }
}
```

### Test 3.4: Update Contact with PascalCase Fields

#### Endpoint Information
- **Method**: `PUT`
- **URL**: `/api/app/emergency/contact/:contactId`
- **Authentication**: Bearer Token required

#### Request Details

**URL:**
```
http://localhost:3000/api/app/emergency/contact/76nNLNDOrhNpIFjRmC7o
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body (PascalCase):**
```json
{
  "Relation": "Wife",
  "IsPrimary": true,
  "Notes": "Updated notes - wife"
}
```

#### Expected Response

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Emergency contact updated successfully",
  "data": {
    "id": "76nNLNDOrhNpIFjRmC7o",
    "ContactName": "Jane besso home",
    "phoneNumbers": ["+201234567890", "+201234567891"],
    "relationship": "Wife",
    "isPrimary": true,
    "notes": "Updated notes - wife",
    "priority": 1,
    "updatedAt": "2026-04-07T22:40:00.000Z"
  }
}
```

### Test 3.5: Bulk Add Contacts with Mixed Case

#### Endpoint Information
- **Method**: `POST`
- **URL**: `/api/app/emergency/contacts/bulk`
- **Authentication**: Bearer Token required

#### Request Details

**URL:**
```
http://localhost:3000/api/app/emergency/contacts/bulk
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body (Mixed PascalCase and camelCase):**
```json
{
  "contacts": [
    {
      "ContactName": "Mother",
      "Relation": "Mother",
      "phoneNumbers": ["+201234567894"],
      "IsPrimary": true,
      "Notes": "My mother"
    },
    {
      "ContactName": "Father",
      "relationship": "Father",
      "phoneNumbers": ["+201234567895"],
      "isPrimary": false,
      "notes": "My father"
    }
  ]
}
```

#### Expected Response

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "2 emergency contact(s) added successfully",
  "data": {
    "userID": "abc123xyz456",
    "contacts": [
      {
        "id": "jkl789mno012",
        "ContactName": "Mother",
        "phoneNumbers": ["+201234567894"],
        "relationship": "Mother",
        "isPrimary": true,
        "notes": "My mother",
        "priority": 4,
        "updatedAt": "2026-04-07T22:45:00.000Z"
      },
      {
        "id": "pqr345stu678",
        "ContactName": "Father",
        "phoneNumbers": ["+201234567895"],
        "relationship": "Father",
        "isPrimary": false,
        "notes": "My father",
        "priority": 5,
        "updatedAt": "2026-04-07T22:45:00.000Z"
      }
    ],
    "count": 2
  },
  "profileCompletion": 85,
  "completionLevel": "high",
  "nextRecommendedStep": "Complete your photo upload"
}
```

---

## 4. Complete Postman Collection

### Environment Variables

Create a Postman environment with these variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `base_url` | `http://localhost:3000` | Your API base URL |
| `user_id` | `YOUR_USER_ID` | Your test user ID |
| `jwt_token` | `YOUR_JWT_TOKEN` | Your authentication token |

### Collection Structure

```
LifeCode API Tests
|
+-- 1. Public Endpoints
|   +-- Get User Profile (Public)
|
+-- 2. Wristband Endpoints
|   +-- Generate QR Code URL
|
+-- 3. Emergency Contacts
|   +-- Add Contact (PascalCase)
|   +-- Add Contact (camelCase)
|   +-- Add Contact (Free-Text Relationship)
|   +-- Update Contact (PascalCase)
|   +-- Bulk Add Contacts (Mixed Case)
|   +-- Get All Contacts
|   +-- Get Single Contact
```

### Import Collection JSON

Save this as `LifeCode_API_Tests.postman_collection.json` and import into Postman:

```json
{
  "info": {
    "name": "LifeCode API Tests",
    "description": "Test collection for LifeCode API endpoints",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000",
      "type": "string"
    },
    {
      "key": "user_id",
      "value": "YOUR_USER_ID",
      "type": "string"
    },
    {
      "key": "jwt_token",
      "value": "YOUR_JWT_TOKEN",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "1. Public Endpoints",
      "item": [
        {
          "name": "Get User Profile (Public)",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "url": {
              "raw": "{{base_url}}/api/app/public/user/{{user_id}}",
              "host": ["{{base_url}}"],
              "path": ["api", "app", "public", "user", "{{user_id}}"]
            },
            "description": "Retrieve user emergency information by user ID (no auth required)"
          }
        }
      ]
    },
    {
      "name": "2. Wristband Endpoints",
      "item": [
        {
          "name": "Generate QR Code URL",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              },
              {
                "key": "Authorization",
                "value": "Bearer {{jwt_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/api/app/wristband/qr-url/{{user_id}}",
              "host": ["{{base_url}}"],
              "path": ["api", "app", "wristband", "qr-url", "{{user_id}}"]
            },
            "description": "Generate QR code URL for web-based access"
          }
        }
      ]
    },
    {
      "name": "3. Emergency Contacts",
      "item": [
        {
          "name": "Add Contact (PascalCase)",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              },
              {
                "key": "Authorization",
                "value": "Bearer {{jwt_token}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"ContactName\": \"Jane besso home\",\n  \"Relation\": \"Spouse\",\n  \"phoneNumbers\": [\"+201234567890\", \"+201234567891\"],\n  \"IsPrimary\": true,\n  \"Priority\": 1,\n  \"Notes\": \"Primary emergency contact\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/api/app/emergency/contact",
              "host": ["{{base_url}}"],
              "path": ["api", "app", "emergency", "contact"]
            },
            "description": "Add emergency contact using PascalCase field names"
          }
        },
        {
          "name": "Add Contact (camelCase)",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              },
              {
                "key": "Authorization",
                "value": "Bearer {{jwt_token}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"ContactName\": \"John Doe\",\n  \"relationship\": \"Brother\",\n  \"phoneNumbers\": [\"+201234567892\"],\n  \"isPrimary\": false,\n  \"Priority\": 2,\n  \"notes\": \"Secondary emergency contact\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/api/app/emergency/contact",
              "host": ["{{base_url}}"],
              "path": ["api", "app", "emergency", "contact"]
            },
            "description": "Add emergency contact using camelCase field names"
          }
        },
        {
          "name": "Add Contact (Free-Text Relationship)",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              },
              {
                "key": "Authorization",
                "value": "Bearer {{jwt_token}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"ContactName\": \"Best Friend\",\n  \"Relation\": \"Best Friend from College\",\n  \"phoneNumbers\": [\"+201234567893\"],\n  \"IsPrimary\": false,\n  \"Priority\": 3,\n  \"Notes\": \"College roommate\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/api/app/emergency/contact",
              "host": ["{{base_url}}"],
              "path": ["api", "app", "emergency", "contact"]
            },
            "description": "Add emergency contact with custom free-text relationship"
          }
        },
        {
          "name": "Update Contact (PascalCase)",
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              },
              {
                "key": "Authorization",
                "value": "Bearer {{jwt_token}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"Relation\": \"Wife\",\n  \"IsPrimary\": true,\n  \"Notes\": \"Updated notes - wife\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/api/app/emergency/contact/YOUR_CONTACT_ID",
              "host": ["{{base_url}}"],
              "path": ["api", "app", "emergency", "contact", "YOUR_CONTACT_ID"]
            },
            "description": "Update emergency contact using PascalCase field names"
          }
        },
        {
          "name": "Bulk Add Contacts (Mixed Case)",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              },
              {
                "key": "Authorization",
                "value": "Bearer {{jwt_token}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"contacts\": [\n    {\n      \"ContactName\": \"Mother\",\n      \"Relation\": \"Mother\",\n      \"phoneNumbers\": [\"+201234567894\"],\n      \"IsPrimary\": true,\n      \"Notes\": \"My mother\"\n    },\n    {\n      \"ContactName\": \"Father\",\n      \"relationship\": \"Father\",\n      \"phoneNumbers\": [\"+201234567895\"],\n      \"isPrimary\": false,\n      \"notes\": \"My father\"\n    }\n  ]\n}"
            },
            "url": {
              "raw": "{{base_url}}/api/app/emergency/contacts/bulk",
              "host": ["{{base_url}}"],
              "path": ["api", "app", "emergency", "contacts", "bulk"]
            },
            "description": "Bulk add emergency contacts with mixed PascalCase and camelCase"
          }
        },
        {
          "name": "Get All Contacts",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              },
              {
                "key": "Authorization",
                "value": "Bearer {{jwt_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/api/app/emergency/contacts",
              "host": ["{{base_url}}"],
              "path": ["api", "app", "emergency", "contacts"]
            },
            "description": "Get all emergency contacts for authenticated user"
          }
        }
      ]
    }
  ]
}
```

---

## Quick Testing Checklist

### Public Endpoint
- [ ] Test with valid user ID
- [ ] Test with invalid user ID format (too short)
- [ ] Test with non-existent user ID
- [ ] Test with inactive user account
- [ ] Test with location query parameters

### QR Code URL Generation
- [ ] Test with default base URL
- [ ] Test with custom base URL
- [ ] Verify returned URL format
- [ ] Verify user ID in response

### Emergency Contacts
- [ ] Add contact with PascalCase (Relation, IsPrimary, Notes)
- [ ] Add contact with camelCase (relationship, isPrimary, notes)
- [ ] Add contact with free-text relationship
- [ ] Update contact with PascalCase
- [ ] Bulk add contacts with mixed case
- [ ] Verify response uses camelCase consistently
- [ ] Verify relationship values are saved correctly
- [ ] Verify isPrimary values are saved correctly
- [ ] Verify notes values are saved correctly

---

## Tips for Testing

1. **Use Postman Environments**: Create environments for development, staging, and production
2. **Save Responses**: Save successful responses as examples for documentation
3. **Automate Tests**: Use Postman's test scripts to automate validation
4. **Monitor Logs**: Check server logs for any errors during testing
5. **Test Edge Cases**: Test with empty strings, null values, and special characters

---

## Common Issues and Solutions

### Issue: "Invalid user ID format"
**Solution**: Ensure user ID is at least 10 characters long

### Issue: "User not found"
**Solution**: Verify the user ID exists in your Firestore database

### Issue: "This user account is not active"
**Solution**: Ensure the user's `IsActive` field is set to `true` in Firestore

### Issue: "Unauthorized" for QR code generation
**Solution**: Ensure you have a valid JWT token in the Authorization header

### Issue: "Invalid relationship type"
**Solution**: This should no longer occur - relationship field now accepts free text

---

## Next Steps

1. **Import the Collection**: Import the JSON collection into Postman
2. **Set Up Environment**: Configure environment variables
3. **Run Tests**: Execute each request and verify responses
4. **Save Results**: Document successful tests and any issues
5. **Report Bugs**: Report any unexpected behavior
