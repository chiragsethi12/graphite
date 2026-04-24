import "dotenv/config";  // MUST be first — loads .env before any other import resolves
import express from "express";
import http from "http";
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
import searchRoutes from "./routes/search.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import messageRoutes from "./routes/message.routes.js";

connectDB();

const app = express();
const server = http.createServer(app);

initSocket(server);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(morgan("dev"));

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
console.log(`[CORS] Allowing requests from: ${CLIENT_URL}`);

app.use(cors({
    origin: [CLIENT_URL, "http://localhost:5173", "http://localhost:3000"],
    credentials: true,
}));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/messages", messageRoutes);

// ─── Health check ────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/health/db", async (req, res) => {
    try {
        const { connection } = await import("mongoose");
        const state = ["disconnected", "connected", "connecting", "disconnecting"][connection.readyState] || "unknown";
        res.json({ status: state === "connected" ? "ok" : "degraded", db: state });
    } catch {
        res.status(500).json({ status: "error" });
    }
});

// ─── Global error handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err.stack || err.message);
    const status = err.statusCode || 500;
    res.status(status).json({
        success: false,
        message: process.env.NODE_ENV === "production"
            ? "Internal server error"
            : err.message || "Server Error",
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}!`));