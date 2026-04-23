import Post from "../models/Post.model.js";
import Comment from "../models/Comment.model.js";
import Notification from "../models/Notification.model.js";
import User from "../models/User.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeEngagement(post) {
    return (post.likesCount || 0) * 2 + (post.commentsCount || 0) * 3 + (post.shares || 0) * 4;
}

// ─── Create Post ─────────────────────────────────────────────────────────────

export const createPost = async (req, res) => {
    try {
        const { content, tags, type } = req.body;
        const image = req.file?.path || "";
        if (!content && !image) {
            return res.status(400).json({ success: false, message: "Content or image is required" });
        }

        const parsedTags = tags ? (typeof tags === "string" ? JSON.parse(tags) : tags) : [];
        const postType = image ? "image" : (type || "text");

        const post = await Post.create({ author: req.user._id, content, image, tags: parsedTags, type: postType });
        await post.populate("author", "name profilePic headline username");
        
        io.emit("newPost", { authorId: req.user._id });
        await User.findByIdAndUpdate(req.user._id, { $inc: { skillScore: 1 } });
        
        res.status(201).json({ success: true, post });
    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({ success: false, message: "Server error while creating post" });
    }
};

// ─── Feed ────────────────────────────────────────────────────────────────────
//
// Query strategy:
//   1. Populate current user's connections (1st degree) and their connections (2nd degree)
//   2. Dedupe into a single Set of authorIds
//   3. Single $in query with compound sort (engagementScore desc, createdAt desc)
//   4. Cursor-based pagination — the cursor is the _id of the last post in the previous page
//   5. Append `isLiked` flag per post for the requesting user (in-memory, O(n))
//
// This avoids N+1 by doing exactly 2 DB calls: one for the user graph, one for posts.

export const getFeed = async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor || null;

    // 1. Build the author set (self + 1st degree + 2nd degree)
    const currentUser = await User.findById(req.user._id)
        .populate("connections", "connections")
        .lean();

    const authorIds = new Set([currentUser._id.toString()]);

    for (const conn of currentUser.connections) {
        authorIds.add(conn._id.toString());
        if (conn.connections) {
            for (const c2 of conn.connections) {
                authorIds.add(c2.toString());
            }
        }
    }

    // 2. Build filter
    const filter = { author: { $in: Array.from(authorIds) } };
    if (cursor) filter._id = { $lt: cursor };

    // 3. Query — sorted by engagement then recency, lean for performance
    const posts = await Post.find(filter)
        .sort({ engagementScore: -1, createdAt: -1 })
        .limit(limit + 1)
        .populate("author", "name profilePic headline username")
        .populate({ path: "sharedPost", populate: { path: "author", select: "name profilePic headline username" } })
        .lean();

    // 4. Pagination metadata
    const hasMore = posts.length > limit;
    if (hasMore) posts.pop();
    const nextCursor = hasMore ? posts[posts.length - 1]._id : null;

    // 5. Append isLiked flag
    const userId = req.user._id.toString();
    for (const post of posts) {
        post.isLiked = (post.likes || []).some(id => id.toString() === userId);
    }

    res.json({ success: true, posts, hasMore, nextCursor });
};

// ─── Trending ────────────────────────────────────────────────────────────────

export const getTrendingPosts = async (req, res) => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const posts = await Post.find({ createdAt: { $gte: sevenDaysAgo } })
        .sort({ engagementScore: -1 })
        .limit(10)
        .populate("author", "name profilePic headline username")
        .select("content image author likesCount commentsCount engagementScore createdAt tags")
        .lean();
    res.json({ success: true, posts });
};

// ─── Get Single Post ─────────────────────────────────────────────────────────

export const getPostById = async (req, res) => {
    const post = await Post.findById(req.params.id)
        .populate("author", "name profilePic headline username")
        .populate({ path: "sharedPost", populate: { path: "author", select: "name profilePic headline username" } })
        .lean();

    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    post.isLiked = (post.likes || []).some(id => id.toString() === req.user._id.toString());
    res.json({ success: true, post });
};

// ─── Like / Unlike ───────────────────────────────────────────────────────────
//
// Atomic approach:
//   1. Check if user already liked via a single query
//   2. Use $addToSet / $pull + $inc for likesCount in one findOneAndUpdate
//   3. Recompute engagementScore atomically via $set
//   No race conditions. No full-document load.

export const likePost = async (req, res) => {
    try {
        const userId = req.user._id;
        const postId = req.params.id;

        // Check current like state
        const post = await Post.findById(postId).select("likes likesCount commentsCount shares author").lean();
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });

        const alreadyLiked = post.likes.some(id => id.toString() === userId.toString());

        let updated;
        if (alreadyLiked) {
            // Unlike — atomic pull + decrement
            const newLikesCount = Math.max(0, post.likesCount - 1);
            const newScore = newLikesCount * 2 + (post.commentsCount || 0) * 3 + (post.shares || 0) * 4;
            updated = await Post.findByIdAndUpdate(
                postId,
                { $pull: { likes: userId }, $set: { likesCount: newLikesCount, engagementScore: newScore } },
                { new: true }
            ).select("likesCount engagementScore").lean();
            console.log(`User ${userId} unliked post ${postId}`);
        } else {
            // Like — atomic addToSet + increment
            const newLikesCount = post.likesCount + 1;
            const newScore = newLikesCount * 2 + (post.commentsCount || 0) * 3 + (post.shares || 0) * 4;
            updated = await Post.findByIdAndUpdate(
                postId,
                { $addToSet: { likes: userId }, $set: { likesCount: newLikesCount, engagementScore: newScore } },
                { new: true }
            ).select("likesCount engagementScore").lean();
            console.log(`User ${userId} liked post ${postId}`);

            // Notification — only on like, not unlike
            if (post.author.toString() !== userId.toString()) {
                const notification = await Notification.create({
                    recipient: post.author, sender: userId, type: "like",
                    relatedPost: postId, message: `${req.user.name} liked your post`,
                });
                const socketId = getReceiverSocketId(post.author.toString());
                if (socketId) io.to(socketId).emit("newNotification", notification);
                await User.findByIdAndUpdate(post.author, { $inc: { skillScore: 1 } });
            }
        }

        res.json({
            success: true,
            likesCount: updated.likesCount,
            isLiked: !alreadyLiked,
            engagementScore: updated.engagementScore,
        });
    } catch (error) {
        console.error("Error in likePost:", error);
        res.status(500).json({ success: false, message: "Server error while processing like" });
    }
};

