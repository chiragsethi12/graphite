import Post from "../models/Post.model.js";
import Notification from "../models/Notification.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const createPost = async (req, res) => {
    const { content } = req.body;
    const image = req.file?.path || "";

    if (!content) return res.status(400).json({ success: false, message: "Content is required" });

    const post = await Post.create({ author: req.user._id, content, image });
    await post.populate("author", "name profilePic headline");

    res.status(201).json({ success: true, post });
};

export const getFeed = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    const posts = await Post.find({
        $or: [
            { author: req.user._id },
            { author: { $in: req.user.connections } },
        ],
    })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("author", "name profilePic headline")
        .populate("comments.user", "name profilePic");

    res.json({ success: true, posts });
};

export const likePost = async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const liked = post.likes.includes(req.user._id);
    if (liked) {
        post.likes = post.likes.filter((id) => id.toString() !== req.user._id.toString());
    } else {
        post.likes.push(req.user._id);

        if (post.author.toString() !== req.user._id.toString()) {
            const notification = await Notification.create({
                recipient: post.author,
                sender: req.user._id,
                type: "like",
                relatedPost: post._id,
                message: `${req.user.name} liked your post`,
            });

            const socketId = getReceiverSocketId(post.author.toString());
            if (socketId) io.to(socketId).emit("newNotification", notification);
        }
    }

    await post.save();
    res.json({ success: true, likes: post.likes });
};

export const commentOnPost = async (req, res) => {
    const { content } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    post.comments.push({ user: req.user._id, content });
    await post.save();
    await post.populate("comments.user", "name profilePic");

    if (post.author.toString() !== req.user._id.toString()) {
        const notification = await Notification.create({
            recipient: post.author,
            sender: req.user._id,
            type: "comment",
            relatedPost: post._id,
            message: `${req.user.name} commented on your post`,
        });

        const socketId = getReceiverSocketId(post.author.toString());
        if (socketId) io.to(socketId).emit("newNotification", notification);
    }

    res.json({ success: true, comments: post.comments });
};

export const deletePost = async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    if (post.author.toString() !== req.user._id.toString())
        return res.status(403).json({ success: false, message: "Not authorized" });

    await post.deleteOne();
    res.json({ success: true, message: "Post deleted" });
};