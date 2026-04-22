import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import connectDB from "./config/db.js";
import { initSocket } from "./socket/socket.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import postRoutes from "./routes/post.routes.js";
import connectionRoutes from "./routes/connection.routes.js";
import jobRoutes from "./routes/job.routes.js";
import notificationRoutes from "./routes/notification.routes.js";

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

initSocket(server);

app.use(helmet());
app.use(morgan("dev"));
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/notifications", notificationRoutes);

app.use((err, req, res, next) => {
    const status = err.statusCode || 500;
    res.status(status).json({ success: false, message: err.message || "Server Error" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));