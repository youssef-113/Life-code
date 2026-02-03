import { db, auth } from "../../src/config/firebase.js";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

export const login = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

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
            refreshToken,
            userId: user.uid
        });

    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(500).json({ error: error.message });
    }
};
