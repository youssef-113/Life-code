import type { DemoAccount } from '@/lib/demoData'
import {
  findDemoAccountByQr,
  findDemoAccountByBandOrNfc,
} from '@/lib/demoData'
import {
  getAccount,
  findCredentials,
  createAccount,
  addScanEntry,
  saveMockDb,
  getDb,
  MockApiError,
} from '@/api/mockStore'
import type {
  Allergy,
  AuthSessionData,
  CompletionLevel,
  EmergencyContact,
  FamilyProfile,
  MedicalProfileCore,
  Medication,
  PersonalInfo,
  ProfileCompletionMeta,
  ScanReport,
  ScannerType,
  Surgery,
  UserPreferences,
  Wristband,
} from '@/types'

const LATENCY = 380

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY))
}

function fail(code: number, errorType: string, message: string): never {
  throw new MockApiError(code, errorType, message)
}

function makeToken(userID: string): string {
  return `mock.${userID}.${Date.now()}`
}

function toAuthSession(acc: DemoAccount, isNewUser = false): AuthSessionData {
  return {
    userID: acc.userID,
    username: acc.username,
    email: acc.email,
    photoURL: acc.photoURL,
    providers: [{ provider: 'email', providerId: null, linkedAt: new Date().toISOString() }],
    primaryProvider: 'email',
    sessionToken: makeToken(acc.userID),
    refreshToken: makeToken(acc.userID) + '.refresh',
    expiresAt: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString(),
    sessionID: `session-${Math.random().toString(36).slice(2, 10)}`,
    deviceName: navigator.userAgent.includes('Mobile') ? 'Mobile Browser' : 'Web Browser',
    suspiciousLogin: false,
    isNewUser,
    createdAt: new Date().toISOString(),
  }
}

function completionLevelFrom(pct: number): CompletionLevel {
  if (pct >= 80) return 'complete'
  if (pct >= 50) return 'medium'
  if (pct >= 20) return 'partial'
  return 'low'
}

function computeCompletion(acc: DemoAccount): ProfileCompletionMeta {
  const steps: { label: string; weight: number; pct: number }[] = []

  const piFields = [acc.personalInfo.name, acc.personalInfo.gender, acc.personalInfo.address]
  const piFilled = piFields.filter(Boolean).length
  steps.push({ label: 'Complete your personal information', weight: 15, pct: piFilled / 3 })

  steps.push({ label: 'Upload a profile photo', weight: 10, pct: acc.photoURL ? 1 : 0 })

  steps.push({
    label: 'Add an emergency contact',
    weight: 15,
    pct: acc.emergencyContacts.length > 0 ? 1 : 0,
  })

  const mpFilled = (acc.medicalProfile.bloodType ? 1 : 0) + (acc.medicalProfile.medicalConditions.length > 0 ? 1 : 0)
  steps.push({ label: 'Add your blood type and medical conditions', weight: 15, pct: mpFilled / 2 })

  steps.push({
    label: 'Confirm whether you have any allergies',
    weight: 15,
    pct: !acc.hasAllergies ? 1 : acc.allergies.length > 0 ? 1 : 0.5,
  })
  steps.push({
    label: 'Confirm your current medications',
    weight: 15,
    pct: !acc.hasMedications ? 1 : acc.medications.length > 0 ? 1 : 0.5,
  })
  steps.push({
    label: 'Confirm your surgical history',
    weight: 15,
    pct: !acc.hasSurgeries ? 1 : acc.surgeries.length > 0 ? 1 : 0.5,
  })

  const total = steps.reduce((sum, s) => sum + s.weight * s.pct, 0)
  const profileCompletion = Math.round(total)
  const nextStep = steps.find((s) => s.pct < 1)
  return {
    profileCompletion,
    completionLevel: completionLevelFrom(profileCompletion),
    nextRecommendedStep: nextStep ? nextStep.label : 'Profile complete!',
  }
}

function withCompletion<T extends object>(acc: DemoAccount, data: T) {
  return { data, ...computeCompletion(acc) }
}

// ---------------- Auth ----------------

