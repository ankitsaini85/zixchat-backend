import express from "express";
import protect from "../../middlewares/auth.middleware.js";
import requireAdmin from "../../middlewares/admin.middleware.js";
import {
  getAllReports,
  getBlockedUsers,
  adminUnblockUser,
  getAllUsers,
  deleteUserByAdmin,
  deleteReport,
  banUser,
  unbanUser
} from "./admin.controller.js";

const router = express.Router();

router.get("/reports", protect, requireAdmin, getAllReports);
router.delete("/reports/:reportId", protect, requireAdmin, deleteReport);
router.get("/blocked-users", protect, requireAdmin, getBlockedUsers);
router.post("/unblock", protect, requireAdmin, adminUnblockUser);

// ✅ NEW
router.get("/users", protect, requireAdmin, getAllUsers);
router.delete("/users/:userId", protect, requireAdmin, deleteUserByAdmin);
router.post("/users/:userId/ban", protect, requireAdmin, banUser);
router.post("/users/:userId/unban", protect, requireAdmin, unbanUser);

export default router;
