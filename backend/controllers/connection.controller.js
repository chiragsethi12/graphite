import Connection from "../models/Connection.model.js";
import User from "../models/User.model.js";
import Notification from "../models/Notification.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const sendRequest = async (req, res) => {
    const { recipientId } = req.params;
    if (recipientId === req.user._id.toString())
        return res.status(400).json({ success: false, message: "Cannot connect with yourself" });

    const existing = await Connection.findOne({
        $or: [
            { sender: req.user._id, recipient: recipientId },
            { sender: recipientId, recipient: req.user._id },
        ],
    });
    if (existing) return res.status(400).json({ success: false, message: "Request already exists" });

    const connection = await Connection.create({ sender: req.user._id, recipient: recipientId });

    const notification = await Notification.create({
        recipient: recipientId,
        sender: req.user._id,
        type: "connectionRequest",
        message: `${req.user.name} sent you a connection request`,
    });

    const socketId = getReceiverSocketId(recipientId);
    if (socketId) io.to(socketId).emit("newNotification", notification);

    res.status(201).json({ success: true, connection });
};

export const respondToRequest = async (req, res) => {
    const { connectionId } = req.params;
    const { action } = req.body;

    const connection = await Connection.findById(connectionId);
    if (!connection) return res.status(404).json({ success: false, message: "Request not found" });
    if (connection.recipient.toString() !== req.user._id.toString())
        return res.status(403).json({ success: false, message: "Not authorized" });

    if (action === "accept") {
        connection.status = "accepted";
        await connection.save();

        await User.findByIdAndUpdate(connection.sender, { $addToSet: { connections: connection.recipient } });
        await User.findByIdAndUpdate(connection.recipient, { $addToSet: { connections: connection.sender } });

        const notification = await Notification.create({
            recipient: connection.sender,
            sender: req.user._id,
            type: "connectionAccepted",
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

export const getConnections = async (req, res) => {
    const user = await User.findById(req.user._id).populate("connections", "name profilePic headline location");
    res.json({ success: true, connections: user.connections });
};

export const getPendingRequests = async (req, res) => {
    const requests = await Connection.find({ recipient: req.user._id, status: "pending" })
        .populate("sender", "name profilePic headline");
    res.json({ success: true, requests });
};

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
    await User.findByIdAndUpdate(userId, { $pull: { connections: req.user._id } });

    res.json({ success: true, message: "Connection removed" });
};