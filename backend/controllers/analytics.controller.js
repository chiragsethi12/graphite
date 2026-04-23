import User from "../models/User.model.js";
import Post from "../models/Post.model.js";
import Connection from "../models/Connection.model.js";
import Notification from "../models/Notification.model.js";

/**
 * GET /api/analytics/me
 * Returns the current user's activity dashboard data.
 */
export const getMyAnalytics = async (req, res) => {
    const userId = req.user._id;
    const now    = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // ── Run all queries in parallel ──────────────────────────────
    const [user, posts, recentConnections, recentNotifications] = await Promise.all([
        User.findById(userId).select("profileViews skillScore skills connections createdAt"),

        Post.find({ author: userId })
            .sort({ createdAt: -1 })
            .limit(50)
            .select("content likesCount commentsCount shares engagementScore createdAt tags"),

        Connection.countDocuments({
            $or: [{ sender: userId }, { recipient: userId }],
            status: "accepted",
            updatedAt: { $gte: thirtyDaysAgo },
        }),

        Notification.countDocuments({
            recipient: userId,
            createdAt: { $gte: thirtyDaysAgo },
        }),
    ]);

    // ── Compute engagement stats ─────────────────────────────────
    let totalLikes    = 0;
    let totalComments = 0;
    let totalShares   = 0;

    const topPosts = [];

    posts.forEach((post) => {
        totalLikes    += post.likesCount || 0;
        totalComments += post.commentsCount || 0;
        totalShares   += post.shares;

        topPosts.push({
            _id:             post._id,
            content:         post.content.slice(0, 120),
            likes:           post.likesCount || 0,
            comments:        post.commentsCount || 0,
            shares:          post.shares,
            engagementScore: post.engagementScore,
            createdAt:       post.createdAt,
        });
    });

    // Sort by engagement score descending for "top posts"
    topPosts.sort((a, b) => b.engagementScore - a.engagementScore);

    // ── Skill leaders (how many users share each of your skills) ──
    const skillStats = [];
    if (user.skills.length > 0) {
        for (const skill of user.skills.slice(0, 10)) {
            const count = await User.countDocuments({
                skills: { $regex: new RegExp(`^${skill}$`, "i") },
            });
            skillStats.push({ skill, usersWithSkill: count });
        }
    }

    res.json({
        success: true,
        analytics: {
            profileViews:    user.profileViews,
            skillScore:      user.skillScore,
            connectionCount: user.connections.length,
            postCount:       posts.length,
            memberSince:     user.createdAt,

            engagement: {
                totalLikes,
                totalComments,
                totalShares,
                avgEngagementPerPost: posts.length > 0
                    ? Math.round((totalLikes + totalComments + totalShares) / posts.length * 10) / 10
                    : 0,
            },

            last30Days: {
                newConnections:  recentConnections,
                notifications:   recentNotifications,
            },

            topPosts: topPosts.slice(0, 5),
            skillStats,
        },
    });
};
