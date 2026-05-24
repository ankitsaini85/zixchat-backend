import Report from "../report/report.model.js";
import User from "../user/user.model.js";
import ChatMessage from "../chat/chat.model.js";
import Match from "../match/match.model.js";
import QuizAnswer from "../quiz/quizAnswer.model.js";
export const getAllReports = async (req, res) => {
  const reports = await Report.find()
    .populate("reporter", "name email")
    .populate("reportedUser", "name email")
    .sort({ createdAt: -1 });

  res.json(reports);
};
export const getBlockedUsers = async (req, res) => {
  const users = await User.find({ blockedUsers: { $exists: true, $ne: [] } })
    .populate("blockedUsers", "name email");

  res.json(users);
};
export const adminUnblockUser = async (req, res) => {
  const { blockerId, blockedUserId } = req.body;

  await User.findByIdAndUpdate(blockerId, {
    $pull: { blockedUsers: blockedUserId }
  });

  res.json({ message: "User unblocked successfully" });
};
export const getAllUsers = async (req, res) => {
  const users = await User.find().select(
    "name email isAdmin isSystemUser createdFor quizCompleted profileCompleted createdAt photo isBanned banType banReason banExpiresAt gender city"
  );

  res.json(users);
};
export const deleteUserByAdmin = async (req, res) => {
  const adminId = req.user.id;
  const { userId } = req.params;

  // ❌ Prevent admin deleting himself
  if (adminId === userId) {
    return res
      .status(400)
      .json({ message: "Admin cannot delete himself" });
  }

  // 1️⃣ Delete user
  await User.findByIdAndDelete(userId);

  // 2️⃣ Cleanup related data
  await ChatMessage.deleteMany({
    $or: [{ sender: userId }, { receiver: userId }]
  });

  await Match.deleteMany({
    $or: [{ userA: userId }, { userB: userId }]
  });

  await QuizAnswer.deleteMany({ userId });

  await Report.deleteMany({
    $or: [{ reporter: userId }, { reportedUser: userId }]
  });

  res.json({ message: "User deleted successfully" });
};
export const deleteReport = async (req, res) => {
  const { reportId } = req.params;

  // Check if report exists
  const report = await Report.findByIdAndDelete(reportId);

  if (!report) {
    return res.status(404).json({ message: "Report not found" });
  }

  res.json({ message: "Report deleted successfully" });
};
export const banUser = async (req, res) => {
  const { userId } = req.params;
  const { banType, banReason, banDuration } = req.body;
  const adminId = req.user.id;

  // Prevent admin from banning himself
  if (adminId === userId) {
    return res.status(400).json({ message: "Admin cannot ban himself" });
  }

  // Check if user is admin
  const user = await User.findById(userId);
  if (user?.isAdmin) {
    return res.status(400).json({ message: "Cannot ban another admin" });
  }

  const updateData = {
    isBanned: true,
    banType,
    banReason: banReason || "No reason provided",
    bannedBy: adminId,
    banExpiresAt: banType === "temporary" && banDuration 
      ? new Date(Date.now() + banDuration * 24 * 60 * 60 * 1000) // Convert days to milliseconds
      : null
  };

  await User.findByIdAndUpdate(userId, updateData);

  res.json({ message: `User banned ${banType === "temporary" ? "temporarily" : "permanently"}` });
};
export const unbanUser = async (req, res) => {
  const { userId } = req.params;

  await User.findByIdAndUpdate(userId, {
    isBanned: false,
    banType: null,
    banReason: null,
    banExpiresAt: null,
    bannedBy: null
  });

  res.json({ message: "User unbanned successfully" });
};