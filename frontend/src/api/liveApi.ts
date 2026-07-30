import { http } from '@/api/client'
import type {
  Allergy,
  AuthSessionData,
  EmergencyContact,
  FamilyProfile,
  MedicalProfileCore,
  Medication,
  PersonalInfo,
  ScanReport,
  ScannerType,
  Surgery,
  UserPreferences,
  Wristband,
} from '@/types'

function unwrap<T>(res: { data: { data: T } }): T {
  return res.data.data
}

// ---------------- Auth ----------------

export const liveAuth = {
  async register(name: string, email: string, password: string) {
    const res = await http.post('/register', { name, email, password, confirmPassword: password })
    return unwrap<AuthSessionData>(res)
  },
  async login(email: string, password: string) {
    const res = await http.post('/login', { email, password })
    return unwrap<AuthSessionData>(res)
  },
  async logout() {
    await http.post('/logout')
    return { success: true as const }
  },
  async getSessions() {
    const res = await http.get('/sessions')
    return res.data.data.sessions
  },
  async revokeSession(sessionId: string) {
    await http.delete(`/sessions/${sessionId}`)
    return { success: true as const }
  },
}

// ---------------- Profile / Personal info (backed by /medical/*) ----------------

export const liveProfile = {
  async getPersonalInfo(): Promise<PersonalInfo> {
    const res = await http.get('/medical/profile')
    const s = res.data.data.sections.personalInfo.data
    return { name: s.name ?? '', gender: s.gender ?? null, address: s.address ?? null }
  },
  async updatePersonalInfo(patch: Partial<PersonalInfo>) {
    const res = await http.put('/medical/personal-info', patch)
    return { data: res.data.data, ...pickMeta(res.data) }
  },
}

function pickMeta(payload: {
  profileCompletion?: number
  completionLevel?: string
  nextRecommendedStep?: string
}) {
  return {
    profileCompletion: payload.profileCompletion ?? 0,
    completionLevel: (payload.completionLevel as 'low' | 'partial' | 'medium' | 'complete') ?? 'low',
    nextRecommendedStep: payload.nextRecommendedStep ?? '',
  }
}

// ---------------- Medical ----------------

export const liveMedical = {
  async getDashboard() {
    const res = await http.get('/medical/profile')
    return res.data.data
  },
  async updateMedicalProfile(patch: MedicalProfileCore) {
    const res = await http.put('/medical/medical-profile', patch)
    return { data: res.data.data, ...pickMeta(res.data) }
  },
  async updateAllergies(hasAllergies: boolean, allergies: Allergy[]) {
    const res = await http.put('/medical/allergies', hasAllergies ? { hasAllergies, allergies } : { hasAllergies })
    return { data: res.data.data, ...pickMeta(res.data) }
  },
  async updateMedications(hasMedications: boolean, medications: Medication[]) {
    const res = await http.put(
      '/medical/medications',
      hasMedications ? { hasMedications, medications } : { hasMedications },
    )
    return { data: res.data.data, ...pickMeta(res.data) }
  },
  async updateSurgeries(hasSurgeries: boolean, surgeries: Surgery[]) {
    const res = await http.put('/medical/surgeries', hasSurgeries ? { hasSurgeries, surgeries } : { hasSurgeries })
    return { data: res.data.data, ...pickMeta(res.data) }
  },
  async updateEmergencyInstructions(text: string) {
    // Stored alongside the medical record; PUT /medical merges partial fields.
    const res = await http.put('/medical', { medicalProfile: { emergencyInstructions: text } })
    return { data: res.data.data, ...pickMeta(res.data) }
  },
}

// ---------------- Emergency contacts ----------------

export const liveContacts = {
  async list(): Promise<EmergencyContact[]> {
    const res = await http.get('/emergency/contacts')
    return res.data.data
  },
  async add(contact: Omit<EmergencyContact, 'id' | 'CreatedAt'>) {
    const res = await http.post('/emergency/contact', contact)
    return { data: res.data.data, ...pickMeta(res.data) }
  },
  async update(id: string, patch: Partial<EmergencyContact>) {
    const res = await http.put(`/emergency/contact/${id}`, patch)
    return { data: res.data.data, ...pickMeta(res.data) }
  },
  async remove(id: string) {
    const res = await http.delete(`/emergency/contact/${id}`)
    return { data: res.data.data, ...pickMeta(res.data) }
  },
  async setPrimary(id: string) {
    const res = await http.put(`/emergency/contact/${id}/primary`)
    return { data: res.data.data, ...pickMeta(res.data) }
  },
}

