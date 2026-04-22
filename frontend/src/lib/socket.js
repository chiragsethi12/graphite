import { io } from "socket.io-client";

let socket = null;

export const getSocket = () => {
  if (!socket) {
    const userId = JSON.parse(localStorage.getItem("graphite_user") || "null")?._id;
    socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      withCredentials: false,
      autoConnect: false,
      query: { userId },
    });
  }
  return socket;
};

export const connectSocket = (userId) => {
  const s = getSocket();
  if (userId) s.io.opts.query = { userId };
  if (!s.connected) s.connect();
  return s;
};

export const disconnectSocket = () => {
  if (socket?.connected) socket.disconnect();
  socket = null;
};
