# LifeCode — Complete System Specification

> **Version:** 1.0.0  
> **Author:** Youssef Besso  
> **Last Updated:** 2026-07-28  
> **Deployment:** [life-code--yossfabdla311.replit.app](https://life-code--yossfabdla311.replit.app)  
> **Repository:** [github.com/youssef-113/Life-code](https://github.com/youssef-113/Life-code)

---

## Table of Contents

1. [Project Identity](#1-project-identity)
2. [Business Analysis](#2-business-analysis)
3. [Technical Analysis](#3-technical-analysis)
4. [System Design](#4-system-design)
5. [API Documentation](#5-api-documentation)

---

## 1. Project Identity

### 1.1 Brand Overview

| Attribute | Value |
|-----------|-------|
| **Name** | LifeCode |
| **Tagline** | *Scan For Life* — Your Vital Information, Always Within Reach |
| **Logo Badge** | `![LifeCode](https://img.shields.io/badge/LifeCode-Scan%20For%20Life-1a56db)`) |
| **Domain** | Emergency Health Identification & Wearable Integration |
| **Motto** | Building to save lives |

### 1.2 Mission

Eliminate information asymmetry in medical emergencies. When a patient cannot speak — due to unconsciousness, language barriers, or shock — LifeCode ensures first responders have instant access to critical health data, emergency contacts, and medical history via a simple scan of the patient's wristband (NFC or QR).

### 1.3 Core Product — The LifeBand

A physical wristband embedding an NFC tag and a printed QR code. Each band is cryptographically linked to its owner's cloud medical profile. Scanning the band (even offline via NFC) retrieves:

- Blood type & medical conditions
- Allergies & medications
- Emergency contacts
- Emergency instructions for first responders
- Profile photo for visual identification

### 1.4 Brand Personality

- **Trustworthy** — Medical-grade reliability
- **Fast** — Sub-2-second emergency data retrieval
- **Universal** — Works online & offline, any device
- **Secure** — HIPAA/GDPR architecture-ready

---

## 2. Business Analysis

### 2.1 Problem Statement

- **2M+** emergency room visits annually involve unidentified patients
- Paramedics waste **5-15 minutes** per call trying to identify patients or find contacts
- Critical allergies/conditions are unknown in **30%+** of emergency cases
- Patient data is fragmented across paper records, multiple providers, and unconnected apps

### 2.2 Target Market

| Segment | Use Case | Value |
|---------|----------|-------|
| **Individuals with chronic conditions** | Diabetes, epilepsy, heart conditions, severe allergies | Instant condition disclosure to paramedics |
| **Elderly / Assisted living** | Multiple medications, dementia, fall risk | Caregiver contact & medication list access |
| **Parents of children** | Allergies, autism, asthma | Lost Child Mode, emergency identification |
| **Outdoor / Sports enthusiasts** | Remote activity risk | Offline NFC access without cell signal |
| **Corporate safety & schools** | Workplace/school emergency response | Bulk management, family notifications |
| **Travelers** | Language barriers, unfamiliar medical systems | Universal ID via QR, multi-language ready |

### 2.3 Value Proposition

- **For the patient:** Peace of mind that help will know your medical history even if you can't speak
- **For first responders:** Sub-2-second access to critical data — blood type, allergies, medications, contacts
- **For families:** Immediate notification and access when a loved one is in an emergency
- **For healthcare systems:** Reduced time-to-treatment, fewer unidentified admissions

### 2.4 Revenue Model (Projected)

| Model | Description |
|-------|-------------|
| **LifeBand Hardware** | Physical wristband sales (NFC + QR printed) |
| **Freemium App** | Basic profile free, premium features (family, analytics, multi-language) via subscription |
| **B2B Enterprise** | School districts, senior homes, corporate safety — bulk band + dashboard license |
| **Healthcare API** | Hospital EHR integration licensing (HL7 FHIR) |

### 2.5 Competitive Landscape

| Competitor | Weakness | LifeCode Advantage |
|------------|----------|-------------------|
| Medical ID (iOS) | iOS only, no wearable | Cross-platform + physical LifeBand |
| RoadID | No medical profile depth | Full medical history + emergency contacts + allergy tracking |
| ICE apps | App required to view data | Physical band + NFC offline access |

### 2.6 Key Metrics (Target)

- Emergency data retrieval: **< 2 seconds**
- Profile completeness rate: **> 80%**
- Scan-to-action conversion: **> 95%**
- Uptime SLA: **99.9%**

---

## 3. Technical Analysis

### 3.1 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Runtime** | Node.js | >= 18 | JavaScript server runtime |
| **Framework** | Express.js | ^4.18.2 | RESTful API framework |
| **Database** | Firebase Firestore | (admin ^12) | NoSQL document DB |
| **Authentication** | Firebase Auth + JWT (jsonwebtoken) | ^9.0.2 | Multi-provider auth + 15-day sessions |
| **Password Hashing** | bcryptjs | ^2.4.3 | Password storage |
| **Validation** | express-validator | ^7.0.1 | Input sanitization |
| **File Upload** | Multer + Cloudinary | ^1.4.5 / ^1.41.3 | Profile photo CDN upload |
| **Security** | Helmet + express-rate-limit | ^7.1.0 / ^7.1.5 | HTTP headers + rate limiting |
| **CORS** | cors | ^2.8.5 | Cross-origin requests |
| **UUID** | uuid | ^9.0.1 | Unique ID generation |
| **Testing** | Jest | ^29.7.0 | Unit/integration testing |
| **Dev** | Nodemon | ^3.1.14 | Auto-reload |

### 3.2 Architecture — 4-Layer Pattern

```
┌─────────────────────────────────────────────────────────┐
│                   src/index.js                          │
│              (Entry Point / Middleware Stack)            │
├─────────────────────────────────────────────────────────┤
│                    routes/*.js                           │
│               (Route Definitions + Validation)           │
├─────────────────────────────────────────────────────────┤
│                  controllers/*.js                        │
│                  (Request Handlers)                      │
├─────────────────────────────────────────────────────────┤
│                    services/*.js                         │
│                   (Business Logic)                      │
├─────────────────────────────────────────────────────────┤
│              config/firebase.js                          │
│            (Firebase Admin SDK / Data Access)            │
└─────────────────────────────────────────────────────────┘
```

### 3.3 Middleware Stack (Applied Order)

1. **Helmet** — Security headers (CSP, HSTS, XSS, clickjacking)
2. **CORS** — Cross-origin configuration
3. **JSON Parser** — `express.json()`
4. **Rate Limiter** — 100 req/15min general, 5 req/15min login
5. **Auth Middleware** — JWT verification, Firestore session check
6. **Account Lock** — Brute-force protection with exponential backoff
7. **Band Middleware** — Wristband ownership verification
8. **Profile Middleware** — Family profile resolution

### 3.4 Firestore Collections — Schema Map

```
Users (1) ──→ MedicalInfo (1:1)
  │
  ├──→ EmergencyContacts (1:Many)
  ├──→ Wristbands (1:Many)
  ├──→ UserProfiles (1:1)
  ├──→ FamilyMembers (1:Many) ──→ MedicalInfo (1:1)
  ├──→ UserSessions (1:Many)
  ├──→ ScanLogs (1:Many)
  └──→ SecurityLogs (1:Many)
```

### 3.5 Security Architecture

| Mechanism | Implementation |
|-----------|---------------|
| **Auth** | JWT + Firestore session validation; 15-day expiry |
| **Brute Force** | 5 failed attempts → 15-min lock with exponential backoff |
| **Rate Limiting** | 4 tiers: login (5/15min), register (3/hr), password reset (3/hr), general (100/15min) |
| **Session Mgmt** | View/revoke sessions across devices; refresh token rotation |
| **Suspicious Detection** | Cross-device/location pattern monitoring |
| **Ownership** | Resource ownership verification on all protected routes |
| **Validation** | express-validator on every endpoint |
| **File Upload** | 5MB max, image-only types, Cloudinary CDN |
| **Audit** | All auth events logged to `SecurityLogs` |

### 3.6 Standardized Response Format

Success:
```json
{
  "success": true,
  "message": "Operation completed",
  "data": { ... },
  "code": 200
}
```

Error:
```json
{
  "success": false,
  "error": "Error description",
  "message": "User-friendly message",
  "code": 400
}
```

---

## 4. System Design

### 4.1 High-Level System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────────────┐  │
│  │ Flutter  │  │   Web    │  │   NFC    │  │  QR Scanner /       │  │
│  │ App      │  │ Browser  │  │  Reader  │  │  Emergency Terminal │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────┬──────────┘  │
└───────┼──────────────┼────────────┼───────────────────┼──────────────┘
        │              │            │                   │
        │        ┌─────┴─────┐      │                   │
        │        │  CORS     │      │                   │
        └────────┤  Gateway  ├──────┘                   │
                 └─────┬─────┘                          │
                       │ HTTPS                           │
┌──────────────────────┼─────────────────────────────────┼──────────────┐
│                      │              SERVER LAYER        │              │
│  ┌───────────────────┴─────────────────────────────────┴──────────┐   │
│  │                    src/index.js                                 │   │
│  │  [Helmet → CORS → JSON → RateLimiter → Router → ErrorHandler]  │   │
│  └───────────────────────────────┬─────────────────────────────────┘   │
│                                  │                                      │
│           ┌──────────────────────┼──────────────────────┐               │
│           ▼                      ▼                      ▼               │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐       │
│  │  Auth Routes     │   │  Medical Routes │   │  Scan Routes    │       │
│  │  + Controllers   │   │  + Controllers  │   │  + Controllers  │       │
│  │  + Services      │   │  + Services     │   │  + Services     │       │
│  └────────┬────────┘   └────────┬────────┘   └────────┬────────┘       │
│           │                     │                     │                 │
│           └──────────┬──────────┘                     │                 │
│                      ▼                                │                 │
│           ┌─────────────────────┐                     │                 │
│           │    Firebase Admin   │                     │                 │
│           │    SDK (config/)    │                     │                 │
│           └──────────┬──────────┘                     │                 │
│                      │                                │                 │
└──────────────────────┼────────────────────────────────┼─────────────────┘
                       │                                │
          ┌────────────┼────────────┐                   │
          ▼            ▼            ▼                   │
┌──────────────────────────────────────────┐            │
│         Firebase / Google Cloud           │            │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐  │            │
│  │ Firestore│ │ Firebase │ │ Cloud   │  │            │
│  │ (NoSQL)  │ │ Auth     │ │ Storage │  │            │
│  └──────────┘ └──────────┘ └─────────┘  │            │
│  ┌──────────────────────────────────────┐│            │
│  │ Cloudinary (Image CDN)               ││            │
│  └──────────────────────────────────────┘│            │
└──────────────────────────────────────────┘            │
                                                       │
┌──────────────────────────────────────────────────────┴──────────────┐
│                         EXTERNAL LAYER                              │
│  ┌───────────────────┐  ┌───────────────────┐  ┌────────────────┐  │
│  │ Google Sign-In    │  │ Apple Sign-In     │  │ First Responder│  │
│  │ OAuth 2.0         │  │ (ASAuthorization) │  │ Public API     │  │
│  └───────────────────┘  └───────────────────┘  └────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.2 Swimlane Diagram: Emergency Scan Flow

```
PATIENT              FIRST RESPONDER          LIFECODE SERVER          FIRESTORE
   │                       │                       │                      │
   │  Wears LifeBand       │                       │                      │
   │◄──────────────────────┤                       │                      │
   │                       │                       │                      │
   │                       │  Scans QR/NFC         │                      │
   │                       ├──────────────────────►│                      │
   │                       │                       │                      │
   │                       │                       │  Query Wristbands    │
   │                       │                       ├─────────────────────►│
   │                       │                       │                      │
   │                       │                       │◄─────────────────────┤
   │                       │                       │  Resolved UserID     │
   │                       │                       │                      │
   │                       │                       │  Query MedicalInfo   │
   │                       │                       ├─────────────────────►│
   │                       │                       │                      │
   │                       │                       │◄─────────────────────┤
   │                       │                       │  Full Medical Data   │
   │                       │                       │                      │
   │                       │  Emergency Data       │  Query EmergencyCt   │
   │                       ├──────────────────────►├─────────────────────►│
   │                       │                       │                      │
   │                       │                       │◄─────────────────────┤
   │                       │                       │  Contacts Retrieved  │
   │                       │                       │                      │
   │                       │  <2s Response         │                      │
   │                       │◄──────────────────────┤                      │
   │                       │                       │                      │
   │                       │  Log Scan Event       │                      │
   │                       ├──────────────────────►│  Write ScanLog       │
   │                       │                       ├─────────────────────►│
   │                       │                       │                      │
```

### 4.3 Swimlane Diagram: User Registration Flow

```
MOBILE APP              LIFECODE SERVER         FIREBASE AUTH          FIRESTORE
    │                        │                       │                     │
    │  POST /register        │                       │                     │
    │  {email,password}      │                       │                     │
    ├───────────────────────►│                       │                     │
    │                        │                       │                     │
    │                        │  Validate input       │                     │
    │                        │                       │                     │
    │                        │  Check existing       │                     │
    │                        ├──────────────────────►│                     │
    │                        │  Query Users          │                     │
    │                        ├───────────────────────────────────────────►│
    │                        │                       │                     │
    │                        │  Hash password        │                     │
    │                        │  (bcryptjs)           │                     │
    │                        │                       │                     │
    │                        │  Create user          │                     │
    │                        ├──────────────────────►│                     │
    │                        │                       │                     │
    │                        │  Create session       │                     │
    │                        ├───────────────────────────────────────────►│
    │                        │  (Write UserSessions)  │                    │
    │                        │                       │                     │
    │                        │  Log security event   │                     │
    │                        ├───────────────────────────────────────────►│
    │                        │                       │                     │
    │  201 {user, tokens}    │                       │                     │
    │◄───────────────────────┤                       │                     │
    │                        │                       │                     │
```

### 4.4 Component Diagram: Service Layer

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVICES LAYER                               │
│                                                                      │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐ │
│  │  authService    │  │  scanService   │  │  profileCompletion    │ │
│  │                 │  │                │  │  Service              │ │
│  │ - register()   │  │ - scanQR()     │  │                        │ │
│  │ - login()      │  │ - scanNFC()    │  │ - calculateCompletion │ │
│  │ - logout()     │  │ - scanByBandID │  │ - 7 section           │ │
│  │ - refresh()    │  │ - getHistory() │  │   calculators          │ │
│  │ - sessions()   │  └────────┬───────┘  └────────────────────────┘ │
│  │ - detectSusp.  │           │                                      │
│  └────────┬───────┘           │                                      │
│           │                   │                                      │
│  ┌────────┴────────┐ ┌───────┴────────┐  ┌────────────────────────┐ │
│  │ socialAuthSvc   │ │ wristbandSvc   │  │ medicalProfileService  │ │
│  │                 │ │                │  │                        │ │
│  │ - google()     │ │ - register()  │  │ - getDashboard()      │ │
│  │ - apple()      │ │ - activate()  │  │ - updatePersonalInfo()│ │
│  │ - link()       │ │ - revoke()    │  │ - updateContact()     │ │
│  │ - unlink()     │ │ - resolveUser │  │ - updateAllergies()   │ │
│  └────────────────┘ │ - getBandID   │  │ - updateMeds()        │ │
│                      │ from User     │  │ - updateSurgeries()   │ │
│  ┌────────────────┐  └───────────────┘  └────────────────────────┘ │
│  │ userAccountSvc │  ┌────────────────┐  ┌────────────────────────┐ │
│  │                │  │ medicalSvc     │  │ userProfileService     │ │
│  │ - changePass() │  │                │  │                        │ │
│  │ - uploadPhoto │  │ - create()     │  │ - getPersonalInfo()   │ │
│  │ - deleteAcc()  │  │ - get()        │  │ - updatePersonalInfo()│ │
│  │ - prefs()      │  │ - update()     │  │ - getEmergencyCont()  │ │
│  └────────────────┘  └────────────────┘  │ - updateEmergencyCont()│ │
│  ┌────────────────┐  ┌────────────────┐  └────────────────────────┘ │
│  │ familyService   │  │ emergContactSvc  │                          │
│  │                 │  │                  │                          │
│  │ - CRUD family  │  │ - CRUD contacts  │                          │
│  │ - cascade del  │  │ - setPrimary()   │                          │
│  └────────────────┘  └──────────────────┘                          │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.5 Data Flow: Profile Completion Engine

```
                    ┌─────────────────────────────────────┐
                    │    profileCompletionService          │
                    │                                     │
                    │  calculateCompletion(userID)         │
                    │          │                           │
                    │          ▼                           │
                    │  ┌──────────────────────┐            │
                    │  │  Personal Info (15%)  │            │
                    │  │  Photo (10%)          │            │
                    │  │  Emergency Cont (15%) │ ← weighted │
                    │  │  Medical Profile(15%) │   scoring  │
                    │  │  Allergies (15%)      │            │
                    │  │  Medications (15%)    │            │
                    │  │  Surgeries (15%)      │            │
                    │  └──────────────────────┘            │
                    │          ▼                           │
                    │  ┌──────────────────────┐            │
                    │  │  Result:             │            │
                    │  │  • completion%       │            │
                    │  │  • completionLevel   │            │
                    │  │  • missingFields[]   │            │
                    │  │  • nextStep          │            │
                    │  └──────────────────────┘            │
                    └─────────────────────────────────────┘
```

Levels: `low` (0-19%) → `partial` (20-49%) → `medium` (50-79%) → `complete` (80-100%)

### 4.6 Database Relationship Diagram

```
┌─────────────────────────┐
│         Users           │
│─────────────────────────│
│ UserID (PK) ✦           │──────┐
│ Username                │      │ 1
│ Email (unique)          │      │
│ PhoneNumber             │      │
│ PhotoURL                │      │
│ PhotoType               │      │
│ Providers[]             │      │
│ PrimaryProvider         │      │
│ IsActive                │      │
│ BandID (FK) ────────────┼──────┤────┐
│ QRCode (nullable)       │      │   │
│ NFCTag (nullable)       │      │   │
│ CreatedAt               │      │   │
│ UpdatedAt               │      │   │
└──────────┬──────────────┘      │   │
           │                     │   │
    1      │                     │   │
           │                     │   │
┌──────────▼──────────────┐      │   │
│      MedicalInfo        │      │   │
│─────────────────────────│      │   │
│ UserID (FK) ✦           │      │   │
│ BloodType               │      │   │
│ Height / Weight         │      │   │
│ PersonalInfo {obj}      │      │   │
│ EmergencyContact {obj}  │      │   │
│ MedicalProfile {obj}    │      │   │
│ HasAllergies / Allergies│      │   │
│ HasMedications / Meds   │      │   │
│ HasSurgeries / Surgeries│      │   │
└─────────────────────────┘      │   │
                                 │   │
┌─────────────────────────┐      │   │
│   EmergencyContacts     │      │   │
│─────────────────────────│      │   │
│ ContactID (PK) ✦        │      │   │
│ UserID (FK) ────────────┼──────┘   │
│ ContactName             │          │
│ PhoneNumbers[]          │          │
│ Relationship            │          │
│ IsPrimary               │          │
│ Notes                   │          │
│ CreatedAt               │          │
└─────────────────────────┘          │
                                     │
┌─────────────────────────┐          │
│       Wristbands        │          │
│─────────────────────────│          │
│ WristbandID (PK) ✦      │          │
│ UserID (FK) ────────────┼──────────┘
│ SerialNumber (SN-...)   │
│ QRCode (unique)         │
│ NFCTag (unique)         │
│ IsActive / IsRevoked    │
│ IsPrimary               │
│ ActivatedAt / RevokedAt │
│ RevokeReason            │
│ CreatedAt / UpdatedAt   │
└─────────────────────────┘

┌─────────────────────────┐
│      UserProfiles       │
│─────────────────────────│
│ UserID (FK) ✦           │────── 1:1 with Users
│ Preferences {
│   pushNotifications,
│   emailNotifications,
│   showMedicalOnScan,
│   showContactsOnScan,
│   showPhotoOnScan
│ }
└─────────────────────────┘

┌─────────────────────────┐
│      FamilyMembers      │
│─────────────────────────│
│ MemberID (PK) ✦         │
│ GuardianUserID (FK) ────┤────── Many per User
│ Name                    │
│ Relation                │
│ DateOfBirth             │
│ IsChild                 │
│ LostChildMode           │
└─────────────────────────┘

┌─────────────────────────┐
│      UserSessions       │
│─────────────────────────│
│ SessionID (PK) ✦        │
│ UserID (FK) ────────────┤────── Many per User
│ SessionToken (hashed)   │
│ RefreshToken (hashed)   │
│ DeviceName / DeviceType │
│ IPAddress               │
│ IsActive                │
│ ExpiresAt               │
│ LastUsed                │
└─────────────────────────┘

┌─────────────────────────┐
│       ScanLogs          │
│─────────────────────────│
│ ScanID (PK) ✦           │
│ UserID (FK) ────────────┤────── Many per User
│ WristbandID             │
│ ScanType (QR/NFC/BAND) │
│ ScannerType             │
│ Location / Lat / Lng    │
│ Timestamp               │
└─────────────────────────┘

┌─────────────────────────┐
│      SecurityLogs       │
│─────────────────────────│
│ LogID (PK) ✦            │
│ UserID (nullable)       │
│ ActionType              │
│ Severity                │
│ IPAddress               │
│ Metadata {obj}          │
│ Timestamp               │
└─────────────────────────┘
```

### 4.7 Boundary / Rate Limiting Design

```
┌──────────────────────────────────────────────────┐
│                  RATE LIMITERS                    │
│                                                   │
│  ┌─────────────┐    ┌─────────────────────────┐   │
│  │   Tier 1    │    │   Tier 2                │   │
│  │  GENERAL    │    │  LOGIN                  │   │
│  │  100/15min  │    │  5/15min per IP+Email   │   │
│  │  All routes │    │  POST /api/app/login    │   │
│  └─────────────┘    └─────────────────────────┘   │
│                                                   │
│  ┌─────────────┐    ┌─────────────────────────┐   │
│  │   Tier 3    │    │   Tier 4                │   │
│  │  REGISTER   │    │  PASSWORD RESET         │   │
│  │  3/hr per IP│    │  3/hr per email         │   │
│  └─────────────┘    └─────────────────────────┘   │
│                                                   │
│  ┌──────────────────────────────────────────┐    │
│  │     ACCOUNT LOCK (Middleware)             │    │
│  │  5 failed → 15-min lock                   │    │
│  │  Exponential backoff (1s→2s→4s→...→30s)   │    │
│  │  10 attempts/15min per email (secondary)   │    │
│  └──────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘
```

### 4.8 API Endpoint Map

```
All routes mounted under: /api/app

AUTH ──────────────────────────────────────────────────────
  POST   /register                        Register (email/password)
  POST   /login                           Login
  POST   /logout                          Logout current session
  POST   /logout-all                      Logout all devices
  POST   /refresh                         Refresh access token
  GET    /sessions                        List active sessions
  DELETE /sessions/:sessionId             Revoke specific session
  POST   /auth/google                     Google Sign-In
  POST   /auth/apple                      Apple Sign-In
  GET    /auth/providers                  Get linked providers
  DELETE /auth/providers/:provider        Unlink provider

PROFILE ───────────────────────────────────────────────────
  GET    /profile/personal-info           Get personal info
  PUT    /profile/personal-info           Update personal info
  GET    /profile/emergency-contacts      Get emergency contacts
  PUT    /profile/emergency-contacts      Update emergency contacts

MEDICAL ───────────────────────────────────────────────────
  POST   /medical                         Create medical info
  GET    /medical                         Get medical info
  PUT    /medical                         Update medical info
  GET    /medical/profile                 Dashboard + completion%
  PUT    /medical/personal-info           Update personal info section
  PUT    /medical/emergency-contact       Update emergency contact section
  PUT    /medical/medical-profile         Update blood type/conditions
  PUT    /medical/allergies               Update allergies (+ flag)
  PUT    /medical/medications             Update medications (+ flag)
  PUT    /medical/surgeries               Update surgeries (+ flag)

EMERGENCY CONTACTS ────────────────────────────────────────
  GET    /emergency/contacts              Get all contacts
  GET    /emergency/contact/:id           Get single contact
  POST   /emergency/contact               Add contact
  POST   /emergency/contacts/bulk         Add multiple contacts
  PUT    /emergency/contact/:id           Update contact
  DELETE /emergency/contact/:id           Delete contact
  PUT    /emergency/contact/:id/primary   Set as primary

USER ACCOUNT ──────────────────────────────────────────────
  POST   /user/password                   Change password
  POST   /user/photo                      Upload profile photo
  GET    /user/photo                      Get own photo
  GET    /user/:userId/photo              Get other user's photo
  DELETE /user/photo                      Delete photo
  DELETE /user/account                    Delete (deactivate) account
  GET    /user/preferences                Get preferences
  PUT    /user/preferences                Update preferences
  GET    /user/complete                   Get complete profile

FAMILY ────────────────────────────────────────────────────
  GET    /family                          List family members
  POST   /family                          Add family member
  PUT    /family/:id                      Update family member
  DELETE /family/:id                      Delete family member

WRISTBAND ─────────────────────────────────────────────────
  POST   /wristband/register              Register wristband (upsert)
  POST   /wristband/activate              Activate wristband
  POST   /wristband/revoke                Revoke wristband
  GET    /wristband/list                  List all wristbands
  GET    /wristband/primary               Get primary wristband
  PUT    /wristband/:id/primary           Set as primary
  GET    /wristband/:id/full              Get band + user info
  POST   /wristband/resolve-user          QR/NFC → UserID
  GET    /wristband/my-band               Get user's band identity
  GET    /wristband/:bandId/info          Get wristband doc

SCAN ──────────────────────────────────────────────────────
  POST   /scan/qr                         Scan QR → emergency info
  POST   /scan/nfc                        Scan NFC → emergency info
  POST   /scan/band                       Scan Band ID → emergency info
  GET    /scan/history                    Get scan history (paginated)

PUBLIC ────────────────────────────────────────────────────
  GET    /public/user/:userID             Web-based emergency profile

SYSTEM ────────────────────────────────────────────────────
  GET    /health                          Health check
  GET    /                                API root documentation
```

### 4.9 Deployment Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     DNS / Load Balancer                        │
│              https://life-code--yossfabdla311.replit.app      │
└─────────────────────┬────────────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────────────┐
│                   Replit / Node.js Server                      │
│──────────────────────────────────────────────────────────────│
│  Process: Node 18+                                            │
│  Port: 3000                                                    │
│  Env: NODE_ENV=production                                      │
│  Monitoring: Replit built-in                                   │
└──────────┬───────────────────────────────────────────────────┘
           │
           ├──────────────────────────────────────┐
           ▼                                      ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│    Firebase / GCP         │    │    Cloudinary             │
│  ┌──────────────────────┐ │    │  ┌──────────────────────┐│
│  │ Firestore (NoSQL DB) │ │    │  │ Image CDN            ││
│  │ Authentication       │ │    │  │ Profile Photos       ││
│  │ Firebase Storage     │ │    │  │ (auto-optimization)  ││
│  │ Security Rules       │ │    │  └──────────────────────┘│
│  └──────────────────────┘ │    └──────────────────────────┘
└──────────────────────────┘
```

---

## 5. API Documentation

### 5.1 Base Information

| Property | Value |
|----------|-------|
| **Base URL** | `https://life-code--yossfabdla311.replit.app/api/app` |
| **Auth Scheme** | Bearer Token (`Authorization: Bearer <token>`) |
| **Content-Type** | `application/json` (except photo upload: `multipart/form-data`) |
| **Encoding** | UTF-8 |
| **Date Format** | ISO 8601 |

### 5.2 Standard Headers

```
Content-Type: application/json
Authorization: Bearer <sessionToken>     (for protected endpoints)
```

### 5.3 Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request — validation error |
| 401 | Unauthorized — missing/invalid token |
| 403 | Forbidden — insufficient permissions |
| 404 | Not Found |
| 409 | Conflict — duplicate email, etc. |
| 429 | Too Many Requests — rate limited |
| 500 | Internal Server Error |

### 5.4 Authentication

#### POST /register

Create a new user account.

**Request:**
```json
{
  "name": "yousseff besso",
  "email": "yousseff@example.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123"
}
```

**Validation:**
| Field | Type | Req | Rules |
|-------|------|-----|-------|
| name | string | Y | 2-50 chars |
| email | string | Y | Valid email |
| password | string | Y | Min 8 chars |
| confirmPassword | string | Y | Must match password |

**Response `201`:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userID": "firebase-uid",
    "username": "yousseff besso",
    "email": "yousseff@example.com",
    "photoURL": null,
    "providers": [{ "provider": "email", "providerId": null, "linkedAt": "..." }],
    "primaryProvider": "email",
    "sessionToken": "jwt...",
    "refreshToken": "jwt...",
    "expiresAt": "2026-08-12T00:00:00.000Z",
    "sessionID": "uuid",
    "suspiciousLogin": false,
    "createdAt": "2026-07-28T00:00:00.000Z"
  }
}
```

#### POST /login

Authenticate with email and password.

**Request:**
```json
{ "email": "yousseff@example.com", "password": "SecurePass123" }
```

**Response `200`:** Same structure as register (user data + tokens).

#### POST /auth/google

```json
{ "idToken": "GOOGLE_ID_TOKEN_FROM_SDK" }
```

Auto-registers if new user, links to existing account if same email, logs in otherwise.  
Response includes `isNewUser` and `accountLinked` boolean flags.

#### POST /auth/apple

```json
{ "idToken": "APPLE_ID_TOKEN", "authorizationCode": "optional_auth_code" }
```

Same auto-handling as Google. Apple private relay emails are supported.

#### POST /refresh

```json
{ "refreshToken": "jwt..." }
```

**Response `200`:**
```json
{
  "success": true,
  "data": { "sessionToken": "new_jwt", "expiresAt": "..." }
}
```

#### POST /logout  |  POST /logout-all

Logout current session or all sessions. Header: `Authorization: Bearer <token>`.  
`logout-all` returns `{ "sessionsRevoked": N }`.

#### GET /sessions  |  DELETE /sessions/:sessionId

List active sessions with device info, IP, last active.  
Delete revokes a specific session. Cannot revoke current session.

#### GET /auth/providers  |  DELETE /auth/providers/:provider

List linked providers (`email`, `google`, `apple`).  
Unlink removes a provider (must keep at least one).

### 5.5 Profile

#### GET /profile/personal-info

Returns user's personal info (name, email, gender, address, photoURL, providers).

#### PUT /profile/personal-info

```json
{ "fullName": "yousseff besso", "gender": "male", "address": "123 Main St" }
```

#### GET /profile/emergency-contacts

Returns array of contacts with `ContactName`, `phoneNumbers[]`, `relationship`, `isPrimary`, `notes`.

#### PUT /profile/emergency-contacts

```json
{
  "contacts": [
    { "ContactName": "Jane besso", "phoneNumbers": ["+201234567890"], "relationship": "Spouse", "isPrimary": true }
  ]
}
```

### 5.6 Medical

#### GET|POST|PUT /medical

Create / read / update full medical document. All fields optional on update.

**POST structure:**
```json
{
  "personalInfo": { "name": "...", "gender": "...", "address": "..." },
  "emergencyContact": { "primary": {...}, "secondary": [...] },
  "medicalProfile": { "bloodType": "A+", "medicalConditions": ["Diabetes"] },
  "allergies": [{ "allergyType": "Peanuts", "severity": "Severe", "notes": "..." }],
  "medications": [{ "medicationName": "Insulin", "dosage": "10 units", "schedule": "Daily", "notes": "..." }],
  "surgeries": [{ "surgeryName": "Appendectomy", "surgeryDate": "2020-01-15", "notes": "..." }]
}
```

**Blood Type values:** `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`  
**Severity values:** `Mild`, `Moderate`, `Severe`

#### GET /medical/profile

Returns full dashboard with `userHeader`, `quickStats`, `sections` (6 sections with completion status), and `profileCompletion` %.

#### Section-by-section updates:

| Endpoint | Body |
|----------|------|
| `PUT /medical/personal-info` | `{ name, gender, address }` |
| `PUT /medical/emergency-contact` | `{ primary: {...}, secondary: [...] }` |
| `PUT /medical/medical-profile` | `{ bloodType, medicalConditions }` |
| `PUT /medical/allergies` | `{ hasAllergies, allergies: [...] }` |
| `PUT /medical/medications` | `{ hasMedications, medications: [...] }` |
| `PUT /medical/surgeries` | `{ hasSurgeries, surgeries: [...] }` |

Each returns `profileCompletion`, `completionLevel`, and `nextRecommendedStep`.

### 5.7 Emergency Contacts (Independent CRUD)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/emergency/contacts` | GET | List all contacts |
| `/emergency/contact/:id` | GET | Get single contact |
| `/emergency/contact` | POST | Add contact (body: `{ContactName, phoneNumbers[], relationship, isPrimary, notes}`) |
| `/emergency/contacts/bulk` | POST | Add up to 10 contacts at once |
| `/emergency/contact/:id` | PUT | Update contact |
| `/emergency/contact/:id` | DELETE | Delete contact |
| `/emergency/contact/:id/primary` | PUT | Set as primary |

**phoneNumbers:** Array of 1-5 strings in E.164 format (10-15 digits).  
**relationship:** `Father`, `Mother`, `Friend`, `Sister`, `Brother`, `Spouse`, `Other`.

### 5.8 User Account

#### POST /user/password

```json
{ "currentPassword": "OldPass123", "newPassword": "NewSecurePass456" }
```

#### POST /user/photo

Multipart form with field `photo` (jpeg/png/webp, max 5MB), or JSON with `photoURL`.

#### GET /user/photo  |  GET /user/:userId/photo

Returns `{ photoURL, photoType }`.

#### DELETE /user/photo | DELETE /user/account

Deletes photo or deactivates account.

#### GET|PUT /user/preferences

```json
{
  "pushNotifications": true,
  "emailNotifications": true,
  "showMedicalOnScan": true,
  "showContactsOnScan": true,
  "showPhotoOnScan": true
}
```

#### GET /user/complete

Returns aggregate view: user + medical + wristbands + emergency contacts.

### 5.9 Family

#### GET /family  |  POST /family

```json
{ "name": "Child Name", "relation": "Son", "dateOfBirth": "2020-01-15", "isChild": true }
```

#### PUT|DELETE /family/:id

Update or delete family member.

### 5.10 Wristband

#### POST /wristband/register

Upsert — registers if not exists, updates if exists:
```json
{ "qrCode": "QR123456", "nfcTag": "NFC-ABC-123" }
```

#### POST /wristband/activate | /wristband/revoke

```json
{ "wristbandId": "wb-id" }
```

Revoke accepts optional `revokeReason`.

#### GET /wristband/list | /wristband/primary

List all bands or get primary band.

#### PUT /wristband/:wristbandId/primary

Set a band as primary (unsets others).

#### POST /wristband/resolve-user

```json
{ "qrCode": "QR123456", "nfcTag": "NFC-ABC-123", "bandId": "SN-2026-00001" }
```
Returns `{ userID }`.

#### GET /wristband/my-band

Returns the band identity linked to the authenticated user's `Users.BandID`.

#### GET /wristband/:bandId/info

Returns wristband document by ID (authenticated).

#### GET /wristband/:wristbandId/full

Returns wristband + user personal info (authenticated).

### 5.11 Scan

#### POST /scan/qr | /scan/nfc | /scan/band

All three are public (no auth required) — designed for first responders.

**QR:**
```json
{ "qrCode": "QR123456" }
```

**NFC:**
```json
{ "nfcTag": "NFC-ABC-123" }
```

**Band ID:**
```json
{ "bandId": "SN-2026-00001" }
```

**All return:**
```json
{
  "success": true,
  "data": {
    "user": { "userID", "username", "photoURL" },
    "medical": { "bloodType", "allergies", "medications", "surgeries", "emergencyInstructions" },
    "emergencyContacts": [...],
    "privacy": { "showMedicalOnScan": true, "showContactsOnScan": true, "showPhotoOnScan": true }
  }
}
```

#### GET /scan/history

Authenticated. Returns paginated scan history (`?page=1&limit=10`).

### 5.12 Public Web Access

#### GET /public/user/:userID

Returns the same response structure as scan — for web-based emergency access (e.g., paramedic opening a browser link).

### 5.13 System

#### GET /health

```json
{ "status": "healthy", "timestamp": "2026-07-28T12:00:00.000Z", "version": "1.0.0" }
```

#### GET /

Returns API root with HTML page listing all available endpoints.

### 5.14 Error Response Examples

**Validation Error `400`:**
```json
{
  "success": false,
  "error": "Validation failed",
  "message": "\"email\" must be a valid email",
  "code": 400
}
```

**Unauthorized `401`:**
```json
{
  "success": false,
  "error": "Authentication failed",
  "message": "Invalid or expired token",
  "code": 401
}
```

**Rate Limited `429`:**
```json
{
  "success": false,
  "error": "Too many requests",
  "message": "Too many login attempts. Please try again after 15 minutes",
  "code": 429,
  "retryAfter": 900
}
```

### 5.15 Postman Collection

Import `LifeCode_API_Collection.postman_collection.json` for complete pre-configured API testing environment.

---

## 6. Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 3000 | Server port |
| `NODE_ENV` | No | development | `development` or `production` |
| `JWT_SECRET` | Yes | — | JWT signing secret (min 32 chars in prod) |
| `CORS_ORIGIN` | No | * | Allowed origins |
| `FIREBASE_PROJECT_ID` | Yes | — | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Yes | — | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | Yes | — | Firebase service account private key |
| `CLOUDINARY_CLOUD_NAME` | Yes | — | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | — | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | — | Cloudinary API secret |

---

## 7. Development

### Commands

```bash
npm run dev       # Development with nodemon (auto-restart)
npm start          # Production
npm test           # Run Jest test suite
```

### Project Structure

```
Life-code/
├── config/                # Firebase Admin SDK init
├── controllers/           # 12 request handlers
├── middleware/             # 5 middleware modules
├── routes/                # 12 route definitions
├── services/              # 11 business logic services
├── src/index.js           # Entry point
├── utils/                 # Utilities
├── assist/                # Documentation & assets
├── API_DOCUMENTATION.md   # Full API reference
└── readme.md              # Project README
```

---

## 8. Compliance Roadmap

| Standard | Market | Status |
|----------|--------|--------|
| HIPAA | United States | Architecture mapped |
| GDPR | European Union | Data deletion pipeline ready |
| HL7 FHIR R4 | Global | Planned v4.0 |

---

## 9. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-07-28 | Initial complete specification |

---

*LifeCode — Scan For Life. Built to save lives.*
