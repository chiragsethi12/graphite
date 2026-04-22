import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        sender:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

        type: {
            type: String,
            enum: [
                "like",
                "comment",
                "commentLike",
                "connectionRequest",
                "connectionAccepted",
                "jobUpdate",
                "postShare",
                "mention",
            ],
            required: true,
        },

        message:     { type: String },
        relatedPost: { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null },
        relatedJob:  { type: mongoose.Schema.Types.ObjectId, ref: "Job",  default: null },
        read:        { type: Boolean, default: false },

        // Auto-delete READ notifications after 90 days to keep collection lean
        // MongoDB TTL index fires on this field
        readAt: { type: Date, default: null },
    },
    { timestamps: true }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

// Fast unread count + list fetch per user
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

// TTL: delete read notifications 90 days after they were read
notificationSchema.index(
    { readAt: 1 },
    { expireAfterSeconds: 90 * 24 * 60 * 60, partialFilterExpression: { read: true } }
);

export default mongoose.model("Notification", notificationSchema);