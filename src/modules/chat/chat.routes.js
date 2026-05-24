import express from "express";
import protect from "../../middlewares/auth.middleware.js";
import requireProfileComplete from "../../middlewares/profileCcmplete.middleware.js";
import chatGate from "../../middlewares/chatGate.middleware.js";

import {
  getChatHistory,
  getInbox
} from "./chat.controller.js";

const router = express.Router();

/* 📥 INBOX */
router.get(
  "/inbox",
  protect,
  requireProfileComplete,
  getInbox
);

/* 💬 CHAT HISTORY (🔒 GATED) */
router.get(
  "/:withUser",
  protect,
  requireProfileComplete,
  chatGate, // ✅ FINAL CHAT ACCESS CHECK
  getChatHistory
);

export default router;
