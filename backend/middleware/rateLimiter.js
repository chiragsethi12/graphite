import rateLimit from "express-rate-limit";

/**
 * General API rate limiter — 200 requests per 15 minutes per IP.
 * Applied globally in index.js.
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests, please try again later." },
});

/**
 * Strict limiter for auth endpoints — 10 attempts per 15 minutes per IP.
 * Prevents brute-force login attacks.
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many authentication attempts. Try again in 15 minutes." },
});