export const mockAuth = {
  async register(name: string, email: string, password: string) {
    await delay(null)
    if (findCredentials(email)) fail(409, 'Conflict', 'An account with this email already exists')
    const acc = createAccount({ name, email, password })
    return toAuthSession(acc, true)
  },

  async login(email: string, password: string) {
    await delay(null)
    const creds = findCredentials(email)
    if (!creds || creds.password !== password) {
      fail(401, 'Authentication failed', 'Invalid email or password')
    }
    const acc = getAccount(creds!.userID)
    return toAuthSession(acc)
  },

  async logout() {
    await delay(null)
    return { success: true as const }
  },

  async getSessions(userID: string) {
    await delay(null)
    return [
      {
        sessionId: 'session-current',
        deviceName: navigator.userAgent.includes('Mobile') ? 'Mobile Browser' : 'Web Browser (this device)',
        deviceType: 'browser',
        ipAddress: '127.0.0.1',
        lastActive: new Date().toISOString(),
        createdAt: new Date(Date.now() - 3600_000).toISOString(),
        isCurrent: true,
      },
      {
        sessionId: 'session-demo-mobile',
        deviceName: 'LifeCode App on Android',
        deviceType: 'mobile',
        ipAddress: '10.0.0.4',
        lastActive: new Date(Date.now() - 86_400_000 * 2).toISOString(),
        createdAt: new Date(Date.now() - 86_400_000 * 30).toISOString(),
        isCurrent: false,
      },
    ]
  },

  async revokeSession() {
    await delay(null)
    return { success: true as const }
  },
}

// ---------------- Profile / Personal info ----------------

export const mockProfile = {
  async getPersonalInfo(userID: string): Promise<PersonalInfo> {
    await delay(null)
    return { ...getAccount(userID).personalInfo }
  },

  async updatePersonalInfo(userID: string, patch: Partial<PersonalInfo>) {
    await delay(null)
    const acc = getAccount(userID)
    acc.personalInfo = { ...acc.personalInfo, ...patch }
    acc.username = acc.personalInfo.name || acc.username
    saveMockDb(getDb())
    return withCompletion(acc, acc.personalInfo)
  },
}

// ---------------- Medical ----------------

export const mockMedical = {
  async getDashboard(userID: string) {
    await delay(null)
    const acc = getAccount(userID)
    const meta = computeCompletion(acc)
    return {
      userHeader: {
        name: acc.personalInfo.name,
        photoURL: acc.photoURL,
        updatedAt: new Date().toISOString(),
      },
      ...meta,
      quickStats: {
        bloodType: acc.medicalProfile.bloodType,
        allergiesCount: acc.allergies.length,
        medicationsCount: acc.medications.length,
        surgeriesCount: acc.surgeries.length,
      },
      sections: {
        personalInfo: {
          completed: Boolean(acc.personalInfo.name && acc.personalInfo.gender && acc.personalInfo.address),
          data: acc.personalInfo,
        },
        emergencyContact: {
          completed: acc.emergencyContacts.length > 0,
          data: acc.emergencyContacts.find((c) => c.isPrimary) ?? acc.emergencyContacts[0] ?? null,
        },
        medicalProfile: {
          completed: Boolean(acc.medicalProfile.bloodType) && acc.medicalProfile.medicalConditions.length > 0,
          data: acc.medicalProfile,
        },
        allergies: {
          completed: !acc.hasAllergies || acc.allergies.length > 0,
          hasAllergiesFlag: acc.hasAllergies,
          count: acc.allergies.length,
          items: acc.allergies,
        },
        medications: {
          completed: !acc.hasMedications || acc.medications.length > 0,
          hasMedicationsFlag: acc.hasMedications,
          count: acc.medications.length,
          items: acc.medications,
        },
        surgeries: {
          completed: !acc.hasSurgeries || acc.surgeries.length > 0,
          hasSurgeriesFlag: acc.hasSurgeries,
          count: acc.surgeries.length,
          items: acc.surgeries,
        },
      },
    }
  },

  async updateMedicalProfile(userID: string, patch: MedicalProfileCore) {
    await delay(null)
    const acc = getAccount(userID)
    acc.medicalProfile = patch
    saveMockDb(getDb())
    return withCompletion(acc, acc.medicalProfile)
  },

  async updateAllergies(userID: string, hasAllergies: boolean, allergies: Allergy[]) {
    await delay(null)
    const acc = getAccount(userID)
    acc.hasAllergies = hasAllergies
    acc.allergies = hasAllergies ? allergies : []
    saveMockDb(getDb())
    return withCompletion(acc, { hasAllergies, allergies: acc.allergies, count: acc.allergies.length })
  },

  async updateMedications(userID: string, hasMedications: boolean, medications: Medication[]) {
    await delay(null)
    const acc = getAccount(userID)
    acc.hasMedications = hasMedications
    acc.medications = hasMedications ? medications : []
    saveMockDb(getDb())
    return withCompletion(acc, { hasMedications, medications: acc.medications, count: acc.medications.length })
  },

  async updateSurgeries(userID: string, hasSurgeries: boolean, surgeries: Surgery[]) {
    await delay(null)
    const acc = getAccount(userID)
    acc.hasSurgeries = hasSurgeries
    acc.surgeries = hasSurgeries ? surgeries : []
    saveMockDb(getDb())
    return withCompletion(acc, { hasSurgeries, surgeries: acc.surgeries, count: acc.surgeries.length })
  },

  async updateEmergencyInstructions(userID: string, text: string) {
    await delay(null)
    const acc = getAccount(userID)
    acc.emergencyInstructions = text
    saveMockDb(getDb())
    return withCompletion(acc, { emergencyInstructions: text })
  },
}