// ---------------- Family ----------------

export const liveFamily = {
  async list(): Promise<FamilyProfile[]> {
    const res = await http.get('/family')
    return res.data.data
  },
  async add(member: Omit<FamilyProfile, 'id' | 'ProfileType' | 'QRCode'>) {
    const res = await http.post('/family', member)
    return unwrap<FamilyProfile>(res)
  },
  async update(id: string, patch: Partial<FamilyProfile>) {
    const res = await http.put(`/family/${id}`, patch)
    return unwrap<FamilyProfile>(res)
  },
  async remove(id: string) {
    await http.delete(`/family/${id}`)
    return { deletedId: id }
  },
}

// ---------------- Wristband ----------------

export const liveWristband = {
  async list(): Promise<Wristband[]> {
    const res = await http.get('/wristband/list')
    return res.data.data
  },
  async getPrimary(): Promise<Wristband | null> {
    const res = await http.get('/wristband/primary')
    return res.data.data ?? null
  },
  async register(qrCode?: string, nfcTag?: string) {
    const res = await http.post('/wristband/register', { qrCode, nfcTag })
    return unwrap<Wristband>(res)
  },
  async activate(wristbandId: string) {
    const res = await http.post('/wristband/activate', { wristbandId })
    return unwrap<Wristband>(res)
  },
  async revoke(wristbandId: string, reason?: string) {
    const res = await http.post('/wristband/revoke', { wristbandId, reason })
    return unwrap<Wristband>(res)
  },
  async setPrimary(wristbandId: string) {
    const res = await http.put(`/wristband/${wristbandId}/primary`)
    return unwrap<Wristband>(res)
  },
}

// ---------------- Scan ----------------

export const liveScan = {
  async scanQr(qrCode: string, scannerType: ScannerType, location?: string, latitude?: number, longitude?: number) {
    const res = await http.post('/scan/qr', { qrCode, scannerType, location, latitude, longitude })
    return unwrap<ScanReport>(res)
  },
  async scanNfc(nfcTag: string, scannerType: ScannerType, location?: string, latitude?: number, longitude?: number) {
    const res = await http.post('/scan/nfc', { nfcTag, scannerType, location, latitude, longitude })
    return unwrap<ScanReport>(res)
  },
  async scanBand(bandId: string, scannerType: ScannerType, location?: string, latitude?: number, longitude?: number) {
    const res = await http.post('/scan/band', { bandId, scannerType, location, latitude, longitude })
    return unwrap<ScanReport>(res)
  },
  async history(page = 1, limit = 50) {
    const res = await http.get('/scan/history', { params: { page, limit } })
    return res.data.data
  },
}

// ---------------- Account ----------------

export const liveAccount = {
  async changePassword(currentPassword: string, newPassword: string) {
    await http.post('/user/password', { currentPassword, newPassword })
    return { success: true as const }
  },
  async uploadPhotoFile(file: File) {
    const form = new FormData()
    form.append('photo', file)
    const res = await http.post('/user/photo', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    return { data: res.data.data, ...pickMeta(res.data) }
  },
  async deletePhoto() {
    const res = await http.delete('/user/photo')
    return { data: res.data.data, ...pickMeta(res.data) }
  },
  async deleteAccount() {
    const res = await http.delete('/user/account')
    return unwrap<{ deactivatedAt: string; sessionsDeactivated: number }>(res)
  },
  async getPreferences(): Promise<UserPreferences> {
    const res = await http.get('/user/preferences')
    return res.data.data
  },
  async updatePreferences(patch: Partial<UserPreferences>) {
    const res = await http.put('/user/preferences', patch)
    return res.data.data as UserPreferences
  },
  async getComplete() {
    const res = await http.get('/user/complete')
    return { data: res.data.data, ...pickMeta(res.data) }
  },
}
