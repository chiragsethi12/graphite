import express from 'express';
import {
  getUserProfile,
  getUserPosts,
  getUserStats,
  updateProfile,
  searchUsers,
  getRecommendedUsers,
  changePassword,
  updatePrivacy,
} from '../controllers/user.controller.js';
import protect from '../middleware/auth.middleware.js';
import { upload, handleMulterError } from '../config/cloudinary.js';

const router = express.Router();

// ── Specific routes FIRST (before :identifier param) ─────────────────────────
router.get('/search', protect, searchUsers);
router.get('/suggestions', protect, getRecommendedUsers);
router.put(
  '/update',
  protect,
  upload.fields([
    { name: 'profilePic', maxCount: 1 },
    { name: 'bannerPic', maxCount: 1 },
  ]),
  handleMulterError,
  updateProfile
);
// Backwards-compatible alias: frontend expects `/users/profile`
router.put(
  '/profile',
  protect,
  upload.fields([
    { name: 'profilePic', maxCount: 1 },
    { name: 'bannerPic', maxCount: 1 },
  ]),
  handleMulterError,
  updateProfile
);
router.put('/change-password', protect, changePassword);
router.put('/privacy', protect, updatePrivacy);

// ── Sub-resource routes before the :identifier wildcard ──────────────────────
router.get('/:userId/posts', protect, getUserPosts);
router.get('/:userId/stats', protect, getUserStats);

// ── Generic profile lookup — must be LAST ─────────────────────────────────────
router.get('/:identifier', protect, getUserProfile);

export default router;
