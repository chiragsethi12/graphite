import User from "../models/User.model.js";
import generateToken from "../utils/generateToken.js";

export const register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
        return res.status(400).json({ success: false, message: "All fields are required" });

    const exists = await User.findOne({ email });
    if (exists)
        return res.status(400).json({ success: false, message: "Email already registered" });

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    res.status(201).json({
        success: true,
        token,
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            profilePic: user.profilePic,
            headline: user.headline,
        },
    });
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
        return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = generateToken(user._id);

    res.json({
        success: true,
        token,
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            profilePic: user.profilePic,
            headline: user.headline,
        },
    });
};

export const getMe = async (req, res) => {
    res.json({ success: true, user: req.user });
};