import { DEMO_ACCOUNTS, type DemoAccount } from '@/lib/demoData'
import type { ScanHistoryEntry } from '@/types'

const STORAGE_KEY = 'lifecode.mockdb.v1'

interface MockDb {
  accounts: Record<string, DemoAccount>
  credentials: Record<string, { userID: string; password: string }> // email -> creds
}

function seedDb(): MockDb {
  const accounts: Record<string, DemoAccount> = {}
  const credentials: Record<string, { userID: string; password: string }> = {}
  for (const acc of DEMO_ACCOUNTS) {
    accounts[acc.userID] = structuredClone(acc)
    credentials[acc.email.toLowerCase()] = { userID: acc.userID, password: acc.password }
  }
  return { accounts, credentials }
}

function load(): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const seeded = seedDb()
      save(seeded)
      return seeded
    }
    return JSON.parse(raw) as MockDb
  } catch {
    return seedDb()
  }
}

function save(db: MockDb) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

let db = load()

export function resetMockDb() {
  db = seedDb()
  save(db)
}

export function getDb(): MockDb {
  return db
}

export function persistDb() {
  save(db)
}

export function getAccount(userID: string): DemoAccount {
  const acc = db.accounts[userID]
  if (!acc) throw new MockApiError(404, 'Not Found', "Account doesn't exist")
  return acc
}

export function findCredentials(email: string) {
  return db.credentials[email.toLowerCase()]
}

export function createAccount(input: {
  name: string
  email: string
  password: string
}): DemoAccount {
  const userID = `user-${Math.random().toString(36).slice(2, 10)}`
  const acc: DemoAccount = {
    userID,
    email: input.email,
    password: input.password,
    username: input.name,
    photoURL: null,
    gender: null,
    tagline: 'New account · Complete your medical profile',
    personalInfo: { name: input.name, gender: null, address: null },
    medicalProfile: { bloodType: null, medicalConditions: [] },
    hasAllergies: false,
    allergies: [],
    hasMedications: false,
    medications: [],
    hasSurgeries: false,
    surgeries: [],
    emergencyInstructions: '',
    emergencyContacts: [],
    family: [
      {
        id: `fam-${userID}-self`,
        ProfileType: 'Main',
        Name: input.name,
        Relation: 'Self',
        Age: null,
        BloodType: null,
        QRCode: `QR-${userID.toUpperCase()}`,
        IsChild: false,
        LostChildMode: false,
      },
    ],
    wristbands: [],
    scanHistory: [],
    preferences: {
      pushNotifications: true,
      emailNotifications: true,
      showMedicalOnScan: true,
      showContactsOnScan: true,
      showPhotoOnScan: true,
    },
  }
  db.accounts[userID] = acc
  db.credentials[input.email.toLowerCase()] = { userID, password: input.password }
  save(db)
  return acc
}

export function addScanEntry(userID: string, entry: ScanHistoryEntry) {
  const acc = getAccount(userID)
  acc.scanHistory = [entry, ...acc.scanHistory]
  save(db)
}

export class MockApiError extends Error {
  code: number
  errorType: string
  constructor(code: number, errorType: string, message: string) {
    super(message)
    this.code = code
    this.errorType = errorType
  }
}

export { save as saveMockDb }
