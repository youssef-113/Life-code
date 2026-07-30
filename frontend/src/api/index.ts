import { useAuthStore } from '@/store/authStore'
import { mockAuth, mockProfile, mockMedical, mockContacts, mockFamily, mockWristband, mockScan, mockAccount } from '@/api/mockApi'
import { liveAuth, liveProfile, liveMedical, liveContacts, liveFamily, liveWristband, liveScan, liveAccount } from '@/api/liveApi'
import { MockApiError } from '@/api/mockStore'
import { extractApiError, type ApiErrorShape } from '@/api/client'
import type {
  Allergy,
  EmergencyContact,
  FamilyProfile,
  MedicalProfileCore,
  Medication,
  PersonalInfo,
  ScannerType,
  Surgery,
  UserPreferences,
} from '@/types'

export const IS_MOCK = (import.meta.env.VITE_API_MODE ?? 'mock') !== 'live'

function uid(): string {
  const id = useAuthStore.getState().user?.userID
  if (!id) throw new ApiClientError(401, 'Authentication failed', 'No active session')
  return id
}

export class ApiClientError extends Error {
  code: number
  errorType: string
  constructor(code: number, errorType: string, message: string) {
    super(message)
    this.code = code
    this.errorType = errorType
  }
}

/** Normalizes both mock and axios errors into one shape pages can rely on. */
export function toApiError(err: unknown): ApiErrorShape {
  if (err instanceof MockApiError || err instanceof ApiClientError) {
    return { code: err.code, error: err.errorType, message: err.message }
  }
  return extractApiError(err)
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export const api = {
  auth: {
    register: (name: string, email: string, password: string) =>
      IS_MOCK ? mockAuth.register(name, email, password) : liveAuth.register(name, email, password),
    login: (email: string, password: string) => (IS_MOCK ? mockAuth.login(email, password) : liveAuth.login(email, password)),
    logout: () => (IS_MOCK ? mockAuth.logout() : liveAuth.logout()),
    getSessions: () => (IS_MOCK ? mockAuth.getSessions(uid()) : liveAuth.getSessions()),
    revokeSession: (sessionId: string) => (IS_MOCK ? mockAuth.revokeSession() : liveAuth.revokeSession(sessionId)),
  },

  profile: {
    getPersonalInfo: (): Promise<PersonalInfo> => (IS_MOCK ? mockProfile.getPersonalInfo(uid()) : liveProfile.getPersonalInfo()),
    updatePersonalInfo: (patch: Partial<PersonalInfo>) =>
      IS_MOCK ? mockProfile.updatePersonalInfo(uid(), patch) : liveProfile.updatePersonalInfo(patch),
  },

  medical: {
    getDashboard: () => (IS_MOCK ? mockMedical.getDashboard(uid()) : liveMedical.getDashboard()),
    updateMedicalProfile: (patch: MedicalProfileCore) =>
      IS_MOCK ? mockMedical.updateMedicalProfile(uid(), patch) : liveMedical.updateMedicalProfile(patch),
    updateAllergies: (hasAllergies: boolean, allergies: Allergy[]) =>
      IS_MOCK ? mockMedical.updateAllergies(uid(), hasAllergies, allergies) : liveMedical.updateAllergies(hasAllergies, allergies),
    updateMedications: (hasMedications: boolean, medications: Medication[]) =>
      IS_MOCK
        ? mockMedical.updateMedications(uid(), hasMedications, medications)
        : liveMedical.updateMedications(hasMedications, medications),
    updateSurgeries: (hasSurgeries: boolean, surgeries: Surgery[]) =>
      IS_MOCK ? mockMedical.updateSurgeries(uid(), hasSurgeries, surgeries) : liveMedical.updateSurgeries(hasSurgeries, surgeries),
    updateEmergencyInstructions: (text: string) =>
      IS_MOCK ? mockMedical.updateEmergencyInstructions(uid(), text) : liveMedical.updateEmergencyInstructions(text),
  },

  contacts: {
    list: (): Promise<EmergencyContact[]> => (IS_MOCK ? mockContacts.list(uid()) : liveContacts.list()),
    add: (contact: Omit<EmergencyContact, 'id' | 'CreatedAt'>) =>
      IS_MOCK ? mockContacts.add(uid(), contact) : liveContacts.add(contact),
    update: (id: string, patch: Partial<EmergencyContact>) =>
      IS_MOCK ? mockContacts.update(uid(), id, patch) : liveContacts.update(id, patch),
    remove: (id: string) => (IS_MOCK ? mockContacts.remove(uid(), id) : liveContacts.remove(id)),
    setPrimary: (id: string) => (IS_MOCK ? mockContacts.setPrimary(uid(), id) : liveContacts.setPrimary(id)),
  },

  family: {
    list: (): Promise<FamilyProfile[]> => (IS_MOCK ? mockFamily.list(uid()) : liveFamily.list()),
    add: (member: Omit<FamilyProfile, 'id' | 'ProfileType' | 'QRCode'>) =>
      IS_MOCK ? mockFamily.add(uid(), member) : liveFamily.add(member),
    update: (id: string, patch: Partial<FamilyProfile>) =>
      IS_MOCK ? mockFamily.update(uid(), id, patch) : liveFamily.update(id, patch),
    remove: (id: string) => (IS_MOCK ? mockFamily.remove(uid(), id) : liveFamily.remove(id)),
  },

  wristband: {
    list: () => (IS_MOCK ? mockWristband.list(uid()) : liveWristband.list()),
    getPrimary: () => (IS_MOCK ? mockWristband.getPrimary(uid()) : liveWristband.getPrimary()),
    register: (qrCode?: string, nfcTag?: string) =>
      IS_MOCK ? mockWristband.register(uid(), qrCode, nfcTag) : liveWristband.register(qrCode, nfcTag),
    activate: (id: string) => (IS_MOCK ? mockWristband.activate(uid(), id) : liveWristband.activate(id)),
    revoke: (id: string, reason?: string) => (IS_MOCK ? mockWristband.revoke(uid(), id) : liveWristband.revoke(id, reason)),
    setPrimary: (id: string) => (IS_MOCK ? mockWristband.setPrimary(uid(), id) : liveWristband.setPrimary(id)),
  },

  scan: {
    // Public / unauthenticated — used by the Emergency Scan portal, works identically signed-in or not.
    scanQr: (qrCode: string, scannerType: ScannerType, location?: string, lat?: number, lng?: number) =>
      IS_MOCK ? mockScan.scanQr(qrCode, scannerType, location) : liveScan.scanQr(qrCode, scannerType, location, lat, lng),
    scanNfc: (nfcTag: string, scannerType: ScannerType, location?: string, lat?: number, lng?: number) =>
      IS_MOCK ? mockScan.scanNfc(nfcTag, scannerType, location) : liveScan.scanNfc(nfcTag, scannerType, location, lat, lng),
    scanBand: (bandId: string, scannerType: ScannerType, location?: string, lat?: number, lng?: number) =>
      IS_MOCK ? mockScan.scanBand(bandId, scannerType, location) : liveScan.scanBand(bandId, scannerType, location, lat, lng),
    history: (page = 1, limit = 50) => (IS_MOCK ? mockScan.history(uid()) : liveScan.history(page, limit)),
  },

  account: {
    changePassword: (currentPassword: string, newPassword: string) =>
      IS_MOCK ? mockAccount.changePassword(uid(), currentPassword, newPassword) : liveAccount.changePassword(currentPassword, newPassword),
    uploadPhoto: async (file: File) => {
      if (IS_MOCK) {
        const dataUrl = await fileToDataUrl(file)
        return mockAccount.uploadPhoto(uid(), dataUrl)
      }
      return liveAccount.uploadPhotoFile(file)
    },
    deletePhoto: () => (IS_MOCK ? mockAccount.deletePhoto(uid()) : liveAccount.deletePhoto()),
    deleteAccount: () => (IS_MOCK ? mockAccount.deleteAccount(uid()) : liveAccount.deleteAccount()),
    getPreferences: () => (IS_MOCK ? mockAccount.getPreferences(uid()) : liveAccount.getPreferences()),
    updatePreferences: (patch: Partial<UserPreferences>) =>
      IS_MOCK ? mockAccount.updatePreferences(uid(), patch) : liveAccount.updatePreferences(patch),
    getComplete: () => (IS_MOCK ? mockAccount.getComplete(uid()) : liveAccount.getComplete()),
  },
}
