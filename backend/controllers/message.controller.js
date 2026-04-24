import Message from "../models/Message.model.js";
import User from "../models/User.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

/**
 * GET /api/messages/conversations
 * Returns a list of distinct conversations for the authenticated user,
 * with the latest message and participant info for each.
 */
export const getConversations = async (req, res) => {
    const userId = req.user._id.toString();

    // Find all messages where user is sender or recipient
    const messages = await Message.aggregate([
        {
            $match: {
                $or: [{ sender: req.user._id }, { recipient: req.user._id }],
                deleted: false,
            },
        },
        // Sort newest first before grouping
        { $sort: { createdAt: -1 } },
        // Group by conversationId — keep only the most recent message per conversation
        {
            $group: {
                _id: "$conversationId",
                lastMessage: { $first: "$content" },
                lastMessageAt: { $first: "$createdAt" },
                lastSender: { $first: "$sender" },
                sender: { $first: "$sender" },
                recipient: { $first: "$recipient" },
                unread: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ["$recipient", req.user._id] },
                                    { $eq: ["$read", false] },
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
            },
        },
        { $sort: { lastMessageAt: -1 } },
    ]);

    if (!messages.length) {
        return res.json({ success: true, conversations: [] });
    }

    // Determine the "other" participant for each conversation
    const otherUserIds = messages.map((m) => {
        const senderId = m.sender.toString();
        const recipientId = m.recipient.toString();
        return senderId === userId ? m.recipient : m.sender;
    });

    const participants = await User.find({ _id: { $in: otherUserIds } })
        .select("name username profilePic headline");

    const participantMap = {};
    participants.forEach((p) => { participantMap[p._id.toString()] = p; });

    const conversations = messages.map((m) => {
        const senderId = m.sender.toString();
        const otherId = senderId === userId ? m.recipient.toString() : senderId;
        return {
            _id: m._id,
            participant: participantMap[otherId] || null,
            lastMessage: m.lastMessage,
            lastMessageAt: m.lastMessageAt,
            unread: m.unread,
        };
    });

    res.json({ success: true, conversations });
};

/**
 * GET /api/messages/:userId
 * Fetch message thread between current user and :userId.
 * Cursor-based pagination (cursor = oldest message _id seen).
 */
export const getMessages = async (req, res) => {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 30;
    const cursor = req.query.cursor || null;

    const conversationId = Message.getConversationId(req.user._id, userId);

    const filter = { conversationId, deleted: false };
    if (cursor) filter._id = { $lt: cursor };

    const messages = await Message.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit + 1)
        .populate("sender", "name username profilePic")
        .populate("recipient", "name username profilePic")
        .lean();

    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();
    const nextCursor = hasMore ? messages[messages.length - 1]._id : null;

    // Mark all unread messages from the other user as read
    await Message.updateMany(
        { conversationId, recipient: req.user._id, read: false },
        { $set: { read: true, readAt: new Date() } }
    );

    res.json({ success: true, messages: messages.reverse(), hasMore, nextCursor });
};

/**
 * POST /api/messages/:userId
 * Send a message to :userId.
 */
export const sendMessage = async (req, res) => {
    const { userId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
        return res.status(400).json({ success: false, message: "Message content is required" });
    }

    // Verify recipient exists
    const recipient = await User.findById(userId).select("_id");
    if (!recipient) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    const conversationId = Message.getConversationId(req.user._id, userId);

    const message = await Message.create({
        conversationId,
        sender: req.user._id,
        recipient: userId,
        content: content.trim(),
    });

    await message.populate("sender", "name username profilePic");
    await message.populate("recipient", "name username profilePic");

    // Emit real-time event to recipient
    const recipientSocketId = getReceiverSocketId(userId);
    if (recipientSocketId) {
        io.to(recipientSocketId).emit("newMessage", message);
    }

    res.status(201).json({ success: true, message });
};

/**
 * PUT /api/messages/:userId/read
 * Mark all messages from :userId as read.
 */
export const markConversationRead = async (req, res) => {
    const { userId } = req.params;
    const conversationId = Message.getConversationId(req.user._id, userId);

    await Message.updateMany(
        { conversationId, recipient: req.user._id, read: false },
        { $set: { read: true, readAt: new Date() } }
    );

    res.json({ success: true, message: "Marked as read" });
};

/**
 * DELETE /api/messages/:messageId
 * Soft-delete a message (only sender can delete).
 */
export const deleteMessage = async (req, res) => {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });

    if (message.sender.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "Not authorized" });
    }

    message.deleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.json({ success: true, message: "Message deleted" });
};