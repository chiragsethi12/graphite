import express from "express";
import {
    sendRequest,
    respondToRequest,
    getConnections,
    getPendingRequests,
    removeConnection,
} from "../controllers/connection.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/send/:recipientId", protect, sendRequest);
router.put("/respond/:connectionId", protect, respondToRequest);
router.get("/", protect, getConnections);
router.get("/pending", protect, getPendingRequests);
router.delete("/:userId", protect, removeConnection);

export default router;