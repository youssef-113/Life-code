// ---- Auth ----

export type ProviderName = 'email' | 'google' | 'apple'

export interface Provider {
  provider: ProviderName
  providerId: string | null
  linkedAt: string
}

export interface AuthUser {
  userID: string
  username: string
  email: string
  photoURL: string | null
  providers: Provider[]
  primaryProvider: ProviderName
}

export interface AuthSessionData extends AuthUser {
  sessionToken: string
  refreshToken: string
  expiresAt: string
  sessionID: string
  deviceName?: string
  suspiciousLogin: boolean
  isNewUser?: boolean
  accountLinked?: boolean
  createdAt?: string
}

export interface Session {
  sessionId: string
  deviceName: string
  deviceType: string
  ipAddress: string
  lastActive: string
  createdAt: string
  isCurrent: boolean
}

// ---- Profile completion (attached to many responses) ----

export type CompletionLevel = 'low' | 'partial' | 'medium' | 'complete'

export interface ProfileCompletionMeta {
  profileCompletion: number
  completionLevel: CompletionLevel
  nextRecommendedStep: string
}

// ---- Personal info ----

export type Gender = 'male' | 'female' | 'other'

export interface PersonalInfo {
  name: string
  gender: Gender | null
  address: string | null
}

// ---- Emergency contacts ----

export type Relationship =
  | 'Father'
  | 'Mother'
  | 'Friend'
  | 'Sister'
  | 'Brother'
  | 'Spouse'
  | 'Other'

export interface EmergencyContact {
  id: string
  ContactName: string
  phoneNumbers: string[]
  relationship: Relationship
  isPrimary: boolean
  notes?: string
  CreatedAt?: string
  UpdatedAt?: string
}

// ---- Medical profile ----

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'
export type Severity = 'Mild' | 'Moderate' | 'Severe'

export interface Allergy {
  allergyType: string
  severity: Severity
  notes?: string
}

export interface Medication {
  medicationName: string
  dosage: string
  schedule: string
  notes?: string
}

export interface Surgery {
  surgeryName: string
  surgeryDate: string
  notes?: string
}

export interface MedicalProfileCore {
  bloodType: BloodType | null
  medicalConditions: string[]
}

export interface MedicalProfileDashboard {
  userHeader: {
    name: string
    photoURL: string | null
    updatedAt: string
  }
  profileCompletion: number
  completionLevel: CompletionLevel
  nextRecommendedStep: string
  quickStats: {
    bloodType: BloodType | null
    allergiesCount: number
    medicationsCount: number
    surgeriesCount: number
  }
  sections: {
    personalInfo: { completed: boolean; data: PersonalInfo }
    emergencyContact: { completed: boolean; data: unknown }
    medicalProfile: { completed: boolean; data: MedicalProfileCore }
    allergies: { completed: boolean; hasAllergiesFlag: boolean; count: number; items: Allergy[] }
    medications: { completed: boolean; hasMedicationsFlag: boolean; count: number; items: Medication[] }
    surgeries: { completed: boolean; hasSurgeriesFlag: boolean; count: number; items: Surgery[] }
  }
}

// ---- Family ----

export type FamilyRelation = 'Spouse' | 'Son' | 'Daughter' | 'Parent' | 'Sibling' | 'Other'

export interface FamilyProfile {
  id: string
  ProfileType: 'Main' | 'Dependent'
  Name: string
  Relation: FamilyRelation | 'Self'
  Age: number | null
  BloodType: BloodType | null
  QRCode: string
  IsChild: boolean
  LostChildMode: boolean
}

// ---- Wristband ----

export type WristbandStatus = 'active' | 'revoked' | 'pending'

export interface Wristband {
  id: string
  SerialNumber: string
  QRCode: string
  NFCTag: string
  Status: WristbandStatus
  IsActive: boolean
  IsPrimary: boolean
  ActivatedAt: string | null
}

// ---- Scan ----

export type ScannerType = 'emergency' | 'hospital' | 'public' | 'personal'

export interface ScanReport {
  reportType: 'complete_user_report'
  userID: string
  scannedAt: string
  wristband: {
    id: string
    BandID: string
    SerialNumber: string
    QRCode: string
    NFCTag: string
    Status: WristbandStatus
    IsPrimary: boolean
    ActivatedAt: string
  }
  user: {
    id: string
    Username: string
    Email: string
    Gender: Gender | null
    NationalID?: string
    PhotoURL: string | null
    PhoneNumber?: string
    Address?: string
    DateOfBirth?: string
    IsActive: boolean
  }
  medical: {
    BloodType: BloodType | null
    Height?: string
    Weight?: string
    MedicalConditions: string[]
    HasAllergies: boolean
    Allergies: { AllergyType: string; Severity: Severity; Notes?: string }[]
    HasMedications: boolean
    Medications: { MedicationName: string; Dosage: string; Schedule: string; Notes?: string }[]
    HasSurgeries: boolean
    Surgeries: { SurgeryName: string; SurgeryDate: string; Notes?: string }[]
    EmergencyInstructions?: string
    Notes?: string
  }
  emergencyContacts: EmergencyContact[]
  scanLog: {
    id: string
    timestamp: string
    location?: string
    scannerType: ScannerType
  }
}

export interface ScanHistoryEntry {
  id: string
  QRCode: string
  ScannerType: ScannerType
  Location: string
  ScannedAt: string
}

// ---- Preferences ----

export interface UserPreferences {
  pushNotifications: boolean
  emailNotifications: boolean
  showMedicalOnScan: boolean
  showContactsOnScan: boolean
  showPhotoOnScan: boolean
}

// ---- API envelope ----

export interface ApiSuccess<T> {
  success: true
  message?: string
  data: T
}

export interface ApiFailure {
  success: false
  error: string
  message: string
  code: number
}

export type ApiResponse<T> = ApiSuccess<T> & Partial<ProfileCompletionMeta>
