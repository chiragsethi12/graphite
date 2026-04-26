import express from "express";
import { register, login, getMe, checkUsernameAvailability } from "../controllers/auth.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/check-username", checkUsernameAvailability);
router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);

export default router;