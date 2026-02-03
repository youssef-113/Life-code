import { db } from "../../src/config/firebase.js";

export const logout = async (req, res) => {
    try {
        const { sessionToken } = req.body;

        if (!sessionToken) {
            return res.status(400).json({ message: "Session token is required" });
        }

        const snapshot = await db
            .collection("userSessions")
            .where("sessionToken", "==", sessionToken)
            .where("isActive", "==", true)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ message: "Active session not found" });
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
