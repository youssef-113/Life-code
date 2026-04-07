# NFC & Barcode Workflow Documentation

## Overview

This document describes the NFC read/write operations and web-based data retrieval workflow for the LifeCode emergency response system.

## Architecture

### Local NFC Data (KCAD Data)
- **Storage**: Data is stored locally on the NFC tag via the mobile app
- **Operations**: The app performs read and write operations directly on the NFC tag
- **Purpose**: Local data management for offline scenarios

### Web-based Data Retrieval
- **Hosting**: Secure HTTPS platform (e.g., `livecode.netlify.com`)
- **Identifier**: Each user has a unique user ID stored as a string in a barcode
- **Access**: Browser requests data from the web service using the user ID

## Workflow Diagram

```
1. NFC Data Storage
   App reads/writes KCAD Data directly to NFC tag
   (Local offline storage)

2. Barcode Encoding
   User ID encoded into QR code/barcode
   Example: "abc123xyz456"

3. Barcode Scanning
   Scanner extracts user ID string
   Example: "abc123xyz456"

4. Web Request Formation
   User ID appended to base URL
   Example: https://api.yourdomain.com/api/app/public/user/abc123xyz456

5. Online Data Access
   Browser requests data via HTTPS
   Server returns complete user profile
```

## API Endpoints

### Public User Profile Endpoint

**GET** `/api/app/public/user/:userID`

**Description**: Public endpoint to retrieve user emergency information by user ID. Designed for web-based access via barcode/QR code scanning.

**Access**: Public (no authentication required)

**Parameters**:
- `userID` (path parameter): The unique user ID from the barcode/QR code

**Query Parameters** (optional):
- `latitude`: Latitude coordinate for location tracking
- `longitude`: Longitude coordinate for location tracking
- `location`: Human-readable location description

**Response** (Success - 200):
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "reportType": "complete_user_report",
    "userID": "abc123xyz456",
    "accessedAt": "2026-04-07T14:09:00.000Z",
    "user": {
      "id": "abc123xyz456",
      "Username": "John Doe",
      "Email": "john@example.com",
      "Gender": "Male",
      "NationalID": null,
      "PhotoURL": "https://res.cloudinary.com/...",
      "PhoneNumber": "+1234567890",
      "Address": "123 Main St, City",
      "DateOfBirth": "1990-01-15",
      "IsActive": true,
      "CreatedAt": "2026-01-01T00:00:00.000Z",
      "UpdatedAt": "2026-04-01T00:00:00.000Z"
    },
    "medical": {
      "BloodType": "A+",
      "Height": 180,
      "Weight": 75,
      "MedicalConditions": ["Diabetes Type 2"],
      "HasAllergies": true,
      "Allergies": ["Penicillin"],
      "HasMedications": false,
      "Medications": null,
      "HasSurgeries": false,
      "Surgeries": null,
      "EmergencyInstructions": "Administer insulin if unconscious",
      "Notes": null
    },
    "emergencyContacts": [
      {
        "id": "contact123",
        "ContactName": "Jane Doe",
        "phoneNumbers": ["+1234567890", "+0987654321"],
        "relationship": "Spouse",
        "isPrimary": true,
        "notes": "Primary emergency contact",
        "CreatedAt": "2026-01-15T00:00:00.000Z"
      }
    ],
    "wristband": {
      "BandID": "band789",
      "SerialNumber": "SN-2026-00001",
      "QRCode": "QR123456",
      "NFCTag": "NFC789012",
      "IsPrimary": true,
      "ActivatedAt": "2026-01-01T00:00:00.000Z"
    }
  }
}
```

**Response** (Error - 400):
```json
{
  "success": false,
  "error": "Bad Request",
  "message": "Invalid user ID format",
  "code": 400
}
```

**Response** (Error - 404):
```json
{
  "success": false,
  "error": "Not Found",
  "message": "User not found",
  "code": 404
}
```

**Response** (Error - 403):
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "This user account is not active",
  "code": 403
}
```

## Barcode/QR Code Format

