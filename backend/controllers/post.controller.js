import Post from "../models/Post.model.js";
import Notification from "../models/Notification.model.js";
import User from "../models/User.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const createPost = async (req, res) => {
    const { content, tags, type } = req.body;
    const image = req.file?.path || "";
    if (!content) return res.status(400).json({ success: false, message: "Content is required" });

    const parsedTags = tags ? (typeof tags === "string" ? JSON.parse(tags) : tags) : [];
    const postType = image ? "image" : (type || "text");

    const post = await Post.create({ author: req.user._id, content, image, tags: parsedTags, type: postType });
    await post.populate("author", "name profilePic headline username");
    io.emit("newPost", { authorId: req.user._id });
    await User.findByIdAndUpdate(req.user._id, { $inc: { skillScore: 1 } });
    res.status(201).json({ success: true, post });
};

// Cursor-based feed with engagement ranking
export const getFeed = async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor || null;
    const authorIds = [req.user._id, ...req.user.connections];
    const filter = { author: { $in: authorIds } };
    if (cursor) filter._id = { $lt: cursor };

    const posts = await Post.find(filter)
        .sort({ engagementScore: -1, createdAt: -1 })
        .limit(limit + 1)
        .populate("author", "name profilePic headline username")
        .populate("comments.user", "name profilePic username")
        .populate({ path: "sharedPost", populate: { path: "author", select: "name profilePic headline username" } });

    const hasMore = posts.length > limit;
    if (hasMore) posts.pop();
    const nextCursor = hasMore ? posts[posts.length - 1]._id : null;
    res.json({ success: true, posts, hasMore, nextCursor });
};

export const getTrendingPosts = async (req, res) => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const posts = await Post.find({ createdAt: { $gte: sevenDaysAgo } })
        .sort({ engagementScore: -1 })
        .limit(10)
        .populate("author", "name profilePic headline username")
        .select("content image author likes comments engagementScore createdAt tags");
    res.json({ success: true, posts });
};

export const getPostById = async (req, res) => {
    const post = await Post.findById(req.params.id)
        .populate("author", "name profilePic headline username")
        .populate("comments.user", "name profilePic username")
        .populate({ path: "sharedPost", populate: { path: "author", select: "name profilePic headline username" } });
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    res.json({ success: true, post });
};

export const likePost = async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    const userId = req.user._id;
    const liked = post.likes.some((id) => id.toString() === userId.toString());

    if (liked) {
        post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
    } else {
        post.likes.push(userId);
        if (post.author.toString() !== userId.toString()) {
            const notification = await Notification.create({
                recipient: post.author, sender: userId, type: "like",
                relatedPost: post._id, message: `${req.user.name} liked your post`,
            });
            const socketId = getReceiverSocketId(post.author.toString());
            if (socketId) io.to(socketId).emit("newNotification", notification);
            await User.findByIdAndUpdate(post.author, { $inc: { skillScore: 1 } });
        }
    }
    post.recalcScore();
    await post.save();
    res.json({ success: true, likes: post.likes, engagementScore: post.engagementScore });
};

export const commentOnPost = async (req, res) => {
    const { content, parentComment } = req.body;
    if (!content) return res.status(400).json({ success: false, message: "Content is required" });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const newComment = { user: req.user._id, content };
    if (parentComment) newComment.parentComment = parentComment;
    post.comments.push(newComment);
    post.recalcScore();
    await post.save();
    await post.populate("comments.user", "name profilePic username");

    if (post.author.toString() !== req.user._id.toString()) {
        const notification = await Notification.create({
            recipient: post.author, sender: req.user._id, type: "comment",
            relatedPost: post._id, message: `${req.user.name} commented on your post`,
        });
        const socketId = getReceiverSocketId(post.author.toString());
        if (socketId) io.to(socketId).emit("newNotification", notification);
        await User.findByIdAndUpdate(post.author, { $inc: { skillScore: 1 } });
    }
    res.json({ success: true, comments: post.comments });
};

export const deleteComment = async (req, res) => {
    const { id, commentId } = req.params;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });
    const isCommentOwner = comment.user.toString() === req.user._id.toString();
    const isPostOwner    = post.author.toString()  === req.user._id.toString();
    if (!isCommentOwner && !isPostOwner)
        return res.status(403).json({ success: false, message: "Not authorized" });
    post.comments = post.comments.filter((c) => c._id.toString() !== commentId);
    post.recalcScore();
    await post.save();
    res.json({ success: true, comments: post.comments });
};

export const sharePost = async (req, res) => {
    const { content } = req.body;
    const originalPost = await Post.findById(req.params.id);
    if (!originalPost) return res.status(404).json({ success: false, message: "Post not found" });

    originalPost.shares += 1;
    originalPost.recalcScore();
    await originalPost.save();

    const sharePostDoc = await Post.create({
        author: req.user._id, content: content || "", type: "share", sharedPost: originalPost._id,
    });
    await sharePostDoc.populate("author", "name profilePic headline username");
    await sharePostDoc.populate({ path: "sharedPost", populate: { path: "author", select: "name profilePic headline username" } });

    if (originalPost.author.toString() !== req.user._id.toString()) {
        const notification = await Notification.create({
            recipient: originalPost.author, sender: req.user._id, type: "postShare",
            relatedPost: originalPost._id, message: `${req.user.name} shared your post`,
        });
        const socketId = getReceiverSocketId(originalPost.author.toString());
        if (socketId) io.to(socketId).emit("newNotification", notification);
    }
    res.status(201).json({ success: true, post: sharePostDoc });
};

export const deletePost = async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    if (post.author.toString() !== req.user._id.toString())
        return res.status(403).json({ success: false, message: "Not authorized" });
    await post.deleteOne();
    res.json({ success: true, message: "Post deleted" });
};