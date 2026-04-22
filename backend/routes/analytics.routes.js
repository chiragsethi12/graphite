import express from "express";
import { getMyAnalytics } from "../controllers/analytics.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/me", protect, getMyAnalytics);

export default router;
