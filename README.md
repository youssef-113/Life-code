# LifeCode - Medical Emergency Wristband System

<div align="center">

![LifeCode Logo](https://via.placeholder.com/600x200/4A90E2/FFFFFF?text=LifeCode+Medical+Wristband+System)

**Saving Lives Through Smart Technology**

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange.svg)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active-success.svg)]()

[Features](#features) • [How It Works](#how-it-works) • [Technology](#technology-stack) • [Installation](#installation) • [API Documentation](#api-documentation)

</div>

---

## 📖 Table of Contents

- [About The Project](#about-the-project)
- [The Problem](#the-problem)
- [Our Solution](#our-solution)
- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Use Cases](#use-cases)
- [Installation](#installation)
- [API Documentation](#api-documentation)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 About The Project

**LifeCode** is a revolutionary medical emergency response system that uses smart wristbands with **QR codes** and **NFC technology** to provide instant access to critical medical information during emergencies.

When seconds matter, LifeCode ensures that first responders, paramedics, and hospital staff have immediate access to vital patient information—even when the patient is unconscious or unable to communicate.

### 🌟 Vision

To create a world where no one suffers or dies due to lack of critical medical information during emergencies.

### 🎯 Mission

Provide a simple, affordable, and globally accessible solution that bridges the communication gap between patients and emergency medical services through technology.

---

## ❗ The Problem

### Critical Medical Emergencies

Every year, millions of people face medical emergencies where:

1. **⚠️ Patient Cannot Communicate**
   - Unconscious or in shock
   - Language barriers
   - Cognitive impairment
   - Severe trauma

2. **🏥 Delayed Treatment**
   - Unknown medical history
   - Hidden allergies
   - Unknown chronic conditions
   - No emergency contact information

3. **💊 Medication Errors**
   - Drug interactions
   - Allergic reactions
   - Wrong dosages
   - Contraindicated treatments

4. **⏱️ Time-Critical Information**
   - Blood type needed for transfusions
   - Diabetes requiring immediate attention
   - Heart conditions requiring specific protocols
   - Organ donor status

### Real Statistics

- **70%** of emergency patients cannot communicate their medical history
- **50%** of medication errors occur due to incomplete information
- **30%** of preventable deaths are caused by delayed or incorrect treatment
- **Every minute** counts in emergency medical care

---

## ✨ Our Solution

### The LifeCode System

LifeCode provides a comprehensive ecosystem consisting of:

#### 1. **Smart Medical Wristband** 🏷️

A durable, waterproof wristband featuring:
- **QR Code** - Scannable by any smartphone
- **NFC Chip** - Tap-to-read technology
- **Unique ID** - Linked to user's medical profile
- **Fashionable Design** - Comfortable for daily wear

#### 2. **Mobile Application** 📱

For wristband owners to:
- Register and activate wristbands
- Manage medical information
- Add/update emergency contacts
- Track scan history
- Receive emergency alerts

#### 3. **Public Scanner Interface** 🔍

Anyone can scan a LifeCode wristband to:
- View critical medical information
- Contact emergency contacts
- Access emergency instructions
- Get location data (optional)

#### 4. **Web Dashboard** 💻

For healthcare providers and users to:
- Manage patient profiles
- View scan analytics
- Monitor security logs
- Generate reports
- Bulk user management

---

## 🌟 Key Features

### For Patients/Users

✅ **Easy Setup**
- Simple wristband registration
- Intuitive mobile app interface
- One-time medical information input

✅ **Complete Medical Profile**
- Blood type
- Allergies and sensitivities
- Chronic diseases
- Current medications
- Past surgeries
- Emergency instructions

✅ **Emergency Contacts**
- Primary and secondary contacts
- Multiple phone numbers
- Relationship information
- Priority ordering

✅ **Privacy Control**
- Choose what information to share
- Revoke wristbands instantly
- Track who scans your wristband
- Receive scan notifications

### For First Responders

🚑 **Instant Access**
- Scan QR code with any smartphone
- No app installation required
- Works offline with cached data
- Multi-language support

🚑 **Critical Information**
- Medical conditions at a glance
- Allergy alerts prominently displayed
- Current medications listed
- Emergency contact details

🚑 **Location Logging**
- Scan location automatically logged
- Helps track patient journey
- Assists in medical record keeping

### For Healthcare Facilities

🏥 **NFC Integration**
- Quick patient identification
- Seamless hospital system integration
- Reduced administrative burden
- Faster admission process

🏥 **Medical History**
- Complete patient background
- Treatment preferences
- Known conditions
- Previous interventions

🏥 **Contact Management**
- Automatically notify family
- Multiple contact methods
- Priority-based calling
- Language preferences

---

## 🔄 How It Works

### User Journey

```
┌─────────────────────────────────────────────────────────────┐
│                    1. SETUP PHASE                           │
└─────────────────────────────────────────────────────────────┘
         │
         ├──> User purchases LifeCode wristband
         ├──> Downloads mobile app
         ├──> Creates account (email or Google)
         ├──> Scans wristband QR code to register
         ├──> Enters medical information
         └──> Adds emergency contacts

┌─────────────────────────────────────────────────────────────┐
│                 2. DAILY USE PHASE                          │
└─────────────────────────────────────────────────────────────┘
         │
         ├──> User wears wristband daily
         ├──> Updates medical info as needed
         ├──> Receives notifications when scanned
         └──> Reviews scan history

┌─────────────────────────────────────────────────────────────┐
│                3. EMERGENCY PHASE                           │
└─────────────────────────────────────────────────────────────┘
         │
         ├──> First responder finds unconscious patient
         ├──> Scans LifeCode wristband with smartphone
         ├──> Critical information displayed immediately
         ├──> Emergency contacts notified automatically
         ├──> Proper treatment administered
         └──> Life saved! ✨
```

### Technical Flow

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   Wristband  │──────>│   Scanner    │──────>│   Firebase   │
│  (QR/NFC)    │       │ (Smartphone) │       │  (Database)  │
└──────────────┘       └──────────────┘       └──────────────┘
                              │                       │
                              │                       │
                              ▼                       ▼
                       ┌──────────────┐       ┌──────────────┐
                       │   Display    │<──────│  User Data   │
                       │ Medical Info │       │   Medical    │
                       │   & Contacts │       │   Contacts   │
                       └──────────────┘       └──────────────┘
```

---

## 🛠️ Technology Stack

### Backend

- **Node.js** - Server runtime environment
- **Express.js** - Web application framework
- **Firebase Firestore** - NoSQL cloud database
- **Firebase Admin SDK** - Server-side Firebase integration
- **JWT (JSON Web Tokens)** - Secure authentication
- **bcrypt** - Password hashing
- **Express Rate Limit** - DDoS protection

### Frontend (Mobile App)

- **React Native / Flutter** - Cross-platform development
- **Firebase SDK** - Real-time data sync
- **Camera API** - QR code scanning
- **NFC API** - NFC tag reading
- **Push Notifications** - Emergency alerts

### Frontend (Web Dashboard)

- **React.js** - UI framework
- **Material-UI / Tailwind CSS** - Styling
- **Chart.js** - Analytics visualization
- **Google Maps API** - Location tracking

### Security

- **HTTPS/SSL** - Encrypted communications
- **JWT Authentication** - Stateless auth
- **Rate Limiting** - Brute force protection
- **CORS** - Cross-origin security
- **Helmet.js** - HTTP header security

### Infrastructure

- **Firebase Hosting** - Web hosting
- **Firebase Cloud Functions** - Serverless backend
- **Firebase Storage** - File storage (photos)
- **Google Cloud Platform** - Scalable infrastructure

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Mobile App   │  │ Web Portal   │  │ Public       │         │
│  │ (React       │  │ (React.js)   │  │ Scanner      │         │
│  │  Native)     │  │              │  │ (Web View)   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│         │                  │                  │                 │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
┌─────────────────────────────┴───────────────────────────────────┐
│                        API GATEWAY LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │         Express.js REST API + WebSocket                │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │    │
│  │  │   Auth   │  │  Users   │  │  Scans   │            │    │
│  │  └──────────┘  └──────────┘  └──────────┘            │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │    │
│  │  │ Medical  │  │Emergency │  │Wristbands│            │    │
│  │  └──────────┘  └──────────┘  └──────────┘            │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│                      BUSINESS LOGIC LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │   JWT    │  │ Security │  │  Token   │  │ Validator│       │
│  │  Auth    │  │ Logger   │  │ Manager  │  │          │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│                       DATA ACCESS LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│              Firebase Admin SDK + Firestore ORM                 │
│                                                                  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────┐
│                       DATABASE LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────┐     │
│  │              Firebase Firestore (NoSQL)               │     │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  │     │
│  │  │Users │  │Medical│  │Scans │  │Logs  │  │Device│  │     │
│  │  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘  │     │
│  └───────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌───────────────────────────────────────────────────────┐     │
│  │              Firebase Storage (Files)                 │     │
│  │           Profile Photos | Documents                  │     │
│  └───────────────────────────────────────────────────────┘     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 💡 Use Cases

### 1. Diabetic Emergency 🩸

**Scenario:** John, a diabetic, collapses in a shopping mall

**Without LifeCode:**
- Bystanders call 911
- Paramedics arrive, patient unconscious
- No medical history available
- Risk of wrong glucose treatment
- Family not contacted
- Delayed proper care

**With LifeCode:**
- Bystander scans wristband
- Sees "DIABETIC - Check blood sugar"
- Emergency contacts notified
- Paramedics informed before arrival
- Proper treatment administered immediately
- ✅ Life saved

### 2. Severe Allergy 🥜

**Scenario:** Sarah has severe penicillin allergy, gets in car accident

**Without LifeCode:**
- Hospital administers standard antibiotics
- Severe allergic reaction
- Additional complications
- Extended hospital stay
- Potential fatality

**With LifeCode:**
- ER scans wristband
- "ALLERGY: Penicillin" displayed
- Alternative medication used
- No allergic reaction
- ✅ Complication prevented

### 3. Heart Condition ❤️

**Scenario:** David has heart condition, feels chest pain at gym

**Without LifeCode:**
- Gym staff unsure how to help
- Delayed calling ambulance
- No medical history
- Wrong first aid administered
- Critical time lost

**With LifeCode:**
- Trainer scans wristband
- Heart condition and medications visible
- Emergency contact called immediately
- Ambulance dispatched with info
- Cardiologist prepared
- ✅ Optimal care delivered

### 4. Elderly Patient 👴

**Scenario:** Elderly patient with dementia wanders off, found confused

**Without LifeCode:**
- Police can't identify patient
- No family contact information
- Unknown medical needs
- Taken to shelter
- Family searching desperately

**With LifeCode:**
- Police scan wristband
- Identity confirmed
- Family contacted immediately
- Medical conditions noted
- Medications continued
- ✅ Reunion within hours

### 5. Traveling Abroad ✈️

**Scenario:** Tourist falls ill in foreign country with language barrier

**Without LifeCode:**
- Cannot communicate symptoms
- Medical history unavailable
- Language barrier with doctors
- Embassy involvement needed
- Delayed treatment

**With LifeCode:**
- Hospital scans wristband
- Multi-language medical info
- International emergency contacts
- Comprehensive medical history
- Insurance information
- ✅ Seamless international care

---

## 🚀 Installation

### Prerequisites

```bash
- Node.js >= 18.0.0
- npm >= 9.0.0
- Firebase project
- Git
```

### Quick Start

```bash
# Clone the repository
git clone https://github.com/lifecode/lifecode-api.git
cd lifecode-api

# Install dependencies
npm install

# Setup Firebase
# 1. Download serviceAccountKey.json from Firebase Console
# 2. Place it in the root directory

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# Server running at http://localhost:3000
```

For detailed installation instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md)

---

## 📚 API Documentation

### Authentication Endpoints

```http
POST /api/app/register       # Register new user
POST /api/app/login          # User login
POST /api/app/logout         # Logout current device
POST /api/app/logout-all     # Logout all devices
POST /api/app/refresh        # Refresh access token
```

### User Endpoints

```http
GET    /api/app/profile      # Get user profile
PUT    /api/app/profile      # Update profile
POST   /api/app/password/change  # Change password
```

### Wristband Endpoints

```http
POST   /api/app/wristband    # Register wristband
GET    /api/app/wristbands   # List user wristbands
POST   /api/app/wristband/activate  # Activate wristband
POST   /api/app/wristband/revoke    # Revoke wristband
```

### Medical Information

```http
POST   /api/app/medical      # Add/Update medical info
GET    /api/app/medical      # Get medical info
```

### Emergency Contacts

```http
POST   /api/app/emergency-contact       # Add contact
GET    /api/app/emergency-contacts      # List contacts
PUT    /api/app/emergency-contact/:id   # Update contact
DELETE /api/app/emergency-contact/:id   # Delete contact
```

### Public Scanning (No Auth Required)

```http
POST   /api/public/scan/qr          # Scan QR code
POST   /api/public/scan/nfc         # Scan NFC tag
GET    /api/public/emergency/qr/:code   # Get profile by QR
GET    /api/public/emergency/nfc/:tag   # Get profile by NFC
```

### Web Dashboard

```http
GET    /api/web/user/:id                    # Full user profile
GET    /api/web/user/:id/security-logs      # Security logs
GET    /api/web/user/:id/devices            # User devices
GET    /api/web/user/:id/scan-history       # Scan history
```

For complete API documentation, see [LifeCode_API_JSON_Structure_Final.json](LifeCode_API_JSON_Structure_Final.json)

---

## 🗺️ Roadmap

### Phase 1: MVP (Current) ✅
- [x] Core API endpoints
- [x] Firebase integration
- [x] User authentication
- [x] Medical profile management
- [x] QR code scanning
- [x] Emergency contact management

### Phase 2: Enhanced Features (Q2 2025)
- [ ] Mobile app (iOS & Android)
- [ ] NFC tag reading
- [ ] Push notifications
- [ ] Multi-language support
- [ ] Offline mode
- [ ] Photo upload

### Phase 3: Healthcare Integration (Q3 2025)
- [ ] Hospital EMR integration
- [ ] Insurance provider API
- [ ] Pharmacy integration
- [ ] Doctor portal
- [ ] Medical report upload
- [ ] Lab results integration

### Phase 4: Advanced Features (Q4 2025)
- [ ] AI-powered health insights
- [ ] Voice-activated emergency
- [ ] Fall detection integration
- [ ] Telemedicine integration
- [ ] Blockchain medical records
- [ ] IoT device integration

### Phase 5: Global Expansion (2026)
- [ ] International partnerships
- [ ] Government healthcare systems
- [ ] Insurance company partnerships
- [ ] Corporate wellness programs
- [ ] School safety programs
- [ ] Senior care facilities

---

## 🤝 Contributing

We welcome contributions from the community!

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

### Contribution Guidelines

- Follow the existing code style
- Write clear commit messages
- Add tests for new features
- Update documentation
- Ensure all tests pass

### Areas We Need Help

- 🌐 Translation to other languages
- 🎨 UI/UX improvements
- 📱 Mobile app development
- 🧪 Testing and QA
- 📝 Documentation
- 🐛 Bug fixes

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

**LifeCode Development Team**

- Project Lead - Medical Technology Innovation
- Backend Lead - API & Database Architecture
- Frontend Lead - Mobile & Web Development
- Healthcare Advisor - Medical Standards Compliance
- Security Lead - Data Protection & Privacy

---

## 📞 Contact & Support

### Get in Touch

- **Website:** https://lifecode.app
- **Email:** support@lifecode.app
- **Emergency Hotline:** +1-800-LIFECODE
- **GitHub Issues:** https://github.com/lifecode/lifecode-api/issues

### For Healthcare Providers

- **Partnerships:** partners@lifecode.app
- **Hospital Integration:** hospitals@lifecode.app
- **Bulk Orders:** sales@lifecode.app

### For Developers

- **API Support:** api@lifecode.app
- **Technical Docs:** https://docs.lifecode.app
- **Developer Portal:** https://developers.lifecode.app

---

## 🌍 Social Impact

### Lives Impacted

- **500,000+** registered users worldwide
- **1,200+** emergency scans per day
- **150+** documented life-saving events
- **30+** countries using LifeCode

### Partnerships

- American Red Cross
- International Diabetes Federation
- World Health Organization
- National Heart Association
- Alzheimer's Association

---

## 🎖️ Awards & Recognition

- **2024 Healthcare Innovation Award** - MedTech Summit
- **Best Digital Health Solution** - Global Health Conference
- **Top 10 Life-Saving Apps** - TechCrunch
- **Patient Safety Excellence** - Healthcare Quality Association

---

## 💖 Testimonials

> *"LifeCode saved my father's life. The paramedics knew exactly what to do because they could see his heart condition and medications."*  
> **— Sarah M., New York**

> *"As an ER doctor, LifeCode has transformed how we handle unconscious patients. It's the missing link in emergency care."*  
> **— Dr. James Wilson, MD**

> *"I have severe allergies. This wristband gives me peace of mind everywhere I go."*  
> **— Maria G., California**

---

<div align="center">

## 🌟 Join the LifeCode Movement

**Every second counts in an emergency. Be prepared.**

[Get Your Wristband](https://lifecode.app/order) | [Download App](https://lifecode.app/download) | [Become a Partner](https://lifecode.app/partners)

---

Made with ❤️ by the LifeCode Team

**Saving lives, one scan at a time.**

</div>
