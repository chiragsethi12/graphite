import User from "../models/User.model.js";
import Post from "../models/Post.model.js";
import Job from "../models/Job.model.js";

/**
 * GET /api/search?q=&type=all|users|jobs|posts&skills=&location=&company=&page=
 * Unified search endpoint — returns mixed results or filtered by type.
 */
export const search = async (req, res) => {
    const { q, type = "all", skills, location, company } = req.query;
    const page  = parseInt(req.query.page) || 1;
    const limit = 10;

    if (!q || !q.trim())
        return res.status(400).json({ success: false, message: "Search query is required" });

    const result = { users: [], jobs: [], posts: [] };

    // ── Users ────────────────────────────────────────────────────
    if (type === "all" || type === "users") {
        const userFilter = { _id: { $ne: req.user._id }, $text: { $search: q } };
        if (skills)   userFilter.skills   = { $in: skills.split(",").map((s) => new RegExp(s.trim(), "i")) };
        if (location) userFilter.location = { $regex: location.trim(), $options: "i" };
        if (company)  userFilter["experience.company"] = { $regex: company.trim(), $options: "i" };

        result.users = await User.find(userFilter)
            .sort({ score: { $meta: "textScore" } })
            .skip((page - 1) * limit)
            .limit(limit)
            .select("name username profilePic headline location skills");
    }

    // ── Jobs ─────────────────────────────────────────────────────
    if (type === "all" || type === "jobs") {
        const jobFilter = { isActive: true, $text: { $search: q } };
        result.jobs = await Job.find(jobFilter)
            .sort({ score: { $meta: "textScore" } })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate("postedBy", "name username profilePic")
            .select("title company location type experienceLevel salary createdAt");
    }

    // ── Posts ─────────────────────────────────────────────────────
    if (type === "all" || type === "posts") {
        const postFilter = { $text: { $search: q } };
        result.posts = await Post.find(postFilter)
            .sort({ score: { $meta: "textScore" } })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate("author", "name username profilePic headline")
            .select("content image author likesCount commentsCount createdAt tags");
    }

    res.json({ success: true, ...result, page });
};
