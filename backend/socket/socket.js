import { Server } from "socket.io";

let io;
const userSocketMap = {};

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL,
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId;
        if (userId) userSocketMap[userId] = socket.id;

        io.emit("onlineUsers", Object.keys(userSocketMap));

        socket.on("disconnect", () => {
            delete userSocketMap[userId];
            io.emit("onlineUsers", Object.keys(userSocketMap));
        });
    });
};

export const getReceiverSocketId = (userId) => userSocketMap[userId];
export { io };