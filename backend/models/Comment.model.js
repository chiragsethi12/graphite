import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
    {
        post:   { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
        user:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        text:   { type: String, required: true, trim: true, maxlength: 1200 },

        // Nested reply support (1 level) — null means top-level comment
        parentComment: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null },
    },
    { timestamps: true }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

// Fetch comments for a post, newest first
commentSchema.index({ post: 1, createdAt: -1 });

// Fetch replies to a specific comment
commentSchema.index({ parentComment: 1, createdAt: 1 });

// Prevent user from seeing deleted-post orphans (cleanup queries)
commentSchema.index({ post: 1, user: 1 });

export default mongoose.model("Comment", commentSchema);
