import Request from "./request.model.js";
import User from "../user/user.model.js";
import Notification from "../notification/notification.model.js";

/* ================= SEND REQUEST ================= */
export const sendRequest = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: "Receiver required" });
    }

    if (senderId === receiverId) {
      return res.status(400).json({ message: "Cannot request yourself" });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    const existing = await Request.findOne({
      sender: senderId,
      receiver: receiverId
    });

    if (existing) {
      return res.status(409).json({
        message: "Request already sent",
        status: existing.status,
        requestId: existing._id
      });
    }

    const request = await Request.create({
      sender: senderId,
      receiver: receiverId,
      status: "pending"
    });

    /* 🤖 AUTO ACCEPT SYSTEM USER */
    if (receiver.isSystemUser) {
      setTimeout(async () => {
        const reqDoc = await Request.findById(request._id);
        if (!reqDoc || reqDoc.status !== "pending") return;

        reqDoc.status = "accepted";
        reqDoc.autoAccepted = true;
        reqDoc.acceptedAt = new Date();
        await reqDoc.save();

        await Notification.create({
          user: senderId,
          title: "Request Accepted 🎉",
          message: `${receiver.name} accepted your request`,
          type: "request_accepted",
          relatedUser: receiver._id
        });

        console.log(
          `🤖 Auto-accepted request ${request._id} by ${receiver.name}`
        );
      }, 5000);
    }

    res.status(201).json({
      message: receiver.isSystemUser
        ? "Request sent. Auto-accepting shortly."
        : "Request sent",
      requestId: request._id,
      status: request.status,
      receiverName: receiver.name
    });
  } catch (err) {
    console.error("Send request error:", err);
    res.status(500).json({ message: "Failed to send request" });
  }
};

/* ================= GET REQUEST STATUS (NEW) ================= */
export const getRequestStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    const request = await Request.findById(requestId)
      .populate("receiver", "name isSystemUser")
      .populate("sender", "name");

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // 🔐 Security check
    if (
      request.sender._id.toString() !== userId &&
      request.receiver._id.toString() !== userId
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    res.json({
      requestId: request._id,
      status: request.status,
      autoAccepted: request.autoAccepted,
      acceptedAt: request.acceptedAt,
      acceptedBy:
        request.status === "accepted"
          ? request.receiver.name
          : null
    });
  } catch (err) {
    console.error("Get request status error:", err);
    res.status(500).json({ message: "Failed to get request status" });
  }
};
