import express from "express";
import {
    createPost,
    getFeed,
    getTrendingPosts,
    getPostById,
    likePost,
    commentOnPost,
    deleteComment,
    sharePost,
    deletePost,
} from "../controllers/post.controller.js";
import protect from "../middleware/auth.middleware.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

router.get("/feed",                   protect, getFeed);
router.get("/trending",               protect, getTrendingPosts);
router.post("/create",                protect, upload.single("image"), createPost);
router.get("/:id",                    protect, getPostById);
router.put("/:id/like",               protect, likePost);
router.post("/:id/comment",           protect, commentOnPost);
router.delete("/:id/comment/:commentId", protect, deleteComment);
router.post("/:id/share",             protect, sharePost);
router.delete("/:id",                 protect, deletePost);

export default router;