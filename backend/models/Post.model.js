import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
    {
        user:          { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        content:       { type: String, required: true, trim: true, maxlength: 1200 },
        likes:         [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        parentComment: { type: mongoose.Schema.Types.ObjectId, default: null }, // nested reply (1 level)
    },
    { timestamps: true }
);

const postSchema = new mongoose.Schema(
    {
        author:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: true, trim: true, maxlength: 3000 },
        image:   { type: String, default: "" },

        // Interaction counters
        likes:    [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        comments: [commentSchema],
        shares:   { type: Number, default: 0 },

        // Ranking — updated atomically on every like/comment/share
        // Formula: (likes.length * 2) + (comments.length * 3) + (shares * 4)
        // Decayed by time in the feed query via a sort expression
        engagementScore: { type: Number, default: 0 },

        // Content metadata
        type: {
            type: String,
            enum: ["text", "image", "article", "share"],
            default: "text",
        },
        tags:        [{ type: String, lowercase: true, trim: true }],

        // Share / repost
        sharedPost: { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null },
    },
    { timestamps: true }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

// Feed query: posts by author sorted newest first
postSchema.index({ author: 1, createdAt: -1 });

// Global feed / trending: all posts sorted newest first
postSchema.index({ createdAt: -1 });

// Trending posts sorted by engagement
postSchema.index({ engagementScore: -1, createdAt: -1 });

// Feed for a set of authors (connection feed): $in on author + sort by score
postSchema.index({ author: 1, engagementScore: -1 });

// Full-text search on posts
postSchema.index({ content: "text", tags: "text" }, { name: "post_text_search" });

// ─── Methods ─────────────────────────────────────────────────────────────────

/**
 * Recalculate and persist engagementScore.
 * Call after any like / comment / share change.
 */
postSchema.methods.recalcScore = function () {
    this.engagementScore =
        this.likes.length * 2 +
        this.comments.length * 3 +
        this.shares * 4;
};

export default mongoose.model("Post", postSchema);