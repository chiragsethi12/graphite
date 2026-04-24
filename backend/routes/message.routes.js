import express from "express";
import {
    getConversations,
    getMessages,
    sendMessage,
    markConversationRead,
    deleteMessage,
} from "../controllers/message.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/conversations", protect, getConversations);
router.get("/:userId", protect, getMessages);
router.post("/:userId", protect, sendMessage);
router.put("/:userId/read", protect, markConversationRead);
router.delete("/:messageId", protect, deleteMessage);

export default router;