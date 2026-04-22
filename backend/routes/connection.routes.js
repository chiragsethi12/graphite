import express from "express";
import {
    sendRequest,
    respondToRequest,
    withdrawRequest,
    getConnections,
    getPendingRequests,
    getSentRequests,
    getConnectionStatus,
    getMutualConnections,
    removeConnection,
} from "../controllers/connection.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/",                    protect, getConnections);
router.get("/pending",             protect, getPendingRequests);
router.get("/sent",                protect, getSentRequests);
router.get("/status/:userId",      protect, getConnectionStatus);
router.get("/mutual/:userId",      protect, getMutualConnections);
router.post("/request/:recipientId", protect, sendRequest);
router.put("/respond/:connectionId", protect, respondToRequest);
router.delete("/withdraw/:recipientId", protect, withdrawRequest);
router.delete("/:userId",          protect, removeConnection);

export default router;