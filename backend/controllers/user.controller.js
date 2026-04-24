import User from "../models/User.model.js";
import Post from "../models/Post.model.js";
import bcrypt from "bcryptjs";

// ─── GET /api/users/:identifier ─────────────────────────────────────────────
// Accepts both MongoDB _id AND username
export const getUserProfile = async (req, res) => {
    const { identifier } = req.params;

    // Determine if it's an ObjectId or a username
    const isObjectId = /^[a-f\d]{24}$/i.test(identifier);
    const query = isObjectId ? { _id: identifier } : { username: identifier };

    const user = await User.findOne(query)
        .select("-password -resetPasswordToken -resetPasswordExpires")
        .populate("connections", "name profilePic headline username location");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Increment profileViews atomically (only for other users viewing)
    if (req.user._id.toString() !== user._id.toString()) {
        await User.findByIdAndUpdate(user._id, { $inc: { profileViews: 1 } });
    }

    res.json({ success: true, user });
};

// ─── GET /api/users/:userId/posts ────────────────────────────────────────────
export const getUserPosts = async (req, res) => {
    const { userId } = req.params;
    const page  = parseInt(req.query.page) || 1;
    const limit = 12;

    const posts = await Post.find({ author: userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("author", "name profilePic headline username");

    const total = await Post.countDocuments({ author: userId });

    res.json({ success: true, posts, total, page, pages: Math.ceil(total / limit) });
};

// ─── GET /api/users/:userId/stats ────────────────────────────────────────────
export const getUserStats = async (req, res) => {
    const { userId } = req.params;

    const [user, postCount] = await Promise.all([
        User.findById(userId).select("connections profileViews skillScore"),
        Post.countDocuments({ author: userId }),
    ]);

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({
        success: true,
        stats: {
            connectionCount: user.connections.length,
            profileViews:    user.profileViews,
            skillScore:      user.skillScore,
            postCount,
        },
    });
};

// ─── GET /api/users/search ────────────────────────────────────────────────────
// Query params: q, skills, location, company, experience, page
export const searchUsers = async (req, res) => {
    const { q, skills, location, company, experience } = req.query;
    const page  = parseInt(req.query.page) || 1;
    const limit = 12;

    const filter = { _id: { $ne: req.user._id }, isPublic: true };

    if (q && q.trim()) {
        // Use full-text search index for score-ranked results
        filter.$text = { $search: q.trim() };
    }

    if (skills) {
        const skillArr = skills.split(",").map((s) => s.trim()).filter(Boolean);
        if (skillArr.length) filter.skills = { $in: skillArr.map((s) => new RegExp(s, "i")) };
    }

    if (location) {
        filter.location = { $regex: location.trim(), $options: "i" };
    }

    if (company) {
        // Search inside experience.company (nested array field)
        filter["experience.company"] = { $regex: company.trim(), $options: "i" };
    }

    // Build the query
    let query = User.find(filter).select("name username profilePic headline location skills experience connections");

    // If full-text, sort by text score; otherwise sort by skillScore
    if (q && q.trim()) {
        query = query.sort({ score: { $meta: "textScore" } });
    } else {
        query = query.sort({ skillScore: -1, createdAt: -1 });
    }

    const [users, total] = await Promise.all([
        query.skip((page - 1) * limit).limit(limit),
        User.countDocuments(filter),
    ]);

    // Attach connection status for each result
    const Connection = (await import("../models/Connection.model.js")).default;
    const myConnIds  = new Set(req.user.connections.map((c) => c.toString()));

    const pendingOut = await Connection.find({
        sender: req.user._id,
        recipient: { $in: users.map((u) => u._id) },
        status: "pending",
    }).select("recipient");

    const pendingOutSet = new Set(pendingOut.map((c) => c.recipient.toString()));

    const pendingIn = await Connection.find({
        recipient: req.user._id,
        sender: { $in: users.map((u) => u._id) },
        status: "pending",
    }).select("sender");

    const pendingInSet = new Set(pendingIn.map((c) => c.sender.toString()));

    const results = users.map((u) => {
        const uid = u._id.toString();
        let connectionStatus = "none";
        if (myConnIds.has(uid))        connectionStatus = "connected";
        else if (pendingOutSet.has(uid)) connectionStatus = "pending_sent";
        else if (pendingInSet.has(uid))  connectionStatus = "pending_received";

        return { ...u.toObject(), connectionStatus };
    });

    res.json({ success: true, users: results, total, page, pages: Math.ceil(total / limit) });
};

// ─── GET /api/users/suggestions ──────────────────────────────────────────────
// Smart recommendations: mutual connections + shared skills + same location
export const getRecommendedUsers = async (req, res) => {
    const me = await User.findById(req.user._id).select("connections skills location");

    const myConnIds = me.connections.map((id) => id.toString());
    const excludeIds = [...myConnIds, req.user._id.toString()];

    // Get 2nd-degree connections: people my connections are connected to
    const friendsOfFriends = await User.find({
        _id: { $in: me.connections },
    }).select("connections");

    const fofIds = new Set();
    friendsOfFriends.forEach((friend) => {
        friend.connections.forEach((id) => {
            const sid = id.toString();
            if (!excludeIds.includes(sid)) fofIds.add(sid);
        });
    });

    // Fetch candidates: FoF first, then fill remainder with skill-matched users
    let candidates = await User.find({
        _id: { $nin: excludeIds },
        isPublic: true,
    })
        .select("name username profilePic headline location skills connections")
        .limit(30);

    // Score each candidate
    const mySkillSet  = new Set((me.skills || []).map((s) => s.toLowerCase()));
    const myLocation  = (me.location || "").toLowerCase();

    const scored = candidates.map((u) => {
        const uid = u._id.toString();

        // Mutual connections = how many of my connections are connected to this user
        const mutualCount = u.connections.filter((id) => myConnIds.includes(id.toString())).length;

        // Shared skills
        const sharedSkills = (u.skills || []).filter((s) => mySkillSet.has(s.toLowerCase())).length;

        // Same location bonus
        const locationMatch = myLocation && u.location?.toLowerCase().includes(myLocation) ? 1 : 0;

        const score = mutualCount * 10 + sharedSkills * 5 + locationMatch * 3;

        return { user: u, score, mutualCount, sharedSkills };
    });

    // Sort by score descending, take top 8
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 8);

    const results = top.map(({ user, mutualCount, sharedSkills }) => ({
        ...user.toObject(),
        mutualCount,
        sharedSkills,
    }));

    res.json({ success: true, users: results });
};

// ─── PUT /api/users/update ───────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
    const allowed = ["name", "headline", "about", "location", "website", "skills", "interests", "experience", "education", "username"];
    const updateData = {};

    allowed.forEach((field) => {
        if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });

    // JSON fields sent as strings from FormData
    ["skills", "interests", "experience", "education"].forEach((field) => {
        if (typeof updateData[field] === "string") {
            try { updateData[field] = JSON.parse(updateData[field]); } catch { /* ignore */ }
        }
    });

    if (req.files?.profilePic) updateData.profilePic = req.files.profilePic[0].path;
    if (req.files?.bannerPic)  updateData.bannerPic  = req.files.bannerPic[0].path;

    // Username uniqueness check
    if (updateData.username) {
        const existing = await User.findOne({ username: updateData.username, _id: { $ne: req.user._id } });
        if (existing) return res.status(400).json({ success: false, message: "Username already taken" });
        updateData.username = updateData.username.toLowerCase().replace(/[^a-z0-9-]/g, "");
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
        new:          true,
        runValidators: true,
    }).select("-password -resetPasswordToken -resetPasswordExpires");

    res.json({ success: true, user });
};

// ─── PUT /api/users/change-password ─────────────────────────────────────────
export const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
        return res.status(400).json({ success: false, message: "Both fields are required" });

    if (newPassword.length < 6)
        return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });

    const user = await User.findById(req.user._id);
    const valid = await user.matchPassword(currentPassword);
    if (!valid) return res.status(400).json({ success: false, message: "Current password is incorrect" });

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
};

// ─── PUT /api/users/privacy ──────────────────────────────────────────────────
export const updatePrivacy = async (req, res) => {
    const { isPublic, emailNotifications } = req.body;
    const updates = {};
    if (isPublic !== undefined)            updates.isPublic            = Boolean(isPublic);
    if (emailNotifications !== undefined)  updates.emailNotifications  = Boolean(emailNotifications);

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true })
        .select("-password");

    res.json({ success: true, user });
};