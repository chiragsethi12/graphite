import { Server } from "socket.io";

let io;
const userSocketMap = {};  // userId -> socketId

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL,
            methods: ["GET", "POST"],
        },
        pingTimeout: 60000,
    });

    io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId;
        if (userId && userId !== "undefined") {
            userSocketMap[userId] = socket.id;
            // Join a personal room for targeted events
            socket.join(`user:${userId}`);
        }

        // Broadcast online users list
        io.emit("onlineUsers", Object.keys(userSocketMap));

        // ── Typing indicators ────────────────────────────────────
        socket.on("typing", ({ recipientId }) => {
            const recipientSocket = userSocketMap[recipientId];
            if (recipientSocket) {
                io.to(recipientSocket).emit("userTyping", { userId });
            }
        });

        socket.on("stopTyping", ({ recipientId }) => {
            const recipientSocket = userSocketMap[recipientId];
            if (recipientSocket) {
                io.to(recipientSocket).emit("userStopTyping", { userId });
            }
        });

        // ── Disconnect ───────────────────────────────────────────
        socket.on("disconnect", () => {
            if (userId) {
                delete userSocketMap[userId];
                io.emit("onlineUsers", Object.keys(userSocketMap));
            }
        });
    });
};

export const getReceiverSocketId = (userId) => userSocketMap[userId];
export { io };