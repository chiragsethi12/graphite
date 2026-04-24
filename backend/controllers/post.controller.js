import Post from "../models/Post.model.js";
import Comment from "../models/Comment.model.js";
import Notification from "../models/Notification.model.js";
import User from "../models/User.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

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

        const post = await Post.create({
            author: req.user._id,
            content: content || "",
            image,
            tags: parsedTags,
            type: postType,
        });

        await post.populate("author", "name profilePic headline username");

        // Notify first-degree connections of new post (live feed update)
        io.emit("newPost", { authorId: req.user._id });

        // Reward posting
        await User.findByIdAndUpdate(req.user._id, { $inc: { skillScore: 1 } });

        res.status(201).json({ success: true, post });
    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({ success: false, message: "Server error while creating post" });
    }
};

// ─── Feed ────────────────────────────────────────────────────────────────────

export const getFeed = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const cursor = req.query.cursor || null;

        // 1. Build author set: self + 1st degree + 2nd degree
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

        // 3. Query
        const posts = await Post.find(filter)
            .sort({ engagementScore: -1, createdAt: -1 })
            .limit(limit + 1)
            .populate("author", "name profilePic headline username")
            .populate({
                path: "sharedPost",
                populate: { path: "author", select: "name profilePic headline username" },
            })
            .lean();

        // 4. Pagination metadata
        const hasMore = posts.length > limit;
        if (hasMore) posts.pop();
        const nextCursor = hasMore ? posts[posts.length - 1]._id : null;

        // 5. Append isLiked flag
        const userId = req.user._id.toString();
        for (const post of posts) {
            post.isLiked = (post.likes || []).some((id) => id.toString() === userId);
        }

        res.json({ success: true, posts, hasMore, nextCursor });
    } catch (error) {
        console.error("Error getting feed:", error);
        res.status(500).json({ success: false, message: "Server error while fetching feed" });
    }
};

// ─── Trending ────────────────────────────────────────────────────────────────

