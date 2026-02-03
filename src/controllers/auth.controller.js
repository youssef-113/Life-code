import { db, auth } from "../../config/firebase.js";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Firebase Auth login
    const user = await auth.getUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const sessionToken = jwt.sign(
      { uid: user.uid },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const refreshToken = uuidv4();

    const sessionId = uuidv4();

    await db.collection("userSessions").doc(sessionId).set({
      userId: user.uid,
      sessionToken,
      refreshToken,
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
      isActive: true,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000),
      lastUsed: new Date(),
    });

    await db.collection("securityLogs").add({
      userId: user.uid,
      actionType: "LOGIN_SUCCESS",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      timestamp: new Date(),
    });

    res.json({
      accessToken: sessionToken,
      refreshToken,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
