import { db, auth } from "../config/firebase.js";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

/* =========================
   LOGIN
========================= */
export const login = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Get Firebase user
    const user = await auth.getUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 2. Create JWT
    const accessToken = jwt.sign(
      { uid: user.uid },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const refreshToken = uuidv4();
    const sessionId = uuidv4();

    // 3. Save session
    await db.collection("userSessions").doc(sessionId).set({
      userId: user.uid,
      sessionToken: accessToken,
      refreshToken,
      userAgent: req.headers["user-agent"] || "",
      ipAddress: req.ip,
      isActive: true,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      lastUsed: new Date()
    });

    // 4. Security log
    await db.collection("securityLogs").add({
      userId: user.uid,
      actionType: "LOGIN_SUCCESS",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"] || "",
      timestamp: new Date()
    });

    res.status(200).json({
      accessToken,
      refreshToken
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/* =========================
   LOGOUT
========================= */
export const logout = async (req, res) => {
  try {
    const { sessionToken } = req.body;

    const snapshot = await db
      .collection("userSessions")
      .where("sessionToken", "==", sessionToken)
      .where("isActive", "==", true)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ message: "Session not found" });
    }

    const sessionDoc = snapshot.docs[0];

    // Disable session
    await sessionDoc.ref.update({
      isActive: false,
      lastUsed: new Date()
    });

    // Log logout
    await db.collection("securityLogs").add({
      userId: sessionDoc.data().userId,
      actionType: "LOGOUT",
      timestamp: new Date()
    });

    res.status(200).json({ message: "Logged out successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
