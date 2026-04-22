import express from "express";
import {
    getNotifications,
    markAsRead,
    deleteNotification,
} from "../controllers/notification.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getNotifications);
router.put("/read", protect, markAsRead);
router.delete("/:id", protect, deleteNotification);

export default router;