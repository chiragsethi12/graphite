import { Server } from "socket.io";

let io;
const userSocketMap = {};  // userId -> socketId

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: [process.env.CLIENT_URL || "http://localhost:3000", "http://localhost:5173", "http://localhost:3000"],
            methods: ["GET", "POST"],
        },
        pingTimeout: 60000,
    });

    io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId;
        if (userId && userId !== "undefined") {
            userSocketMap[userId] = socket.id;
            socket.join(`user:${userId}`);
        }

        // Broadcast online users list to everyone
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

        // ── Real-time message delivery ────────────────────────────
        // This is a fallback for when the REST API send succeeds but the
        // HTTP response is enough — the controller handles DB write and
        // emits `newMessage` via getReceiverSocketId(). This socket event
        // allows the client to also broadcast for optimistic UI sync.
        socket.on("messageSent", ({ recipientId, message }) => {
            const recipientSocket = userSocketMap[recipientId];
            if (recipientSocket) {
                io.to(recipientSocket).emit("newMessage", message);
            }
        });

        // ── Mark messages as read notification ────────────────────
        socket.on("markRead", ({ senderId }) => {
            const senderSocket = userSocketMap[senderId];
            if (senderSocket) {
                io.to(senderSocket).emit("messagesRead", { byUserId: userId });
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