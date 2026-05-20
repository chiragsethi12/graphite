import crypto from "crypto";
import User from "../models/User.model.js";
import generateToken from "../utils/generateToken.js";
import sendEmail, { buildResetEmail } from "../utils/sendEmail.js";

/**
 * Generate a URL-safe username from a display name.
 * e.g. "John Doe" → "john-doe-a3f2"
 * The random suffix prevents collisions.
 */
const generateUsername = async (name) => {
    const base = name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 28);

    let username;
    let exists = true;

    while (exists) {
        const suffix = Math.random().toString(36).slice(2, 6); // 4 random chars
        username = `${base}-${suffix}`;
        exists = await User.exists({ username });
    }

    return username;
};

// GET /api/auth/check-username?username=QUERY  (PUBLIC)
export const checkUsernameAvailability = async (req, res) => {
    const { username } = req.query;

    if (!username || username.length < 3)
        return res.status(400).json({ available: false, message: "Username must be at least 3 characters" });

    const clean = username.toLowerCase().replace(/[^a-z0-9_-]/g, "");

    if (!clean)
        return res.status(400).json({ available: false, message: "Invalid username format" });

    const exists = await User.exists({ username: clean });

    res.json({
        available: !exists,
        username: clean,
        message: exists ? "Username is taken" : "Username is available",
    });
};

// POST /api/auth/register
export const register = async (req, res) => {
    const { name, email, password, username } = req.body;

    if (!name || !email || !password)
        return res.status(400).json({ success: false, message: "All fields are required" });

    if (name.trim().length < 2)
        return res.status(400).json({ success: false, message: "Name must be at least 2 characters" });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return res.status(400).json({ success: false, message: "Please enter a valid email address" });

    if (password.length < 6)
        return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });

    if (password.length > 128)
        return res.status(400).json({ success: false, message: "Password is too long" });

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    const exists = await User.findOne({ email: cleanEmail });
    if (exists)
        return res.status(400).json({ success: false, message: "Email already registered" });

    let finalUsername;

    if (username) {
        const clean = username.toLowerCase().replace(/[^a-z0-9_-]/g, "");
        if (clean.length < 3)
            return res.status(400).json({ success: false, message: "Username must be at least 3 characters" });
        if (clean.length > 30)
            return res.status(400).json({ success: false, message: "Username must be under 30 characters" });
        
        const taken = await User.exists({ username: clean });
        if (taken)
            return res.status(400).json({ success: false, message: "Username already taken" });
        finalUsername = clean;
    } else {
        finalUsername = await generateUsername(cleanName);
    }

    const user = await User.create({ name: cleanName, email: cleanEmail, password, username: finalUsername });
    const token = generateToken(user._id);

    res.status(201).json({
        success: true,
        token,
        user: {
            _id:        user._id,
            name:       user.name,
            username:   user.username,
            email:      user.email,
            profilePic: user.profilePic,
            headline:   user.headline,
        },
    });
};

// POST /api/auth/login
export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password)
        return res.status(400).json({ success: false, message: "All fields are required" });

    if (password.length > 128)
        return res.status(400).json({ success: false, message: "Invalid credentials" });

    const cleanEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: cleanEmail });
    if (!user || !(await user.matchPassword(password)))
        return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = generateToken(user._id);

    res.json({
        success: true,
        token,
        user: {
            _id:        user._id,
            name:       user.name,
            username:   user.username,
            email:      user.email,
            profilePic: user.profilePic,
            headline:   user.headline,
        },
    });
};

// GET /api/auth/me
export const getMe = async (req, res) => {
    // req.user is populated by protect middleware (no password)
    res.json({ success: true, user: req.user });
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email)
        return res.status(400).json({ success: false, message: "Email is required" });

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    // Always return success to avoid leaking whether an email is registered
    if (!user) {
        return res.json({
            success: true,
            message: "If an account with that email exists, a reset link has been sent.",
        });
    }

    // Generate a raw token and hash it for storage
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateModifiedOnly: true });

    // Build the reset URL (raw token goes in the email, hashed version in DB)
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

    try {
        await sendEmail({
            to: user.email,
            subject: "Reset your Graphite password",
            html: buildResetEmail(user.name, resetUrl),
        });
    } catch (err) {
        // If email fails, clear the token so the user can retry
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save({ validateModifiedOnly: true });
        console.error("Email send error:", err);
        return res.status(500).json({ success: false, message: "Failed to send reset email. Please try again." });
    }

    res.json({
        success: true,
        message: "If an account with that email exists, a reset link has been sent.",
    });
};

// POST /api/auth/reset-password/:token
export const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6)
        return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });

    if (password.length > 128)
        return res.status(400).json({ success: false, message: "Password is too long" });

    // Hash the incoming raw token to compare with the stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
        return res.status(400).json({ success: false, message: "Invalid or expired reset token" });

    // Update password (pre-save hook will hash it)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Password reset successful. You can now sign in." });
};