export const getTrendingPosts = async (req, res) => {
    try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const posts = await Post.find({ createdAt: { $gte: sevenDaysAgo } })
            .sort({ engagementScore: -1 })
            .limit(10)
            .populate("author", "name profilePic headline username")
            .select("content image author likesCount commentsCount engagementScore createdAt tags")
            .lean();

        res.json({ success: true, posts });
    } catch (error) {
        console.error("Error getting trending posts:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ─── Get Single Post ─────────────────────────────────────────────────────────

export const getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate("author", "name profilePic headline username")
            .populate({
                path: "sharedPost",
                populate: { path: "author", select: "name profilePic headline username" },
            })
            .lean();

        if (!post) return res.status(404).json({ success: false, message: "Post not found" });

        post.isLiked = (post.likes || []).some((id) => id.toString() === req.user._id.toString());
        res.json({ success: true, post });
    } catch (error) {
        console.error("Error getting post:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ─── Like / Unlike ───────────────────────────────────────────────────────────

export const likePost = async (req, res) => {
    try {
        const userId = req.user._id;
        const postId = req.params.id;

        const post = await Post.findById(postId)
            .select("likes likesCount commentsCount shares author")
            .lean();

        if (!post) return res.status(404).json({ success: false, message: "Post not found" });

        const alreadyLiked = post.likes.some((id) => id.toString() === userId.toString());

        let updated;
        if (alreadyLiked) {
            const newLikesCount = Math.max(0, post.likesCount - 1);
            const newScore = newLikesCount * 2 + (post.commentsCount || 0) * 3 + (post.shares || 0) * 4;
            updated = await Post.findByIdAndUpdate(
                postId,
                {
                    $pull: { likes: userId },
                    $set: { likesCount: newLikesCount, engagementScore: newScore },
                },
                { new: true }
            ).select("likesCount engagementScore").lean();
        } else {
            const newLikesCount = post.likesCount + 1;
            const newScore = newLikesCount * 2 + (post.commentsCount || 0) * 3 + (post.shares || 0) * 4;
            updated = await Post.findByIdAndUpdate(
                postId,
                {
                    $addToSet: { likes: userId },
                    $set: { likesCount: newLikesCount, engagementScore: newScore },
                },
                { new: true }
            ).select("likesCount engagementScore").lean();

            // Notification — only on like, not unlike
            if (post.author.toString() !== userId.toString()) {
                const notification = await Notification.create({
                    recipient: post.author,
                    sender: userId,
                    type: "like",
                    relatedPost: postId,
                    message: `${req.user.name} liked your post`,
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
    try {
        const { content, parentComment } = req.body;
        if (!content) return res.status(400).json({ success: false, message: "Content is required" });

        const post = await Post.findById(req.params.id)
            .select("author commentsCount likesCount shares")
            .lean();

        if (!post) return res.status(404).json({ success: false, message: "Post not found" });

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

        // Notification (only for top-level comments; replies notify the comment author)
        if (!parentComment && post.author.toString() !== req.user._id.toString()) {
            const notification = await Notification.create({
                recipient: post.author,
                sender: req.user._id,
                type: "comment",
                relatedPost: req.params.id,
                message: `${req.user.name} commented on your post`,
            });
            const socketId = getReceiverSocketId(post.author.toString());
            if (socketId) io.to(socketId).emit("newNotification", notification);
            await User.findByIdAndUpdate(post.author, { $inc: { skillScore: 1 } });
        }

        // If this is a reply, notify the parent comment's author
        if (parentComment) {
            const parent = await Comment.findById(parentComment).select("user").lean();
            if (parent && parent.user.toString() !== req.user._id.toString()) {
                const notification = await Notification.create({
                    recipient: parent.user,
                    sender: req.user._id,
                    type: "comment",
                    relatedPost: req.params.id,
                    message: `${req.user.name} replied to your comment`,
                });
                const socketId = getReceiverSocketId(parent.user.toString());
                if (socketId) io.to(socketId).emit("newNotification", notification);
            }
        }

        res.status(201).json({ success: true, comment });
    } catch (error) {
        console.error("Error in commentOnPost:", error);
        res.status(500).json({ success: false, message: "Server error while adding comment" });
    }
};

export const getComments = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const cursor = req.query.cursor || null;

        // Get top-level comments only
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

        // Fetch replies for each top-level comment
        const commentIds = comments.map((c) => c._id);
        const replies = await Comment.find({ parentComment: { $in: commentIds } })
            .sort({ createdAt: 1 })
            .populate("user", "name profilePic username")
            .lean();

        // Attach replies to their parent comments
        const replyMap = {};
        replies.forEach((r) => {
            const parentId = r.parentComment.toString();
            if (!replyMap[parentId]) replyMap[parentId] = [];
            replyMap[parentId].push(r);
        });

        const commentsWithReplies = comments.map((c) => ({
            ...c,
            replies: replyMap[c._id.toString()] || [],
        }));

        res.json({ success: true, comments: commentsWithReplies, hasMore, nextCursor });
    } catch (error) {
        console.error("Error getting comments:", error);
        res.status(500).json({ success: false, message: "Server error while fetching comments" });
    }
};

export const deleteComment = async (req, res) => {
    try {
        const { id: postId, commentId } = req.params;

        const comment = await Comment.findById(commentId).lean();
        if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });

        const post = await Post.findById(postId)
            .select("author commentsCount likesCount shares")
            .lean();

        if (!post) return res.status(404).json({ success: false, message: "Post not found" });

        const isCommentOwner = comment.user.toString() === req.user._id.toString();
        const isPostOwner = post.author.toString() === req.user._id.toString();

        if (!isCommentOwner && !isPostOwner) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        // Delete comment + its replies
        await Comment.deleteMany({ $or: [{ _id: commentId }, { parentComment: commentId }] });

        // Decrement commentsCount + recompute engagementScore
        const newCommentsCount = Math.max(0, (post.commentsCount || 0) - 1);
        const newScore = (post.likesCount || 0) * 2 + newCommentsCount * 3 + (post.shares || 0) * 4;
        await Post.findByIdAndUpdate(postId, {
            $set: { commentsCount: newCommentsCount, engagementScore: newScore },
        });

        res.json({ success: true, message: "Comment deleted" });
    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({ success: false, message: "Server error while deleting comment" });
    }
};

// ─── Share ───────────────────────────────────────────────────────────────────

export const sharePost = async (req, res) => {
    try {
        const { content } = req.body;
        const originalPost = await Post.findById(req.params.id)
            .select("author shares likesCount commentsCount")
            .lean();

        if (!originalPost) return res.status(404).json({ success: false, message: "Post not found" });

        // Increment shares + recompute score atomically
        const newShares = (originalPost.shares || 0) + 1;
        const newScore = (originalPost.likesCount || 0) * 2 + (originalPost.commentsCount || 0) * 3 + newShares * 4;
        await Post.findByIdAndUpdate(req.params.id, {
            $set: { shares: newShares, engagementScore: newScore },
        });

        const sharePostDoc = await Post.create({
            author: req.user._id,
            content: content || "",
            type: "share",
            sharedPost: req.params.id,
        });

        await sharePostDoc.populate("author", "name profilePic headline username");
        await sharePostDoc.populate({
            path: "sharedPost",
            populate: { path: "author", select: "name profilePic headline username" },
        });

        if (originalPost.author.toString() !== req.user._id.toString()) {
            const notification = await Notification.create({
                recipient: originalPost.author,
                sender: req.user._id,
                type: "postShare",
                relatedPost: req.params.id,
                message: `${req.user.name} shared your post`,
            });
            const socketId = getReceiverSocketId(originalPost.author.toString());
            if (socketId) io.to(socketId).emit("newNotification", notification);
        }

        res.status(201).json({ success: true, post: sharePostDoc });
    } catch (error) {
        console.error("Error sharing post:", error);
        res.status(500).json({ success: false, message: "Server error while sharing post" });
    }
};

// ─── Delete Post ─────────────────────────────────────────────────────────────

export const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).select("author").lean();
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });

        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        await Promise.all([
            Post.findByIdAndDelete(req.params.id),
            Comment.deleteMany({ post: req.params.id }),
        ]);

        res.json({ success: true, message: "Post deleted" });
    } catch (error) {
        console.error("Error deleting post:", error);
        res.status(500).json({ success: false, message: "Server error while deleting post" });
    }
};