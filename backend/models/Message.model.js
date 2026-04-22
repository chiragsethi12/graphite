import mongoose from "mongoose";

/**
 * Message model for direct messaging.
 * conversationId is a deterministic string: `${smallerId}_${largerId}`
 * Generated from sorted sender/recipient IDs — avoids a separate Conversation collection.
 */
const messageSchema = new mongoose.Schema(
    {
        conversationId: { type: String, required: true, index: true },
        sender:         { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        recipient:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        content:        { type: String, required: true, trim: true, maxlength: 2000 },
        read:           { type: Boolean, default: false },
        readAt:         { type: Date, default: null },
        deleted:        { type: Boolean, default: false },
        deletedAt:      { type: Date, default: null },
    },
    { timestamps: true }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

// Fetch conversation thread sorted newest first
messageSchema.index({ conversationId: 1, createdAt: -1 });

// Unread messages for a recipient
messageSchema.index({ recipient: 1, read: 1 });

// TTL: auto-remove soft-deleted messages after 30 days
messageSchema.index(
    { deletedAt: 1 },
    { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { deleted: true } }
);

/**
 * Helper: generate a stable conversationId from two user IDs.
 * Usage: Message.getConversationId(userId1, userId2)
 */
messageSchema.statics.getConversationId = function (id1, id2) {
    return [id1.toString(), id2.toString()].sort().join("_");
};

export default mongoose.model("Message", messageSchema);