// ---------------- Emergency contacts ----------------

export const mockContacts = {
  async list(userID: string): Promise<EmergencyContact[]> {
    await delay(null)
    return getAccount(userID).emergencyContacts
  },

  async add(userID: string, contact: Omit<EmergencyContact, 'id' | 'CreatedAt'>) {
    await delay(null)
    const acc = getAccount(userID)
    if (acc.emergencyContacts.length >= 10) fail(400, 'Bad Request', 'Maximum of 10 contacts reached')
    const newContact: EmergencyContact = {
      ...contact,
      id: `ec-${Math.random().toString(36).slice(2, 9)}`,
      CreatedAt: new Date().toISOString(),
    }
    if (newContact.isPrimary) {
      acc.emergencyContacts.forEach((c) => (c.isPrimary = false))
    }
    acc.emergencyContacts.push(newContact)
    saveMockDb(getDb())
    return withCompletion(acc, newContact)
  },

  async update(userID: string, id: string, patch: Partial<EmergencyContact>) {
    await delay(null)
    const acc = getAccount(userID)
    const idx = acc.emergencyContacts.findIndex((c) => c.id === id)
    if (idx === -1) fail(404, 'Not Found', 'Contact not found')
    if (patch.isPrimary) acc.emergencyContacts.forEach((c) => (c.isPrimary = false))
    acc.emergencyContacts[idx] = {
      ...acc.emergencyContacts[idx],
      ...patch,
      UpdatedAt: new Date().toISOString(),
    }
    saveMockDb(getDb())
    return withCompletion(acc, acc.emergencyContacts[idx])
  },

  async remove(userID: string, id: string) {
    await delay(null)
    const acc = getAccount(userID)
    acc.emergencyContacts = acc.emergencyContacts.filter((c) => c.id !== id)
    saveMockDb(getDb())
    return withCompletion(acc, { deletedId: id })
  },

  async setPrimary(userID: string, id: string) {
    await delay(null)
    const acc = getAccount(userID)
    acc.emergencyContacts.forEach((c) => (c.isPrimary = c.id === id))
    saveMockDb(getDb())
    const contact = acc.emergencyContacts.find((c) => c.id === id)
    if (!contact) throw new Error('Contact not found')
    return withCompletion(acc, contact)
  },
}

// ---------------- Family ----------------

