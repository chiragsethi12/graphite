import express from "express";
import {
    getNotifications,
    getUnreadCount,
    markAllAsRead,
    markSingleAsRead,
    deleteNotification,
} from "../controllers/notification.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/",                protect, getNotifications);
router.get("/unread-count",    protect, getUnreadCount);
router.patch("/mark-all-read", protect, markAllAsRead);
router.put("/:id/read",        protect, markSingleAsRead);
router.delete("/:id",          protect, deleteNotification);

export default router;