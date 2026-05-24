import Request from "../modules/request/request.model.js";
import User from "../modules/user/user.model.js";

export default async function requireAcceptedRequest(req, res, next) {
  try {
    const userId = req.user.id;
    const withUser = req.params.withUser;

    // Check if chatting with system user
    const otherUser = await User.findById(withUser).select("isSystemUser");
    if (otherUser?.isSystemUser) {
      const reqDoc = await Request.findOne({
        sender: userId,
        receiver: withUser,
        status: "accepted"
      });

      if (reqDoc) return next();
    }

    // Normal users
    const request = await Request.findOne({
      $or: [
        { sender: userId, receiver: withUser },
        { sender: withUser, receiver: userId }
      ],
      status: "accepted"
    });

    if (!request) {
      return res.status(403).json({
        message: "Chat allowed only after request acceptance"
      });
    }

    next();
  } catch (err) {
    console.error("Chat gate error:", err);
    res.status(500).json({ message: "Chat permission check failed" });
  }
}