export const mockFamily = {
  async list(userID: string): Promise<FamilyProfile[]> {
    await delay(null)
    return getAccount(userID).family
  },

  async add(userID: string, member: Omit<FamilyProfile, 'id' | 'ProfileType' | 'QRCode'>) {
    await delay(null)
    const acc = getAccount(userID)
    const newMember: FamilyProfile = {
      ...member,
      id: `fam-${Math.random().toString(36).slice(2, 9)}`,
      ProfileType: 'Dependent',
      QRCode: `QR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    }
    acc.family.push(newMember)
    saveMockDb(getDb())
    return newMember
  },

  async update(userID: string, id: string, patch: Partial<FamilyProfile>) {
    await delay(null)
    const acc = getAccount(userID)
    const idx = acc.family.findIndex((f) => f.id === id)
    if (idx === -1) fail(404, 'Not Found', 'Family member not found')
    acc.family[idx] = { ...acc.family[idx], ...patch }
    saveMockDb(getDb())
    return acc.family[idx]
  },

  async remove(userID: string, id: string) {
    await delay(null)
    const acc = getAccount(userID)
    acc.family = acc.family.filter((f) => f.id !== id)
    saveMockDb(getDb())
    return { deletedId: id }
  },
}

// ---------------- Wristband ----------------

export const mockWristband = {
  async list(userID: string): Promise<Wristband[]> {
    await delay(null)
    return getAccount(userID).wristbands
  },

  async getPrimary(userID: string): Promise<Wristband | null> {
    await delay(null)
    const acc = getAccount(userID)
    return acc.wristbands.find((w) => w.IsPrimary) ?? null
  },

  async register(userID: string, qrCode?: string, nfcTag?: string) {
    await delay(null)
    if (!qrCode && !nfcTag) fail(400, 'Bad Request', 'Provide at least one of qrCode or nfcTag')
    const acc = getAccount(userID)
    const wb: Wristband = {
      id: `wb-${Math.random().toString(36).slice(2, 9)}`,
      SerialNumber: `SN-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000 + 10000)}`,
      QRCode: qrCode ?? '',
      NFCTag: nfcTag ?? '',
      Status: 'pending',
      IsActive: false,
      IsPrimary: acc.wristbands.length === 0,
      ActivatedAt: null,
    }
    acc.wristbands.push(wb)
    saveMockDb(getDb())
    return wb
  },

  async activate(userID: string, wristbandId: string) {
    await delay(null)
    const acc = getAccount(userID)
    const wb = acc.wristbands.find((w) => w.id === wristbandId)
    if (!wb) fail(404, 'Not Found', 'Wristband not found')
    wb.Status = 'active'
    wb.IsActive = true
    wb.ActivatedAt = new Date().toISOString()
    saveMockDb(getDb())
    return wb
  },

  async revoke(userID: string, wristbandId: string) {
    await delay(null)
    const acc = getAccount(userID)
    const wb = acc.wristbands.find((w) => w.id === wristbandId)
    if (!wb) fail(404, 'Not Found', 'Wristband not found')
    wb.Status = 'revoked'
    wb.IsActive = false
    wb.IsPrimary = false
    saveMockDb(getDb())
    return wb
  },

  async setPrimary(userID: string, wristbandId: string) {
    await delay(null)
    const acc = getAccount(userID)
    acc.wristbands.forEach((w) => (w.IsPrimary = w.id === wristbandId))
    saveMockDb(getDb())
    return acc.wristbands.find((w) => w.id === wristbandId)
  },
}

// ---------------- Scan (public) ----------------

function buildScanReport(acc: DemoAccount, identifierUsed: string, scannerType: ScannerType, location?: string): ScanReport {
  const wb = acc.wristbands.find((w) => w.IsPrimary) ?? acc.wristbands[0]
  return {
    reportType: 'complete_user_report',
    userID: acc.userID,
    scannedAt: new Date().toISOString(),
    wristband: {
      id: wb?.id ?? 'n/a',
      BandID: wb?.SerialNumber ?? 'n/a',
      SerialNumber: wb?.SerialNumber ?? 'n/a',
      QRCode: wb?.QRCode ?? identifierUsed,
      NFCTag: wb?.NFCTag ?? '',
      Status: wb?.Status ?? 'pending',
      IsPrimary: wb?.IsPrimary ?? false,
      ActivatedAt: wb?.ActivatedAt ?? '',
    },
    user: {
      id: acc.userID,
      Username: acc.username,
      Email: acc.email,
      Gender: acc.gender,
      PhotoURL: acc.preferences.showPhotoOnScan ? acc.photoURL : null,
      Address: acc.personalInfo.address ?? undefined,
      IsActive: true,
    },
    medical: acc.preferences.showMedicalOnScan
      ? {
        BloodType: acc.medicalProfile.bloodType,
        MedicalConditions: acc.medicalProfile.medicalConditions,
        HasAllergies: acc.hasAllergies,
        Allergies: acc.allergies.map((a) => ({
          AllergyType: a.allergyType,
          Severity: a.severity,
          Notes: a.notes,
        })),
        HasMedications: acc.hasMedications,
        Medications: acc.medications.map((m) => ({
          MedicationName: m.medicationName,
          Dosage: m.dosage,
          Schedule: m.schedule,
          Notes: m.notes,
        })),
        HasSurgeries: acc.hasSurgeries,
        Surgeries: acc.surgeries.map((s) => ({
          SurgeryName: s.surgeryName,
          SurgeryDate: s.surgeryDate,
          Notes: s.notes,
        })),
        EmergencyInstructions: acc.emergencyInstructions,
      }
      : {
        BloodType: null,
        MedicalConditions: [],
        HasAllergies: false,
        Allergies: [],
        HasMedications: false,
        Medications: [],
        HasSurgeries: false,
        Surgeries: [],
      },
    emergencyContacts: acc.preferences.showContactsOnScan ? acc.emergencyContacts : [],
    scanLog: {
      id: `scan-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date().toISOString(),
      location,
      scannerType,
    },
  }
}

