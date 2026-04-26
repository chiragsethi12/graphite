import User from "../models/User.model.js";
import generateToken from "../utils/generateToken.js";

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

    if (password.length < 6)
        return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });

    const exists = await User.findOne({ email });
    if (exists)
        return res.status(400).json({ success: false, message: "Email already registered" });

    let finalUsername;

    if (username) {
        const clean = username.toLowerCase().replace(/[^a-z0-9_-]/g, "");
        const taken = await User.exists({ username: clean });
        if (taken)
            return res.status(400).json({ success: false, message: "Username already taken" });
        finalUsername = clean;
    } else {
        finalUsername = await generateUsername(name);
    }

    const user = await User.create({ name, email, password, username: finalUsername });
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

    const user = await User.findOne({ email });
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