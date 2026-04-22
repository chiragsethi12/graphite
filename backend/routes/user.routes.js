import express from "express";
import {
    getUserProfile,
    updateProfile,
    searchUsers,
    getRecommendedUsers,
} from "../controllers/user.controller.js";
import protect from "../middleware/auth.middleware.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

router.get("/search", protect, searchUsers);
router.get("/recommendations", protect, getRecommendedUsers);
router.get("/:id", protect, getUserProfile);
router.put(
    "/update",
    protect,
    upload.fields([{ name: "profilePic", maxCount: 1 }, { name: "bannerPic", maxCount: 1 }]),
    updateProfile
);

export default router;