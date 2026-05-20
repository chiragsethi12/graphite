import express from "express";
import {
    getUnreadCount,
    getConversations,
    getMessages,
    sendMessage,
    markConversationRead,
    deleteMessage,
} from "../controllers/message.controller.js";
import protect from "../middleware/auth.middleware.js";
import { upload, handleMulterError } from "../config/cloudinary.js";

const router = express.Router();

router.get("/unread-count", protect, getUnreadCount);
router.get("/conversations", protect, getConversations);
router.get("/:userId", protect, getMessages);
router.post("/:userId", protect, upload.single("image"), handleMulterError, sendMessage);
router.put("/:userId/read", protect, markConversationRead);
router.delete("/:messageId", protect, deleteMessage);

export default router;