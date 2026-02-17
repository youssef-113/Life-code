import { db } from "../config/firebase.js";

export async function getUserProfile(userId) {
  if (!userId) throw new Error("UserID required");

  const userDoc = await db.collection("Users").doc(userId).get();

  if (!userDoc.exists) {
    throw new Error("User not found");
  }

  return userDoc.data();
}
