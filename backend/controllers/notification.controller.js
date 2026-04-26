import Notification from "../models/Notification.model.js";

// GET /api/notifications
export const getNotifications = async (req, res) => {
    const page  = parseInt(req.query.page) || 1;
    const limit = 20;

    const notifications = await Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("sender",      "name username profilePic")
        .populate("relatedPost", "content image")
        .populate("relatedJob",  "title company");

    const total = await Notification.countDocuments({ recipient: req.user._id });

    res.json({ success: true, notifications, total, page, pages: Math.ceil(total / limit) });
};

// GET /api/notifications/unread-count
export const getUnreadCount = async (req, res) => {
    const count = await Notification.countDocuments({ recipient: req.user._id, read: false });
    res.json({ success: true, count });
};

// PATCH /api/notifications/mark-all-read
export const markAllAsRead = async (req, res) => {
    const now = new Date();
    await Notification.updateMany(
        { recipient: req.user._id, read: false },
        { read: true, readAt: now }
    );
    res.json({ success: true, message: "All notifications marked as read" });
};

// PUT /api/notifications/:id/read
export const markSingleAsRead = async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, recipient: req.user._id },
        { read: true, readAt: new Date() },
        { new: true }
    );
    if (!notification)
        return res.status(404).json({ success: false, message: "Notification not found" });
    res.json({ success: true, notification });
};

// DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
    res.json({ success: true, message: "Deleted" });
};