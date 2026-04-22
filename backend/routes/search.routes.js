import express from "express";
import { search } from "../controllers/search.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect, search);

export default router;
