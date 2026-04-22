import Connection from "../models/Connection.model.js";
import User from "../models/User.model.js";
import Notification from "../models/Notification.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

// POST /api/connections/request/:recipientId
export const sendRequest = async (req, res) => {
    const { recipientId } = req.params;
    if (recipientId === req.user._id.toString())
        return res.status(400).json({ success: false, message: "Cannot connect with yourself" });

    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ success: false, message: "User not found" });

    const existing = await Connection.findOne({
        $or: [
            { sender: req.user._id, recipient: recipientId },
            { sender: recipientId, recipient: req.user._id },
        ],
    });
    if (existing) {
        if (existing.status === "accepted")
            return res.status(400).json({ success: false, message: "Already connected" });
        return res.status(400).json({ success: false, message: "Request already exists" });
    }

    const connection = await Connection.create({ sender: req.user._id, recipient: recipientId });

    const notification = await Notification.create({
        recipient: recipientId, sender: req.user._id, type: "connectionRequest",
        message: `${req.user.name} sent you a connection request`,
    });
    const socketId = getReceiverSocketId(recipientId);
    if (socketId) io.to(socketId).emit("newNotification", notification);

    res.status(201).json({ success: true, connection });
};

// PUT /api/connections/respond/:connectionId
export const respondToRequest = async (req, res) => {
    const { connectionId } = req.params;
    const { action } = req.body; // "accept" | "reject"

    const connection = await Connection.findById(connectionId);
    if (!connection) return res.status(404).json({ success: false, message: "Request not found" });
    if (connection.recipient.toString() !== req.user._id.toString())
        return res.status(403).json({ success: false, message: "Not authorized" });
    if (connection.status !== "pending")
        return res.status(400).json({ success: false, message: "Request already processed" });

    if (action === "accept") {
        connection.status = "accepted";
        await connection.save();

        await User.findByIdAndUpdate(connection.sender,    { $addToSet: { connections: connection.recipient } });
        await User.findByIdAndUpdate(connection.recipient, { $addToSet: { connections: connection.sender } });

        const notification = await Notification.create({
            recipient: connection.sender, sender: req.user._id, type: "connectionAccepted",
            message: `${req.user.name} accepted your connection request`,
        });
        const socketId = getReceiverSocketId(connection.sender.toString());
        if (socketId) io.to(socketId).emit("newNotification", notification);
    } else {
        connection.status = "rejected";
        await connection.save();
    }

    res.json({ success: true, connection });
};

// DELETE /api/connections/withdraw/:recipientId  (cancel sent request)
export const withdrawRequest = async (req, res) => {
    const { recipientId } = req.params;
    const conn = await Connection.findOneAndDelete({
        sender: req.user._id, recipient: recipientId, status: "pending",
    });
    if (!conn) return res.status(404).json({ success: false, message: "Request not found" });
    res.json({ success: true, message: "Request withdrawn" });
};

// GET /api/connections
export const getConnections = async (req, res) => {
    const user = await User.findById(req.user._id)
        .populate("connections", "name username profilePic headline location");
    res.json({ success: true, connections: user.connections });
};

// GET /api/connections/pending
export const getPendingRequests = async (req, res) => {
    const requests = await Connection.find({ recipient: req.user._id, status: "pending" })
        .populate("sender", "name username profilePic headline location")
        .sort({ createdAt: -1 });
    res.json({ success: true, requests });
};

// GET /api/connections/sent
export const getSentRequests = async (req, res) => {
    const requests = await Connection.find({ sender: req.user._id, status: "pending" })
        .populate("recipient", "name username profilePic headline")
        .sort({ createdAt: -1 });
    res.json({ success: true, requests });
};

// GET /api/connections/status/:userId
export const getConnectionStatus = async (req, res) => {
    const { userId } = req.params;
    if (userId === req.user._id.toString())
        return res.json({ success: true, status: "self" });

    const conn = await Connection.findOne({
        $or: [
            { sender: req.user._id, recipient: userId },
            { sender: userId, recipient: req.user._id },
        ],
    });

    if (!conn) return res.json({ success: true, status: "none", connectionId: null });

    let status = "none";
    if (conn.status === "accepted") status = "connected";
    else if (conn.status === "pending" && conn.sender.toString() === req.user._id.toString())
        status = "pending_sent";
    else if (conn.status === "pending" && conn.recipient.toString() === req.user._id.toString())
        status = "pending_received";
    else if (conn.status === "rejected") status = "rejected";

    res.json({ success: true, status, connectionId: conn._id });
};

// GET /api/connections/mutual/:userId
export const getMutualConnections = async (req, res) => {
    const { userId } = req.params;
    const [me, other] = await Promise.all([
        User.findById(req.user._id).select("connections"),
        User.findById(userId).select("connections"),
    ]);
    if (!other) return res.status(404).json({ success: false, message: "User not found" });

    const mySet    = new Set(me.connections.map((id) => id.toString()));
    const mutuals  = other.connections.filter((id) => mySet.has(id.toString()));

    const mutualUsers = await User.find({ _id: { $in: mutuals } })
        .select("name username profilePic headline")
        .limit(10);

    res.json({ success: true, mutuals: mutualUsers, count: mutuals.length });
};

// DELETE /api/connections/:userId
export const removeConnection = async (req, res) => {
    const { userId } = req.params;
    await Connection.findOneAndDelete({
        $or: [
            { sender: req.user._id, recipient: userId },
            { sender: userId, recipient: req.user._id },
        ],
        status: "accepted",
    });
    await User.findByIdAndUpdate(req.user._id, { $pull: { connections: userId } });
    await User.findByIdAndUpdate(userId,        { $pull: { connections: req.user._id } });
    res.json({ success: true, message: "Connection removed" });
};