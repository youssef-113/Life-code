const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function seed() {
  const batch = db.batch();

  // USERS
  const userRef = db.collection("users").doc("sample_user");
  batch.set(userRef, {
    username: "test",
    email: "test@email.com",
    gender: "male",
    nationalId: "0000000000",
    photoUrl: "",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // SESSIONS
  batch.set(db.collection("sessions").doc("sample_session"), {
    userId: "sample_user",
    sessionToken: "session_token",
    refreshToken: "refresh_token",
    isActive: true,
    createdAt: new Date(),
    expiresAt: new Date(),
    lastUsed: new Date()
  });

  // SECURITY LOGS
  batch.set(db.collection("security_logs").doc("sample_log"), {
    userId: "sample_user",
    actionType: "LOGIN_SUCCESS",
    ipAddress: "127.0.0.1",
    userAgent: "Seeder",
    timestamp: new Date()
  });

  // DEVICES
  batch.set(db.collection("devices").doc("sample_device"), {
    userId: "sample_user",
    deviceName: "Seeder Device",
    deviceToken: "token",
    lastUsed: new Date()
  });

  // WRISTBANDS
  batch.set(db.collection("wristbands").doc("sample_band"), {
    userId: "sample_user",
    qrCode: "QR_SAMPLE",
    nfcTag: "NFC_SAMPLE",
    isActive: true,
    isRevoked: false,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // MEDICAL INFO
  batch.set(db.collection("medical_info").doc("sample_user"), {
    bloodType: "O+",
    chronicDiseases: "None",
    allergies: "None",
    medications: "None",
    notes: "",
    updatedAt: new Date()
  });

  // EMERGENCY CONTACTS
  batch.set(db.collection("emergency_contacts").doc("sample_contact"), {
    userId: "sample_user",
    contactName: "Emergency Contact",
    relation: "Brother",
    phoneNumber: "+20123456789",
    isPrimary: true,
    createdAt: new Date()
  });

  await batch.commit();
  console.log("✅ Firestore schema seeded successfully");
}

seed();
