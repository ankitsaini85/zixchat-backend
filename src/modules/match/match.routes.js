import express from "express";
import protect from "../../middlewares/auth.middleware.js";
import {
  generateMatchesForUser,
  getNearbyUsers
} from "./match.controller.js";

const router = express.Router();

/* =======================
   EXISTING MATCHES
   ======================= */
router.get("/", protect, generateMatchesForUser);

/* =======================
   PHASE 2A — NEARBY USERS
   ======================= */
router.get("/nearby", protect, getNearbyUsers);

export default router;
