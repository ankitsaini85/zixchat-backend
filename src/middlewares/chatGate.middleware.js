import Request from "../modules/request/request.model.js";
import User from "../modules/user/user.model.js";

export default async function chatGate(req, res, next) {
  try {
    const userId = req.user.id;
    const { withUser } = req.params;

    // 🔍 Fetch target user
    const targetUser = await User.findById(withUser).select("isSystemUser");
    if (!targetUser) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    /* ===============================
       🤖 SYSTEM USER CHAT LOGIC
       =============================== */
    if (targetUser.isSystemUser) {
      const accepted = await Request.findOne({
        sender: userId,
        receiver: withUser,
        status: "accepted"
      });

      if (!accepted) {
        return res.status(403).json({
          message: "System user request not accepted yet"
        });
      }

      // ✅ Allowed
      return next();
    }

    /* ===============================
       🧑 NORMAL USER CHAT LOGIC
       =============================== */
    const accepted = await Request.findOne({
      $or: [
        { sender: userId, receiver: withUser, status: "accepted" },
        { sender: withUser, receiver: userId, status: "accepted" }
      ]
    });

    if (!accepted) {
      return res.status(403).json({
        message: "Chat not allowed. Request not accepted."
      });
    }

    next();
  } catch (err) {
    console.error("ChatGate error:", err);
    res.status(500).json({
      message: "Chat permission check failed"
    });
  }
}
