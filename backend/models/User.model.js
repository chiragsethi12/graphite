import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const experienceSchema = new mongoose.Schema({
    title:       { type: String, required: true, trim: true },
    company:     { type: String, required: true, trim: true },
    location:    { type: String, default: "" },
    startDate:   { type: String },
    endDate:     { type: String },          // null = "Present"
    current:     { type: Boolean, default: false },
    description: { type: String, default: "" },
});

const educationSchema = new mongoose.Schema({
    school:    { type: String, required: true, trim: true },
    degree:    { type: String, default: "" },
    field:     { type: String, default: "" },
    startYear: { type: String },
    endYear:   { type: String },
    grade:     { type: String, default: "" },
});

const userSchema = new mongoose.Schema(
    {
        name:       { type: String, required: true, trim: true },
        username:   { type: String, unique: true, lowercase: true, trim: true },
        email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
        password:   { type: String, required: true, minlength: 6 },

        // Profile content
        headline:   { type: String, default: "", maxlength: 220 },
        about:      { type: String, default: "", maxlength: 2600 },
        location:   { type: String, default: "" },
        website:    { type: String, default: "" },
        profilePic: { type: String, default: "" },
        bannerPic:  { type: String, default: "" },

        // Structured data
        skills:     [{ type: String, trim: true }],
        interests:  [{ type: String, trim: true }],
        experience: [experienceSchema],
        education:  [educationSchema],

        // Social graph
        connections: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

        // Stats & ranking
        profileViews: { type: Number, default: 0 },
        skillScore:   { type: Number, default: 0 },   // engagement-based score

        // Privacy & settings
        isPublic:        { type: Boolean, default: true },
        emailNotifications: { type: Boolean, default: true },

        // Password reset
        resetPasswordToken:   { type: String },
        resetPasswordExpires: { type: Date },
    },
    { timestamps: true }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

// Username lookup (unique constraint creates implicit index, explicit for clarity)
userSchema.index({ username: 1 });

// Full-text search: name + skills + headline + location
userSchema.index(
    { name: "text", skills: "text", headline: "text", location: "text" },
    { weights: { name: 10, skills: 8, headline: 4, location: 2 }, name: "user_text_search" }
);

// Location-based filtering
userSchema.index({ location: 1 });

// Skill-based ranking
userSchema.index({ skillScore: -1 });

// ─── Hooks ───────────────────────────────────────────────────────────────────

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// Auto-generate username from name if not provided (on first save only)
userSchema.pre("save", async function () {
    if (this.username) return;

    // Derive base slug from name: "John Doe" → "johndoe"
    const base = this.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 20);

    // Check for collisions and append random suffix if needed
    let candidate = base;
    let exists = await mongoose.model("User").findOne({ username: candidate });

    while (exists) {
        const suffix = Math.floor(Math.random() * 9000 + 1000); // 4-digit random
        candidate = `${base}${suffix}`;
        exists = await mongoose.model("User").findOne({ username: candidate });
    }

    this.username = candidate;
});

// ─── Methods ─────────────────────────────────────────────────────────────────

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toPublicJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    delete obj.resetPasswordToken;
    delete obj.resetPasswordExpires;
    return obj;
};

export default mongoose.model("User", userSchema);