import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Bell, Check, Trash2, Heart, MessageCircle, UserPlus, UserCheck, Share2, Briefcase } from "lucide-react";
import api from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import MainLayout from "../components/layout/MainLayout";
import Avatar from "../components/ui/Avatar";
import Card from "../components/ui/Card";
import ConfirmAction from "../components/ui/ConfirmDialog";
import { NotificationSkeleton } from "../components/ui/SkeletonScreens";
import formatRelativeTime from "../utils/formatRelativeTime";
import toast from "react-hot-toast";

const typeIcons = {
  like: Heart,
  comment: MessageCircle,
  connectionRequest: UserPlus,
  connectionAccepted: UserCheck,
  postShare: Share2,
  jobUpdate: Briefcase,
  commentLike: Heart,
  mention: MessageCircle,
};

const typeColors = {
  like: "text-red-500 bg-red-50",
  comment: "text-blue-500 bg-blue-50",
  connectionRequest: "text-primary bg-primary-50",
  connectionAccepted: "text-green-500 bg-green-50",
  postShare: "text-purple-500 bg-purple-50",
  jobUpdate: "text-amber-500 bg-amber-50",
  commentLike: "text-red-400 bg-red-50",
  mention: "text-blue-400 bg-blue-50",
};

function NotificationItem({ notification, onMarkRead, onDelete }) {
  const Icon = typeIcons[notification.type] || Bell;
  const colorClass = typeColors[notification.type] || "text-gray-500 bg-gray-50";

  const getLink = () => {
    if (notification.relatedPost) return `/post/${notification.relatedPost._id || notification.relatedPost}`;
    if (notification.type === "connectionRequest" || notification.type === "connectionAccepted")
      return `/profile/${notification.sender?.username || notification.sender?._id}`;
    if (notification.relatedJob) return `/jobs`;
    return null;
  };

  const link = getLink();
  const Wrapper = link ? Link : "div";

  return (
    <Wrapper
      to={link}
      onClick={() => !notification.read && onMarkRead(notification._id)}
      className={`flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer ${
        notification.read ? "bg-white" : "bg-primary-50/40"
      } hover:bg-gray-50`}
    >
      <div className="relative shrink-0">
        <Avatar src={notification.sender?.profilePic} name={notification.sender?.name} size="md" />
        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${colorClass}`}>
          <Icon size={10} />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${notification.read ? "text-gray-600" : "text-gray-900 font-medium"}`}>
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(notification.createdAt)}</p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {!notification.read && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMarkRead(notification._id); }}
            className="p-1 rounded text-gray-400 hover:text-primary hover:bg-primary-50 transition-colors"
            title="Mark as read"
          >
            <Check size={14} />
          </button>
        )}
        <ConfirmAction
          onConfirm={() => onDelete(notification._id)}
          message="Delete?"
          confirmLabel="Yes"
        >
          {(requestConfirm) => (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); requestConfirm(); }}
              className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          )}
        </ConfirmAction>
      </div>
    </Wrapper>
  );
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { clearNotificationCount } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get("/notifications").then((r) => r.data),
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => api.put(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/notifications/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  // Auto-mark all as read when page is visited
  useEffect(() => {
    const markRead = async () => {
      try {
        await api.patch("/notifications/mark-all-read");
        clearNotificationCount();
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      } catch {
        // Silently fail — background UX operation
      }
    };
    markRead();
  }, [clearNotificationCount, queryClient]);

  const notifications = data?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <MainLayout>
      <div className="max-w-[640px] mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500 mt-0.5">{unreadCount} unread</p>
            )}
          </div>
        </div>

        {isLoading ? (
          <NotificationSkeleton count={5} />
        ) : notifications.length === 0 ? (
          <Card className="text-center py-16 text-gray-400">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bell size={28} className="text-gray-300" />
            </div>
            <p className="font-semibold text-gray-900">No notifications yet</p>
            <p className="text-sm mt-1">When someone interacts with you, you'll see it here</p>
          </Card>
        ) : (
          <Card className="divide-y divide-gray-100 overflow-hidden" padding={false}>
            {notifications.map((n) => (
              <NotificationItem
                key={n._id}
                notification={n}
                onMarkRead={(id) => markReadMutation.mutate(id)}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
