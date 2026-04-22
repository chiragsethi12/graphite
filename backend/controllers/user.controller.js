import User from "../models/User.model.js";
import cloudinary from "../config/cloudinary.js";

export const getUserProfile = async (req, res) => {
    const user = await User.findById(req.params.id).select("-password").populate("connections", "name profilePic headline");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
};

export const updateProfile = async (req, res) => {
    const { name, headline, bio, location, skills, experience, education } = req.body;

    const updateData = { name, headline, bio, location, skills, experience, education };

    if (req.files?.profilePic) {
        updateData.profilePic = req.files.profilePic[0].path;
    }
    if (req.files?.bannerPic) {
        updateData.bannerPic = req.files.bannerPic[0].path;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
        new: true,
        runValidators: true,
    }).select("-password");

    res.json({ success: true, user });
};

export const searchUsers = async (req, res) => {
    const { q } = req.query;
    const users = await User.find({
        $or: [
            { name: { $regex: q, $options: "i" } },
            { headline: { $regex: q, $options: "i" } },
        ],
        _id: { $ne: req.user._id },
    }).select("name profilePic headline location").limit(10);

    res.json({ success: true, users });
};

export const getRecommendedUsers = async (req, res) => {
    const currentUser = await User.findById(req.user._id).select("connections");
    const connectedIds = currentUser.connections.map((id) => id.toString());
    connectedIds.push(req.user._id.toString());

    const users = await User.find({ _id: { $nin: connectedIds } })
        .select("name profilePic headline location")
        .limit(6);

    res.json({ success: true, users });
};