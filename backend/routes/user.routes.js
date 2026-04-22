import express from "express";
import {
    getUserProfile,
    getUserPosts,
    getUserStats,
    updateProfile,
    searchUsers,
    getRecommendedUsers,
    changePassword,
    updatePrivacy,
} from "../controllers/user.controller.js";
import protect from "../middleware/auth.middleware.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

// Order matters: specific routes before :identifier param
router.get("/search",          protect, searchUsers);
router.get("/suggestions",     protect, getRecommendedUsers);
router.put("/update",          protect, upload.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "bannerPic",  maxCount: 1 },
]), updateProfile);
router.put("/change-password", protect, changePassword);
router.put("/privacy",         protect, updatePrivacy);
router.get("/:identifier",    protect, getUserProfile);
router.get("/:userId/posts",  protect, getUserPosts);
router.get("/:userId/stats",  protect, getUserStats);

export default router;