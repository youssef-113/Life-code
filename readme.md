<div align="center">

<img src="https://img.shields.io/badge/LifeCode-Scan%20For%20Life-1a56db?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0zIDNoNnYySDN6TTMgN2g0djJIM3pNMyAxMWg2djJIM3pNMyAxNWg0djJIM3pNMyAxOWg2djJIM3pNMTUgM2g2djJoLTZ6TTE1IDdoNHYyaC00ek0xNSAxMWg2djJoLTZ6TTE1IDE1aDR2MmgtNHpNMTUgMTloNnYyaC02ek05IDVoNnY2SDl6TTkgMTNoNnY2SDl6Ii8+PC9zdmc+" />

# 🏥 LifeCode — Backend, AI & Integration

### *Your Vital Information, Always Within Reach.*

[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-life--code--yossfabdla311.replit.app-00b4d8?style=flat-square)](https://life-code--yossfabdla311.replit.app)
[![GitHub](https://img.shields.io/badge/GitHub-youssef--113%2FLife--code-181717?style=flat-square&logo=github)](https://github.com/youssef-113/Life-code)
[![Backend](https://img.shields.io/badge/Role-Backend%20%7C%20AI%20%7C%20DB%20%7C%20Web-1a56db?style=flat-square)]()
[![Status](https://img.shields.io/badge/Status-Active%20Development-22c55e?style=flat-square)]()

---

> **LifeCode** is a digital health identification ecosystem that bridges physical wearables (the LifeBand — NFC + QR) with a cloud-powered backend, ensuring first responders can access critical patient data instantly — even when the patient cannot speak.

---

</div>

## 📋 Table of Contents

- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [API & Database Design](#-api--database-design)
- [AI Features](#-ai-features)
- [Security Model](#-security-model)
- [Data Flow](#-data-flow)
- [Future Integrations](#-future-integrations)
- [Environment Setup](#-environment-setup)
- [Team](#-team)

---

## 🏗 System Architecture

LifeCode operates on a **distributed, zero-latency architecture** composed of three nodes:

```
┌─────────────────────────────────────────────────────────┐
│                    LIFECODE ECOSYSTEM                   │
│                                                         │
│  [LifeBand]  ──scan──▶  [Client Apps]  ──API──▶[Cloud] │
│  NFC / QR               Flutter Mobile        Firebase  │
│  (Passive HW)           Flutter Web           Firestore │
│                                               Auth      │
└─────────────────────────────────────────────────────────┘
```

The LifeBand stores **no raw medical data** — only a cryptographically signed Unique Identifier (UID) and a dynamic URL. All sensitive health data lives encrypted in the cloud.

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **API** | Express.js REST API | Efficient medical data querying |
| **Database** | Firebase Firestore (NoSQL) | Flexible medical record document storage with real-time sync |
| **Auth** | Firebase Auth + JWT | Secure authentication with Google/Apple sign-in support |
| **Frontend** | Flutter Web / React.js | Responsive hospital & admin portal |
| **Security** | Helmet + Rate Limiting | DDoS protection, XSS prevention, CORS policies |
| **Encryption (Transit)** | TLS 1.3 / HTTPS | All API traffic |
| **Encryption (Rest)** | Firebase Security Rules | Database-level access control |
| **Hosting** | Replit (MVP) | Live deployment |
| **AI / OCR** | Python + NLP pipeline | Document parsing & medical term normalization |

---

## 🗄 API & Database Design

### Core API Architecture

```
/api/app
    │
    ├── /register           → User registration (email, Google, Apple)
    │       ├── POST   /register
    │       ├── POST   /register/google
    │       └── POST   /register/apple
    │
    ├── /login              → Authentication & session management
    │       ├── POST   /login
    │       ├── POST   /logout
    │       ├── POST   /logout-all
    │       ├── POST   /refresh
    │       └── GET    /sessions
    │
    ├── /profile            → User profile management
    │       ├── GET    /profile/personal-info
    │       └── PUT    /profile/personal-info
    │
    ├── /medical            → Medical information CRUD
    │       ├── POST   /medical
    │       ├── GET    /medical
    │       └── PUT    /medical
    │
    ├── /medical/profile    → Detailed medical profile
    │       ├── GET    /medical/profile
    │       ├── PUT    /medical/general-info
    │       ├── PUT    /medical/conditions
    │       ├── PUT    /medical/allergies
    │       ├── PUT    /medical/medications
    │       ├── PUT    /medical/surgeries
    │       └── PUT    /medical/emergency-instructions
    │
    ├── /emergency/contact  → Emergency contacts management
    │       ├── POST   /emergency/contact
    │       ├── GET    /emergency/contacts
    │       ├── PUT    /emergency/contact/:id
    │       ├── DELETE /emergency/contact/:id
    │       └── PUT    /emergency/contact/:id/primary
    │
    ├── /wristband          → LifeBand pairing & management
    │       ├── POST   /wristband/register
    │       ├── POST   /wristband/activate
    │       ├── POST   /wristband/revoke
    │       └── GET    /wristband/list
    │
    ├── /scan               → QR/NFC scanning (public access)
    │       ├── POST   /scan/qr
    │       ├── POST   /scan/nfc
    │       └── GET    /scan/history
    │
    ├── /user               → Account management
    │       ├── POST   /user/password
    │       ├── POST   /user/photo
    │       ├── DELETE /user/account
    │       ├── GET    /user/preferences
    │       ├── PUT    /user/preferences
    │       └── GET    /user/complete
    │
    └── /family             → Family/dependent management
            ├── GET    /family
            ├── POST   /family
            ├── PUT    /family/:id
            └── DELETE /family/:id
```

### Firebase Firestore Collections

#### `users` Collection
```json
{
  "userID": "auto-generated-uid",
  "email": "user@example.com",
  "displayName": "yousseff besso",
  "phoneNumber": "+20xxxxxxxxxx",
  "photoURL": "https://...",
  "authProvider": "email | google | apple",
  "emailVerified": false,
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "preferences": {
    "language": "en",
    "notifications": true,
    "emergencyAlerts": true
  }
}
```

#### `medical_profiles` Collection
```json
{
  "profileID": "auto-generated-id",
  "userID": "reference-to-users",
  "generalInfo": {
    "bloodType": "A+",
    "organDonor": false,
    "height": "180cm",
    "weight": "75kg"
  },
  "conditions": ["Type 2 Diabetes", "Hypertension"],
  "allergies": ["Penicillin", "Peanuts"],
  "medications": [
    { "name": "Metformin", "dosage": "500mg", "frequency": "daily" }
  ],
  "surgeries": [
    { "procedure": "Appendectomy", "year": "2019", "hospital": "City Hospital" }
  ],
  "emergencyInstructions": "Insulin dependent diabetic",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### `emergency_contacts` Collection
```json
{
  "contactID": "auto-generated-id",
  "userID": "reference-to-users",
  "name": "Jane besso",
  "phone": "+20xxxxxxxxxx",
  "relation": "Spouse",
  "isPrimary": true,
  "createdAt": "timestamp"
}
```

#### `wristbands` Collection
```json
{
  "wristbandID": "unique-band-uid",
  "userID": "reference-to-users",
  "activationCode": "hashed-code",
  "status": "active | revoked | pending",
  "registeredAt": "timestamp",
  "activatedAt": "timestamp",
  "revokedAt": "timestamp | null"
}
```

#### `family_members` Collection
```json
{
  "memberID": "auto-generated-id",
  "guardianUserID": "reference-to-users",
  "relationship": "child | parent | spouse | other",
  "profileData": {
    "name": "Child Name",
    "dateOfBirth": "2015-05-15",
    "medicalProfileID": "reference-to-medical_profiles"
  },
  "createdAt": "timestamp"
}
```

---

## 🤖 AI Features

### 1. Smart OCR — Medical Document Digitization

Users photograph physical medical documents (prescriptions, lab results). The AI pipeline automatically extracts and structures the data into their LifeCode profile.

```
[Photo Upload]
      │
      ▼
[Image Preprocessing]  ← Contrast enhance, deskew, denoise
      │
      ▼
[OCR Engine]           ← Tesseract / Cloud Vision API
      │
      ▼
[NLP Parser]           ← Extract: drug names, dosages, diagnoses, dates
      │
      ▼
[Profile Updater]      ← Writes structured data to MongoDB document
```

### 2. Predictive Medical Term Normalization (NLP)

Free-text medical terms entered by users are automatically mapped to standardized ICD-10 codes for universal medical compatibility.

| User Input | Normalized Output |
|---|---|
| `"high blood pressure"` | `Hypertension (ICD-10: I10)` |
| `"sugar disease"` | `Type 2 Diabetes Mellitus (ICD-10: E11)` |
| `"chest pain"` | `Angina Pectoris (ICD-10: I20)` |
| `"penicillin allergy"` | `Allergy to penicillin (ICD-10: Z88.0)` |

**NLP Stack:** Python · spaCy / Transformers · Medical NER models · ICD-10 lookup dictionary

---

## 🔐 Security Model

LifeCode uses a **zero-trust security architecture** — every layer is independently verified.

```
┌──────────────────────────────────────────────────────────┐
│                   ZERO-TRUST LAYERS                      │
│                                                          │
│  Layer 1: Hardware        NFC read-only lock (tamper)    │
│  Layer 2: Transport       TLS 1.3 on all API endpoints   │
│  Layer 3: Auth            JWT + biometric (FaceID/Touch) │
│  Layer 4: Data Access     Granular field-level permissions│
│  Layer 5: Storage         AES-256 encrypted at rest      │
│  Layer 6: Gateway         Rate limiting + DDoS protection│
└──────────────────────────────────────────────────────────┘
```

### Data Privacy Model

| Data Type | Access Level | Protection |
|---|---|---|
| Blood type, Allergies | Public on scan | Encrypted at rest |
| Emergency contacts | Public on scan | Encrypted at rest |
| Medications, History | PIN-gated | AES-256 + PIN required |
| Identity / PII | Private | Obfuscated — not readable even in breach |

### Penetration Testing Scope

Continuous red-team testing covers:
- NFC chip cloning & UID spoofing
- QR code hijacking / URL substitution
- Man-in-the-Middle (MitM) attacks on the API
- SQL / NoSQL injection vulnerabilities
- Automated UID scraping via brute force

---

## 🔄 Data Flow

```
┌─────────┐    NFC tap /     ┌──────────┐   HTTPS    ┌─────────────┐
│LifeBand │───QR scan──────▶│ Scanner  │ ──────────▶│ API Gateway │
│(passive)│                  │(any phone)│           │  (Express)  │
└─────────┘                  └──────────┘            └──────┬──────┘
                                                           │
                                              ┌────────────▼──────────┐
                                              │  Auth: Verify JWT     │
                                              │  (Firebase Auth)      │
                                              └────────────┬──────────┘
                                                           │
                              ┌────────────────────────────▼─────────┐
                              │          Public scan?                │
                              │   YES → Firestore → return payload   │
                              │   NO  → Request PIN → Firestore      │
                              └──────────────────────────────────────┘
```

---

## 🔮 Future Integrations

### EHR Interoperability (HL7 FHIR)

Planned backend support for the **HL7 FHIR** (Fast Healthcare Interoperability Resources) standard — enabling LifeCode patient data to be pushed directly into hospital systems like **Epic** and **Cerner** on patient arrival, eliminating manual intake forms.

### Compliance Roadmap

| Standard | Market | Status |
|---|---|---|
| **HIPAA** | United States | Architecture mapped |
| **GDPR** | European Union | Data deletion pipeline designed |
| **HL7 FHIR R4** | Global EHR systems | Planned v4.0 |

---

## ⚙️ Environment Setup

```bash
# Clone the repository
git clone https://github.com/youssef-113/Life-code.git
cd Life-code

# Install dependencies
npm install

# Environment variables
cp .env.example .env
# Configure Firebase credentials in .env or use firebase-service-account.json

# Run development server
npm run dev
```



---

<div align="center">

**LifeCode** · Scan For Life · FEB/2026

[![Live](https://img.shields.io/badge/🌐%20Visit%20Live%20App-00b4d8?style=for-the-badge)](https://life-code--yossfabdla311.replit.app)

*Built with me and team life-code to save lives.*

</div>