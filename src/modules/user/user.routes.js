import express from "express";
import protect from "../../middlewares/auth.middleware.js";
import upload from "../../middlewares/upload.middleware.js";
import { getNearbyUsers } from "./user.controller.js";

import {
  updateProfile,
  getUserProfile,
  uploadProfilePhoto,
  blockUser,
  getMyProfile,
  createMissingSystemUsers
} from "./user.controller.js";

const router = express.Router();

/* 🔥 IMPORTANT: /me BEFORE /:id */
router.get("/me", protect, getMyProfile);

router.put("/profile", protect, updateProfile);

router.post(
  "/profile/photo",
  protect,
  upload.single("photo"),
  uploadProfilePhoto
);
router.get("/nearby", protect, getNearbyUsers);

router.post("/block", protect, blockUser);

/* 🔧 DEBUG: Create system users for current user */
router.post("/create-system-users", protect, createMissingSystemUsers);

/* PUBLIC PROFILE */
router.get("/:id", protect, getUserProfile);

export default router;
