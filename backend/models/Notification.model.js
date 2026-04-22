import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        type: {
            type: String,
            enum: ["like", "comment", "connectionRequest", "connectionAccepted", "jobUpdate"],
            required: true,
        },
        message: { type: String },
        relatedPost: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
        read: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);