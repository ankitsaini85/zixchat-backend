import Report from "./report.model.js";

export const reportUser = async (req, res) => {
  const reporter = req.user.id;
  const { reportedUserId, reason } = req.body;

  if (!reason) {
    return res.status(400).json({ message: "Reason required" });
  }

  await Report.create({
    reporter,
    reportedUser: reportedUserId,
    reason
  });

  res.json({ message: "User reported successfully" });
};
