import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const experienceSchema = new mongoose.Schema({
    title: String,
    company: String,
    startDate: String,
    endDate: String,
    description: String,
});

const educationSchema = new mongoose.Schema({
    school: String,
    degree: String,
    field: String,
    startYear: String,
    endYear: String,
});

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true },
        password: { type: String, required: true, minlength: 6 },
        headline: { type: String, default: "" },
        bio: { type: String, default: "" },
        location: { type: String, default: "" },
        profilePic: { type: String, default: "" },
        bannerPic: { type: String, default: "" },
        skills: [{ type: String }],
        experience: [experienceSchema],
        education: [educationSchema],
        connections: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);