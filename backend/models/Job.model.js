import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
    {
        postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        title: { type: String, required: true },
        company: { type: String, required: true },
        location: { type: String },
        type: { type: String, enum: ["full-time", "part-time", "remote", "internship"], default: "full-time" },
        description: { type: String, required: true },
        skills: [{ type: String }],
        applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true }
);

export default mongoose.model("Job", jobSchema);