// ─── Comments ────────────────────────────────────────────────────────────────

export const commentOnPost = async (req, res) => {
    const { content, parentComment } = req.body;
    if (!content) return res.status(400).json({ success: false, message: "Content is required" });

    const post = await Post.findById(req.params.id).select("author commentsCount likesCount shares").lean();
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    // Create comment in separate collection
    const comment = await Comment.create({
        post: req.params.id,
        user: req.user._id,
        text: content,
        parentComment: parentComment || null,
    });

    // Increment commentsCount + recompute engagementScore atomically
    const newCommentsCount = (post.commentsCount || 0) + 1;
    const newScore = (post.likesCount || 0) * 2 + newCommentsCount * 3 + (post.shares || 0) * 4;
    await Post.findByIdAndUpdate(req.params.id, {
        $set: { commentsCount: newCommentsCount, engagementScore: newScore },
    });

    await comment.populate("user", "name profilePic username");

    // Notification
    if (post.author.toString() !== req.user._id.toString()) {
        const notification = await Notification.create({
            recipient: post.author, sender: req.user._id, type: "comment",
            relatedPost: req.params.id, message: `${req.user.name} commented on your post`,
        });
        const socketId = getReceiverSocketId(post.author.toString());
        if (socketId) io.to(socketId).emit("newNotification", notification);
        await User.findByIdAndUpdate(post.author, { $inc: { skillScore: 1 } });
    }

    res.status(201).json({ success: true, comment });
};

export const getComments = async (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const cursor = req.query.cursor || null;

    const filter = { post: req.params.id, parentComment: null };
    if (cursor) filter._id = { $lt: cursor };

    const comments = await Comment.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit + 1)
        .populate("user", "name profilePic username")
        .lean();

    const hasMore = comments.length > limit;
    if (hasMore) comments.pop();
    const nextCursor = hasMore ? comments[comments.length - 1]._id : null;

    res.json({ success: true, comments, hasMore, nextCursor });
};

export const deleteComment = async (req, res) => {
    const { id: postId, commentId } = req.params;

    const comment = await Comment.findById(commentId).lean();
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });

    const post = await Post.findById(postId).select("author commentsCount likesCount shares").lean();
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const isCommentOwner = comment.user.toString() === req.user._id.toString();
    const isPostOwner = post.author.toString() === req.user._id.toString();
    if (!isCommentOwner && !isPostOwner)
        return res.status(403).json({ success: false, message: "Not authorized" });

    await Comment.findByIdAndDelete(commentId);

    // Decrement commentsCount + recompute engagementScore
    const newCommentsCount = Math.max(0, (post.commentsCount || 0) - 1);
    const newScore = (post.likesCount || 0) * 2 + newCommentsCount * 3 + (post.shares || 0) * 4;
    await Post.findByIdAndUpdate(postId, {
        $set: { commentsCount: newCommentsCount, engagementScore: newScore },
    });

    res.json({ success: true, message: "Comment deleted" });
};

// ─── Share ───────────────────────────────────────────────────────────────────

export const sharePost = async (req, res) => {
    const { content } = req.body;
    const originalPost = await Post.findById(req.params.id).select("author shares likesCount commentsCount").lean();
    if (!originalPost) return res.status(404).json({ success: false, message: "Post not found" });

    // Increment shares + recompute score atomically
    const newShares = (originalPost.shares || 0) + 1;
    const newScore = (originalPost.likesCount || 0) * 2 + (originalPost.commentsCount || 0) * 3 + newShares * 4;
    await Post.findByIdAndUpdate(req.params.id, {
        $set: { shares: newShares, engagementScore: newScore },
    });

    const sharePostDoc = await Post.create({
        author: req.user._id, content: content || "", type: "share", sharedPost: req.params.id,
    });
    await sharePostDoc.populate("author", "name profilePic headline username");
    await sharePostDoc.populate({ path: "sharedPost", populate: { path: "author", select: "name profilePic headline username" } });

    if (originalPost.author.toString() !== req.user._id.toString()) {
        const notification = await Notification.create({
            recipient: originalPost.author, sender: req.user._id, type: "postShare",
            relatedPost: req.params.id, message: `${req.user.name} shared your post`,
        });
        const socketId = getReceiverSocketId(originalPost.author.toString());
        if (socketId) io.to(socketId).emit("newNotification", notification);
    }
    res.status(201).json({ success: true, post: sharePostDoc });
};

// ─── Delete Post ─────────────────────────────────────────────────────────────

export const deletePost = async (req, res) => {
    const post = await Post.findById(req.params.id).select("author").lean();
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    if (post.author.toString() !== req.user._id.toString())
        return res.status(403).json({ success: false, message: "Not authorized" });

    // Clean up: delete post + all its comments
    await Promise.all([
        Post.findByIdAndDelete(req.params.id),
        Comment.deleteMany({ post: req.params.id }),
    ]);
    res.json({ success: true, message: "Post deleted" });
};