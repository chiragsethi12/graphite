import User from "../models/User.model.js";
import Post from "../models/Post.model.js";
import bcrypt from "bcryptjs";

// ─── GET /api/users/:identifier ─────────────────────────────────────────────
export const getUserProfile = async (req, res) => {
    const { identifier } = req.params;
    const isObjectId = /^[a-f\d]{24}$/i.test(identifier);
    const query = isObjectId ? { _id: identifier } : { username: identifier };

    const user = await User.findOne(query)
        .select("-password -resetPasswordToken -resetPasswordExpires")
        .populate("connections", "name profilePic headline username location")
        .populate("profileViewHistory.viewerId", "name profilePic username");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (req.user._id.toString() !== user._id.toString()) {
        // Remove previous view from this user to prevent spam
        await User.findByIdAndUpdate(user._id, { 
            $inc: { profileViews: 1 },
            $pull: { profileViewHistory: { viewerId: req.user._id } }
        });
        
        // Push new view to front/back and keep last 100
        await User.findByIdAndUpdate(user._id, {
            $push: {
                profileViewHistory: {
                    $each: [{ viewerId: req.user._id, viewedAt: new Date() }],
                    $slice: -100
                }
            }
        });
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
export const searchUsers = async (req, res) => {
    const { q, skills, location, company } = req.query;
    const page  = parseInt(req.query.page) || 1;
    const limit = 12;

    const baseFilter = { _id: { $ne: req.user._id }, isPublic: { $ne: false } };

    if (skills) {
        const skillArr = skills.split(",").map((s) => s.trim()).filter(Boolean);
        if (skillArr.length) baseFilter.skills = { $in: skillArr.map((s) => new RegExp(s, "i")) };
    }
    if (location) baseFilter.location = { $regex: location.trim(), $options: "i" };
    if (company)  baseFilter["experience.company"] = { $regex: company.trim(), $options: "i" };

    let users = [];
    let total = 0;
    const selectFields = "name username profilePic headline location skills experience connections";

    if (q && q.trim()) {
        const trimmed = q.trim();
        const textFilter = { ...baseFilter, $text: { $search: trimmed } };
        const regexFilter = {
            ...baseFilter,
            $or: [
                { username: { $regex: trimmed, $options: "i" } },
                { name: { $regex: trimmed, $options: "i" } },
            ],
        };

        const [textResults, regexResults] = await Promise.all([
            User.find(textFilter).sort({ score: { $meta: "textScore" } }).limit(limit * 2).select(selectFields).catch(() => []),
            User.find(regexFilter).sort({ skillScore: -1, createdAt: -1 }).limit(limit * 2).select(selectFields),
        ]);

        const seen = new Set();
        const merged = [];
        for (const u of textResults) { const uid = u._id.toString(); if (!seen.has(uid)) { seen.add(uid); merged.push(u); } }
        for (const u of regexResults) { const uid = u._id.toString(); if (!seen.has(uid)) { seen.add(uid); merged.push(u); } }

        total = merged.length;
        users = merged.slice((page - 1) * limit, page * limit);
    } else {
        const [filteredUsers, filteredTotal] = await Promise.all([
            User.find(baseFilter).sort({ skillScore: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).select(selectFields),
            User.countDocuments(baseFilter),
        ]);
        users = filteredUsers;
        total = filteredTotal;
    }

    const Connection = (await import("../models/Connection.model.js")).default;
    const myConnIds  = new Set(req.user.connections.map((c) => c.toString()));
    const pendingOut = await Connection.find({ sender: req.user._id, recipient: { $in: users.map((u) => u._id) }, status: "pending" }).select("recipient");
    const pendingOutSet = new Set(pendingOut.map((c) => c.recipient.toString()));
    const pendingIn = await Connection.find({ recipient: req.user._id, sender: { $in: users.map((u) => u._id) }, status: "pending" }).select("sender");
    const pendingInSet = new Set(pendingIn.map((c) => c.sender.toString()));

    const results = users.map((u) => {
        const uid = u._id.toString();
        let connectionStatus = "none";
        if (myConnIds.has(uid)) connectionStatus = "connected";
        else if (pendingOutSet.has(uid)) connectionStatus = "pending_sent";
        else if (pendingInSet.has(uid)) connectionStatus = "pending_received";
        return { ...u.toObject(), connectionStatus };
    });

    res.json({ success: true, users: results, total, page, pages: Math.ceil(total / limit) });
};

// ─── GET /api/users/suggestions ──────────────────────────────────────────────
export const getRecommendedUsers = async (req, res) => {
    const me = await User.findById(req.user._id).select("connections skills location");
    const myConnIds = me.connections.map((id) => id.toString());
    const excludeIds = [...myConnIds, req.user._id.toString()];

    const friendsOfFriends = await User.find({ _id: { $in: me.connections } }).select("connections");
    const fofIds = new Set();
    friendsOfFriends.forEach((friend) => {
        friend.connections.forEach((id) => {
            const sid = id.toString();
            if (!excludeIds.includes(sid)) fofIds.add(sid);
        });
    });

    let candidates = await User.find({ _id: { $nin: excludeIds }, isPublic: { $ne: false } })
        .select("name username profilePic headline location skills connections")
        .limit(30);

    const mySkillSet = new Set((me.skills || []).map((s) => s.toLowerCase()));
    const myLocation = (me.location || "").toLowerCase();

    const scored = candidates.map((u) => {
        const mutualCount = u.connections.filter((id) => myConnIds.includes(id.toString())).length;
        const sharedSkills = (u.skills || []).filter((s) => mySkillSet.has(s.toLowerCase())).length;
        const locationMatch = myLocation && u.location?.toLowerCase().includes(myLocation) ? 1 : 0;
        const score = mutualCount * 10 + sharedSkills * 5 + locationMatch * 3;
        return { user: u, score, mutualCount, sharedSkills };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 8);
    const results = top.map(({ user, mutualCount, sharedSkills }) => ({ ...user.toObject(), mutualCount, sharedSkills }));
    res.json({ success: true, users: results });
};

// ─── PUT /api/users/update ───────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
    const allowed = ["name", "headline", "about", "location", "website", "skills", "interests", "experience", "education", "username"];
    const updateData = {};

    allowed.forEach((field) => {
        if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });

    ["skills", "interests", "experience", "education"].forEach((field) => {
        if (typeof updateData[field] === "string") {
            try { updateData[field] = JSON.parse(updateData[field]); } catch { /* ignore */ }
        }
    });

    if (req.files?.profilePic) {
        updateData.profilePic = req.files.profilePic[0].path;
    } else if (req.body.profilePic === "") {
        updateData.profilePic = "";
    }

    if (req.files?.bannerPic) {
        updateData.bannerPic = req.files.bannerPic[0].path;
    } else if (req.body.bannerPic === "") {
        updateData.bannerPic = "";
    }

    if (updateData.username) {
        const existing = await User.findOne({ username: updateData.username, _id: { $ne: req.user._id } });
        if (existing) return res.status(400).json({ success: false, message: "Username already taken" });
        updateData.username = updateData.username.toLowerCase().replace(/[^a-z0-9-]/g, "");
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true })
        .select("-password -resetPasswordToken -resetPasswordExpires");

    res.json({ success: true, user });
};

// ─── PUT /api/users/change-password ─────────────────────────────────────────
export const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: "Both fields are required" });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });

    const user = await User.findById(req.user._id);
    const valid = await user.matchPassword(currentPassword);
    if (!valid) return res.status(400).json({ success: false, message: "Current password is incorrect" });

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: "Password updated successfully" });
};

// ─── PUT /api/users/privacy ──────────────────────────────────────────────────
export const updatePrivacy = async (req, res) => {
    const { isPublic, emailNotifications } = req.body;
    const updates = {};
    if (isPublic !== undefined) updates.isPublic = Boolean(isPublic);
    if (emailNotifications !== undefined) updates.emailNotifications = Boolean(emailNotifications);

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-password");
    res.json({ success: true, user });
};