### Option 1: Direct User ID
The barcode/QR code contains only the user ID:
```
abc123xyz456
```

### Option 2: Full URL
The barcode/QR code contains the complete URL:
```
https://api.yourdomain.com/api/app/public/user/abc123xyz456
```

## Scan Endpoints (Alternative Methods)

### QR Code Scan
**POST** `/api/app/scan/qr`

**Request Body**:
```json
{
  "qrCode": "QR123456",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "location": "New York City",
  "scannerType": "emergency"
}
```

### NFC Tag Scan
**POST** `/api/app/scan/nfc`

**Request Body**:
```json
{
  "nfcTag": "NFC789012",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "location": "New York City",
  "scannerType": "hospital"
}
```

### Band ID Scan
**POST** `/api/app/scan/band`

**Request Body**:
```json
{
  "bandId": "band789",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "location": "New York City",
  "scannerType": "public"
}
```

## Security & Privacy

### Access Logging
All public accesses are logged in the `ScanLogs` collection with:
- UserID
- ScanType (WEB_ACCESS, QR, NFC, BAND_ID)
- ScannerType (emergency, hospital, public, personal)
- Location (latitude, longitude, human-readable)
- IP Address
- User Agent
- Timestamp

### Data Protection
- Only active users' profiles are accessible
- Inactive accounts return 403 Forbidden
- User ID format is validated (minimum 10 characters)
- All responses are served over HTTPS

## Implementation Guide

### For Mobile App

1. **Generate QR Code**:
   ```javascript
   const userID = "abc123xyz456";
   const qrCodeURL = `https://api.yourdomain.com/api/app/public/user/${userID}`;
   // Generate QR code containing qrCodeURL
   ```

2. **Write to NFC Tag**:
   ```javascript
   const nfcData = {
     userID: "abc123xyz456",
     qrCode: "QR123456",
     localData: "KCAD Data" // Local offline data
   };
   // Write nfcData to NFC tag
   ```

### For Web Scanner

1. **Scan Barcode/QR Code**:
   ```javascript
   const scannedData = "abc123xyz456"; // or full URL
   ```

2. **Make API Request**:
   ```javascript
   const response = await fetch(`https://api.yourdomain.com/api/app/public/user/${scannedData}`);
   const data = await response.json();
   ```

3. **Display User Profile**:
   ```javascript
   if (data.success) {
     displayUserProfile(data.data);
   }
   ```

## Core Concepts

| Concept | Description |
|---------|-------------|
| **NFC read & write** | Direct manipulation of data stored on NFC tags |
| **KCAD Data** | Local data stored on NFC, managed by the app |
| **Unique user ID** | Identifier stored in barcode, used for web requests |
| **HTTPS host** | Secure online platform hosting user data endpoints |
| **Barcode scanning** | Mechanism to extract the user ID for web interaction |
| **Endpoint URL construction** | Combining base URL with user ID for data retrieval |

## Use Cases

### Emergency Response
1. First responder scans patient's wristband QR code
2. Browser opens user profile endpoint
3. Emergency information displayed immediately
4. Contact emergency contacts listed in profile

### Hospital Admission
1. Hospital staff scans patient's barcode
2. Medical history and conditions displayed
3. Allergies and medications visible
4. Emergency instructions accessible

### Public Access
1. Good Samaritan scans lost person's wristband
2. Contact information for emergency contacts displayed
3. Medical conditions and allergies visible
4. Location logged for safety

## Testing

### Test with cURL
```bash
curl -X GET "https://api.yourdomain.com/api/app/public/user/abc123xyz456?latitude=40.7128&longitude=-74.0060&location=New%20York%20City"
```

### Test with Browser
Simply open the URL in any web browser:
```
https://api.yourdomain.com/api/app/public/user/abc123xyz456
```

## Rate Limiting

Public endpoints are rate-limited to prevent abuse:
- Default: 100 requests per 15 minutes per IP
- Emergency scanners may have higher limits

## Support

For issues or questions:
- Check API logs for detailed error messages
- Verify user ID format and validity
- Ensure user account is active
- Check network connectivity and HTTPS certificate
