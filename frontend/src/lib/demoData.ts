import type {
  Allergy,
  EmergencyContact,
  FamilyProfile,
  Medication,
  PersonalInfo,
  Surgery,
  UserPreferences,
  Wristband,
  ScanHistoryEntry,
  BloodType,
  MedicalProfileCore,
} from '@/types'

export interface DemoAccount {
  userID: string
  email: string
  password: string
  username: string
  photoURL: string | null
  gender: PersonalInfo['gender']
  tagline: string
  personalInfo: PersonalInfo
  medicalProfile: MedicalProfileCore
  hasAllergies: boolean
  allergies: Allergy[]
  hasMedications: boolean
  medications: Medication[]
  hasSurgeries: boolean
  surgeries: Surgery[]
  emergencyInstructions: string
  emergencyContacts: EmergencyContact[]
  family: FamilyProfile[]
  wristbands: Wristband[]
  scanHistory: ScanHistoryEntry[]
  preferences: UserPreferences
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    userID: 'demo-youssef',
    email: 'youssef@demo.lifecode.app',
    password: 'DemoPass123',
    username: 'Youssef Besso',
    photoURL: null,
    gender: 'male',
    tagline: 'Complete profile · Type 1 diabetic · Primary wristband active',
    personalInfo: {
      name: 'Youssef Besso',
      gender: 'male',
      address: '14 El Nasr St, Giza, Egypt',
    },
    medicalProfile: {
      bloodType: 'A+' as BloodType,
      medicalConditions: ['Type 1 Diabetes', 'Hypertension'],
    },
    hasAllergies: true,
    allergies: [
      { allergyType: 'Penicillin', severity: 'Severe', notes: 'Anaphylaxis risk — avoid all beta-lactams' },
      { allergyType: 'Peanuts', severity: 'Moderate', notes: 'Causes hives and swelling' },
    ],
    hasMedications: true,
    medications: [
      { medicationName: 'Insulin (Lantus)', dosage: '18 units', schedule: 'Nightly at 9 PM', notes: 'Store refrigerated' },
      { medicationName: 'Metformin', dosage: '500mg', schedule: 'Twice daily with meals', notes: '' },
    ],
    hasSurgeries: true,
    surgeries: [
      { surgeryName: 'Appendectomy', surgeryDate: '2018-03-11', notes: 'No complications' },
    ],
    emergencyInstructions:
      'Check blood glucose immediately if unconscious. Glucagon pen in bag side pocket. Do NOT administer penicillin-based antibiotics.',
    emergencyContacts: [
      {
        id: 'ec-y-1',
        ContactName: 'Mona Besso',
        phoneNumbers: ['+201001234567', '+201009876543'],
        relationship: 'Spouse',
        isPrimary: true,
        notes: 'Primary contact — available 24/7',
        CreatedAt: '2026-01-12T09:00:00.000Z',
      },
      {
        id: 'ec-y-2',
        ContactName: 'Karim Besso',
        phoneNumbers: ['+201112223344'],
        relationship: 'Brother',
        isPrimary: false,
        notes: 'Lives nearby, has spare key',
        CreatedAt: '2026-01-14T09:00:00.000Z',
      },
    ],
    family: [
      {
        id: 'fam-y-self',
        ProfileType: 'Main',
        Name: 'Youssef Besso',
        Relation: 'Self',
        Age: 32,
        BloodType: 'A+',
        QRCode: 'QR-YOUSSEF-0001',
        IsChild: false,
        LostChildMode: false,
      },
    ],
    wristbands: [
      {
        id: 'wb-y-1',
        SerialNumber: 'SN-2026-00001',
        QRCode: 'QR-YOUSSEF-0001',
        NFCTag: 'NFC-YB-0001',
        Status: 'active',
        IsActive: true,
        IsPrimary: true,
        ActivatedAt: '2026-01-15T10:30:00.000Z',
      },
    ],
    scanHistory: [
      { id: 'sc-y-1', QRCode: 'QR-YOUSSEF-0001', ScannerType: 'emergency', Location: 'Cairo, Egypt', ScannedAt: '2026-06-02T08:14:00.000Z' },
      { id: 'sc-y-2', QRCode: 'QR-YOUSSEF-0001', ScannerType: 'hospital', Location: 'Nile Badrawi Hospital, Cairo', ScannedAt: '2026-04-20T18:42:00.000Z' },
      { id: 'sc-y-3', QRCode: 'QR-YOUSSEF-0001', ScannerType: 'personal', Location: 'Giza, Egypt', ScannedAt: '2026-02-01T11:05:00.000Z' },
    ],
    preferences: {
      pushNotifications: true,
      emailNotifications: true,
      showMedicalOnScan: true,
      showContactsOnScan: true,
      showPhotoOnScan: true,
    },
  },
  {
    userID: 'demo-sara',
    email: 'sara@demo.lifecode.app',
    password: 'DemoPass123',
    username: 'Sara Ahmed',
    photoURL: null,
    gender: 'female',
    tagline: 'Partial profile · Severe allergy · Onboarding in progress',
    personalInfo: {
      name: 'Sara Ahmed',
      gender: 'female',
      address: null,
    },
    medicalProfile: {
      bloodType: 'O-',
      medicalConditions: ['Asthma'],
    },
    hasAllergies: true,
    allergies: [
      { allergyType: 'Shellfish', severity: 'Severe', notes: 'Carries EpiPen at all times' },
    ],
    hasMedications: false,
    medications: [],
    hasSurgeries: false,
    surgeries: [],
    emergencyInstructions: 'Carries a rescue inhaler in her bag. EpiPen for shellfish exposure.',
    emergencyContacts: [
      {
        id: 'ec-s-1',
        ContactName: 'Hana Ahmed',
        phoneNumbers: ['+201223344556'],
        relationship: 'Mother',
        isPrimary: true,
        notes: '',
        CreatedAt: '2026-05-02T09:00:00.000Z',
      },
    ],
    family: [
      {
        id: 'fam-s-self',
        ProfileType: 'Main',
        Name: 'Sara Ahmed',
        Relation: 'Self',
        Age: 24,
        BloodType: 'O-',
        QRCode: 'QR-SARA-0002',
        IsChild: false,
        LostChildMode: false,
      },
    ],
    wristbands: [
      {
        id: 'wb-s-1',
        SerialNumber: 'SN-2026-00047',
        QRCode: 'QR-SARA-0002',
        NFCTag: 'NFC-SA-0047',
        Status: 'pending',
        IsActive: false,
        IsPrimary: true,
        ActivatedAt: null,
      },
    ],
    scanHistory: [],
    preferences: {
      pushNotifications: true,
      emailNotifications: false,
      showMedicalOnScan: true,
      showContactsOnScan: true,
      showPhotoOnScan: false,
    },
  },
  {
    userID: 'demo-omar',
    email: 'omar@demo.lifecode.app',
    password: 'DemoPass123',
    username: 'Omar Hassan',
    photoURL: null,
    gender: 'male',
    tagline: 'Family account · Cardiac history · Lost Child Mode demo',
    personalInfo: {
      name: 'Omar Hassan',
      gender: 'male',
      address: '9 Corniche El Nil, Maadi, Cairo, Egypt',
    },
    medicalProfile: {
      bloodType: 'B+',
      medicalConditions: ['Coronary Artery Disease', 'Atrial Fibrillation', 'Type 2 Diabetes'],
    },
    hasAllergies: true,
    allergies: [
      { allergyType: 'Aspirin', severity: 'Moderate', notes: 'Causes GI bleeding risk' },
      { allergyType: 'Iodine contrast dye', severity: 'Severe', notes: 'Pre-medicate before imaging' },
    ],
    hasMedications: true,
    medications: [
      { medicationName: 'Warfarin', dosage: '5mg', schedule: 'Daily at 6 PM', notes: 'INR checked monthly' },
      { medicationName: 'Metoprolol', dosage: '50mg', schedule: 'Twice daily', notes: '' },
      { medicationName: 'Metformin', dosage: '1000mg', schedule: 'Twice daily with meals', notes: '' },
    ],
    hasSurgeries: true,
    surgeries: [
      { surgeryName: 'Coronary Artery Bypass Graft (CABG)', surgeryDate: '2021-09-04', notes: 'Triple bypass, recovered well' },
      { surgeryName: 'Pacemaker Implant', surgeryDate: '2023-11-19', notes: 'Dual-chamber pacemaker' },
    ],
    emergencyInstructions:
      'On anticoagulants (Warfarin) — any bleeding is a priority. Pacemaker in place; avoid direct chest compression over device if possible.',
    emergencyContacts: [
      {
        id: 'ec-o-1',
        ContactName: 'Layla Hassan',
        phoneNumbers: ['+201556677889', '+201598765432'],
        relationship: 'Spouse',
        isPrimary: true,
        notes: 'Primary decision maker',
        CreatedAt: '2025-11-01T09:00:00.000Z',
      },
      {
        id: 'ec-o-2',
        ContactName: 'Dr. Amir Fahmy',
        phoneNumbers: ['+201234455667'],
        relationship: 'Other',
        isPrimary: false,
        notes: 'Cardiologist — Nile Badrawi Hospital',
        CreatedAt: '2025-11-01T09:05:00.000Z',
      },
    ],
    family: [
      {
        id: 'fam-o-self',
        ProfileType: 'Main',
        Name: 'Omar Hassan',
        Relation: 'Self',
        Age: 61,
        BloodType: 'B+',
        QRCode: 'QR-OMAR-0003',
        IsChild: false,
        LostChildMode: false,
      },
      {
        id: 'fam-o-dep1',
        ProfileType: 'Dependent',
        Name: 'Yara Hassan',
        Relation: 'Daughter',
        Age: 6,
        BloodType: 'B+',
        QRCode: 'QR-YARA-0004',
        IsChild: true,
        LostChildMode: true,
      },
      {
        id: 'fam-o-dep2',
        ProfileType: 'Dependent',
        Name: 'Fatma Hassan (mother)',
        Relation: 'Parent',
        Age: 85,
        BloodType: 'O+',
        QRCode: 'QR-FATMA-0005',
        IsChild: false,
        LostChildMode: false,
      },
    ],
    wristbands: [
      {
        id: 'wb-o-1',
        SerialNumber: 'SN-2026-00012',
        QRCode: 'QR-OMAR-0003',
        NFCTag: 'NFC-OH-0012',
        Status: 'active',
        IsActive: true,
        IsPrimary: true,
        ActivatedAt: '2025-11-05T09:00:00.000Z',
      },
      {
        id: 'wb-o-2',
        SerialNumber: 'SN-2025-00998',
        QRCode: 'QR-OMAR-OLD',
        NFCTag: 'NFC-OH-OLD',
        Status: 'revoked',
        IsActive: false,
        IsPrimary: false,
        ActivatedAt: '2024-02-01T09:00:00.000Z',
      },
    ],
    scanHistory: [
      { id: 'sc-o-1', QRCode: 'QR-OMAR-0003', ScannerType: 'emergency', Location: 'Maadi, Cairo, Egypt', ScannedAt: '2026-07-18T21:03:00.000Z' },
      { id: 'sc-o-2', QRCode: 'QR-OMAR-0003', ScannerType: 'hospital', Location: 'Nile Badrawi Hospital, Cairo', ScannedAt: '2026-07-18T21:20:00.000Z' },
      { id: 'sc-o-3', QRCode: 'QR-OMAR-0003', ScannerType: 'hospital', Location: 'Nile Badrawi Hospital, Cairo', ScannedAt: '2026-05-30T13:00:00.000Z' },
      { id: 'sc-o-4', QRCode: 'QR-OMAR-0003', ScannerType: 'public', Location: 'Maadi Corniche, Cairo, Egypt', ScannedAt: '2026-03-11T16:45:00.000Z' },
    ],
    preferences: {
      pushNotifications: true,
      emailNotifications: true,
      showMedicalOnScan: true,
      showContactsOnScan: true,
      showPhotoOnScan: true,
    },
  },
]

export function findDemoAccountByEmail(email: string): DemoAccount | undefined {
  return DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === email.toLowerCase())
}

export function findDemoAccountById(userID: string): DemoAccount | undefined {
  return DEMO_ACCOUNTS.find((a) => a.userID === userID)
}

export function findDemoAccountByQr(qrCode: string): DemoAccount | undefined {
  return DEMO_ACCOUNTS.find((a) => a.wristbands.some((w) => w.QRCode === qrCode))
}

export function findDemoAccountByBandOrNfc(identifier: string): DemoAccount | undefined {
  return DEMO_ACCOUNTS.find((a) =>
    a.wristbands.some(
      (w) => w.NFCTag === identifier || w.SerialNumber === identifier || w.id === identifier,
    ),
  )
}
