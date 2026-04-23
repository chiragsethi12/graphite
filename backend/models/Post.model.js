import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
    {
        author:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, default: "", trim: true, maxlength: 3000 },
        image:   { type: String, default: "" },

        // Likes — array for membership checks, counter for sorting
        likes:      [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        likesCount: { type: Number, default: 0 },

        // Denormalized counter — incremented/decremented via $inc, never manually set
        commentsCount: { type: Number, default: 0 },

        shares: { type: Number, default: 0 },

        // Ranking score — recomputed atomically via $set in controller
        engagementScore: { type: Number, default: 0 },

        // Content metadata
        type: {
            type: String,
            enum: ["text", "image", "article", "share"],
            default: "text",
        },
        tags: [{ type: String, lowercase: true, trim: true }],

        // Share / repost
        sharedPost: { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null },
    },
    { timestamps: true }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

// Feed: filter by author set + sort by recency
postSchema.index({ author: 1, createdAt: -1 });

// Global timeline
postSchema.index({ createdAt: -1 });

// Feed sorted by engagement then recency
postSchema.index({ author: 1, engagementScore: -1, createdAt: -1 });

// Trending window
postSchema.index({ engagementScore: -1, createdAt: -1 });

// Like dedup: fast $addToSet / $pull membership check
postSchema.index({ _id: 1, likes: 1 });

// Full-text search
postSchema.index({ content: "text", tags: "text" }, { name: "post_text_search" });

export default mongoose.model("Post", postSchema);