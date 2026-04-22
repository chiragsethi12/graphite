import express from "express";
import {
    createJob,
    getJobs,
    getJobById,
    applyForJob,
    getMyApplications,
    getMyListings,
    toggleJobActive,
    getRecommendedJobs,
} from "../controllers/job.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/",                protect, getJobs);
router.get("/my-applications", protect, getMyApplications);
router.get("/my-listings",     protect, getMyListings);
router.get("/recommended",     protect, getRecommendedJobs);
router.get("/:id",             protect, getJobById);
router.post("/",               protect, createJob);
router.post("/:id/apply",      protect, applyForJob);
router.put("/:id/toggle-active", protect, toggleJobActive);

export default router;