export const mockScan = {
  async scanQr(qrCode: string, scannerType: ScannerType, location?: string): Promise<ScanReport> {
    await delay(null)
    const acc = findDemoAccountByQr(qrCode) ?? findAccountByQrDynamic(qrCode)
    if (!acc) fail(404, 'Not Found', 'No LifeBand found with that QR code')
    const report = buildScanReport(acc, qrCode, scannerType, location)
    addScanEntry(acc.userID, {
      id: report.scanLog.id,
      QRCode: qrCode,
      ScannerType: scannerType,
      Location: location ?? 'Unknown location',
      ScannedAt: report.scannedAt,
    })
    return report
  },

  async scanNfc(nfcTag: string, scannerType: ScannerType, location?: string): Promise<ScanReport> {
    await delay(null)
    const acc = findDemoAccountByBandOrNfc(nfcTag) ?? findAccountByNfcDynamic(nfcTag)
    if (!acc) fail(404, 'Not Found', 'No LifeBand found with that NFC tag')
    const report = buildScanReport(acc, nfcTag, scannerType, location)
    addScanEntry(acc.userID, {
      id: report.scanLog.id,
      QRCode: acc.wristbands[0]?.QRCode ?? '',
      ScannerType: scannerType,
      Location: location ?? 'Unknown location',
      ScannedAt: report.scannedAt,
    })
    return report
  },

  async scanBand(bandId: string, scannerType: ScannerType, location?: string): Promise<ScanReport> {
    await delay(null)
    const acc = findDemoAccountByBandOrNfc(bandId) ?? findAccountByNfcDynamic(bandId)
    if (!acc) fail(404, 'Not Found', 'No LifeBand found with that band ID')
    const report = buildScanReport(acc, bandId, scannerType, location)
    addScanEntry(acc.userID, {
      id: report.scanLog.id,
      QRCode: acc.wristbands[0]?.QRCode ?? '',
      ScannerType: scannerType,
      Location: location ?? 'Unknown location',
      ScannedAt: report.scannedAt,
    })
    return report
  },

  async history(userID: string) {
    await delay(null)
    return getAccount(userID).scanHistory
  },
}

function findAccountByQrDynamic(qrCode: string): DemoAccount | undefined {
  const db = getDb()
  return Object.values(db.accounts).find((a) => a.wristbands.some((w) => w.QRCode === qrCode))
}

function findAccountByNfcDynamic(identifier: string): DemoAccount | undefined {
  const db = getDb()
  return Object.values(db.accounts).find((a) =>
    a.wristbands.some((w) => w.NFCTag === identifier || w.SerialNumber === identifier || w.id === identifier),
  )
}

// ---------------- Account ----------------

export const mockAccount = {
  async changePassword(userID: string, currentPassword: string, newPassword: string) {
    await delay(null)
    const acc = getAccount(userID)
    if (acc.password !== currentPassword) fail(401, 'Authentication failed', 'Current password is incorrect')
    acc.password = newPassword
    const db = getDb()
    db.credentials[acc.email.toLowerCase()].password = newPassword
    saveMockDb(db)
    return { success: true as const }
  },

  async uploadPhoto(userID: string, dataUrl: string) {
    await delay(null)
    const acc = getAccount(userID)
    acc.photoURL = dataUrl
    saveMockDb(getDb())
    return withCompletion(acc, { photoURL: dataUrl, photoType: 'storage' })
  },

  async deletePhoto(userID: string) {
    await delay(null)
    const acc = getAccount(userID)
    acc.photoURL = null
    saveMockDb(getDb())
    return withCompletion(acc, { deletedAt: new Date().toISOString() })
  },

  async deleteAccount(userID: string) {
    await delay(null)
    const acc = getAccount(userID)
    return { deactivatedAt: new Date().toISOString(), sessionsDeactivated: 1, name: acc.username }
  },

  async getPreferences(userID: string): Promise<UserPreferences> {
    await delay(null)
    return getAccount(userID).preferences
  },

  async updatePreferences(userID: string, patch: Partial<UserPreferences>) {
    await delay(null)
    const acc = getAccount(userID)
    acc.preferences = { ...acc.preferences, ...patch }
    saveMockDb(getDb())
    return acc.preferences
  },

  async getComplete(userID: string) {
    await delay(null)
    const acc = getAccount(userID)
    const meta = computeCompletion(acc)
    return {
      data: {
        user: {
          id: acc.userID,
          Username: acc.username,
          Email: acc.email,
          PhotoURL: acc.photoURL,
        },
        medical: {
          BloodType: acc.medicalProfile.bloodType,
          MedicalConditions: acc.medicalProfile.medicalConditions,
        },
        emergencyContacts: acc.emergencyContacts,
        wristbands: acc.wristbands,
      },
      ...meta,
    }
  },
}
