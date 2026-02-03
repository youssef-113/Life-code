import express from "express";
import { login } from "../../api/auth/login.js";
import { logout } from "../../api/auth/logout.js";

const router = express.Router();

// AUTH
router.post("/login", login);
router.post("/logout", logout);

export default router;

