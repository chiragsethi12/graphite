import Notification from "../models/Notification.model.js";

export const getNotifications = async (req, res) => {
    const notifications = await Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .populate("sender", "name profilePic")
        .limit(20);
    res.json({ success: true, notifications });
};

export const markAsRead = async (req, res) => {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
    res.json({ success: true, message: "Notifications marked as read" });
};

export const deleteNotification = async (req, res) => {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
    res.json({ success: true, message: "Deleted" });
};