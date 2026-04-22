import mongoose from "mongoose";

const salarySchema = new mongoose.Schema(
    {
        min:      { type: Number },
        max:      { type: Number },
        currency: { type: String, default: "USD" },
        period:   { type: String, enum: ["hourly", "monthly", "yearly"], default: "yearly" },
    },
    { _id: false }
);

const jobSchema = new mongoose.Schema(
    {
        postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

        title:       { type: String, required: true, trim: true },
        company:     { type: String, required: true, trim: true },
        location:    { type: String, default: "" },
        description: { type: String, required: true },
        skills:      [{ type: String, trim: true }],
        benefits:    [{ type: String, trim: true }],

        type: {
            type: String,
            enum: ["full-time", "part-time", "remote", "internship", "contract"],
            default: "full-time",
        },

        experienceLevel: {
            type: String,
            enum: ["entry", "mid", "senior", "lead", "any"],
            default: "any",
        },

        salary:   { type: salarySchema, default: () => ({}) },
        deadline: { type: Date, default: null },
        isActive: { type: Boolean, default: true },

        applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

// Full-text search across title, company, description
jobSchema.index(
    { title: "text", company: "text", description: "text", skills: "text" },
    { weights: { title: 10, skills: 8, company: 5, description: 2 }, name: "job_text_search" }
);

// Filter by type and active status
jobSchema.index({ type: 1, isActive: 1, createdAt: -1 });

// Filter by experience level
jobSchema.index({ experienceLevel: 1, isActive: 1 });

// Filter by location
jobSchema.index({ location: 1, isActive: 1 });

// Listings by poster
jobSchema.index({ postedBy: 1, createdAt: -1 });

export default mongoose.model("Job", jobSchema);