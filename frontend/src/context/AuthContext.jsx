import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../lib/axios";
import { connectSocket, disconnectSocket, getSocket } from "../lib/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.get("/notifications/unread-count");
      setUnreadNotifications(data.count);
    } catch { /* ignore */ }
  }, []);

  // Fetch unread message count
  const fetchUnreadMessageCount = useCallback(async () => {
    try {
      const { data } = await api.get("/messages/unread-count");
      setUnreadMessages(data.count);
    } catch { /* ignore */ }
  }, []);

  // Wire socket event listeners
  const setupSocketListeners = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on("newNotification", () => {
      setUnreadNotifications((prev) => prev + 1);
    });

    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    // Increment unread messages when a new message arrives
    socket.on("newMessage", () => {
      setUnreadMessages((prev) => prev + 1);
    });

    return () => {
      socket.off("newNotification");
      socket.off("onlineUsers");
      socket.off("newMessage");
    };
  }, []);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem("graphite_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
      connectSocket(data.user._id);
      setupSocketListeners();
      fetchUnreadCount();
      fetchUnreadMessageCount();
    } catch {
      localStorage.removeItem("graphite_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setupSocketListeners, fetchUnreadCount, fetchUnreadMessageCount]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  // Poll unread count every 30 seconds as fallback
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchUnreadMessageCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [user, fetchUnreadCount, fetchUnreadMessageCount]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("graphite_token", data.token);
    setUser(data.user);
    connectSocket(data.user._id);
    setupSocketListeners();
    fetchUnreadCount();
    fetchUnreadMessageCount();
    return data.user;
  };

  const register = async (name, email, password, username) => {
    const { data } = await api.post("/auth/register", { name, email, password, username });
    localStorage.setItem("graphite_token", data.token);
    setUser(data.user);
    connectSocket(data.user._id);
    setupSocketListeners();
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("graphite_token");
    setUser(null);
    setUnreadNotifications(0);
    setUnreadMessages(0);
    setOnlineUsers([]);
    disconnectSocket();
  };

  const clearNotificationCount = () => setUnreadNotifications(0);
  const clearMessageCount = () => setUnreadMessages(0);

  return (
    <AuthContext.Provider value={{
      user, setUser, loading,
      login, register, logout,
      unreadNotifications, clearNotificationCount,
      unreadMessages, clearMessageCount, fetchUnreadMessageCount,
      onlineUsers,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
