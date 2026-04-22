import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: true },
    },
    { timestamps: true }
);

const postSchema = new mongoose.Schema(
    {
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        content: { type: String, required: true },
        image: { type: String, default: "" },
        likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        comments: [commentSchema],
    },
    { timestamps: true }
);

export default mongoose.model("Post", postSchema);