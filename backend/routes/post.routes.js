import express from "express";
import {
    createPost,
    getFeed,
    likePost,
    commentOnPost,
    deletePost,
} from "../controllers/post.controller.js";
import protect from "../middleware/auth.middleware.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

router.get("/feed", protect, getFeed);
router.post("/create", protect, upload.single("image"), createPost);
router.put("/:id/like", protect, likePost);
router.post("/:id/comment", protect, commentOnPost);
router.delete("/:id", protect, deletePost);

export default router;