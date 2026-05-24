import { Server } from "socket.io";
import ChatMessage from "./modules/chat/chat.model.js";
import { authenticateSocket } from "./utils/socketAuth.js";
import User from "./modules/user/user.model.js";
import { getGeminiReply } from "./services/gemini.service.js";

const onlineUsers = new Map();
const FREE_TRIAL_SECONDS = 40;

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: "*" }
  });

  io.on("connection", async (socket) => {
    const userId = authenticateSocket(socket);
    if (!userId) return socket.disconnect();

    let user = await User.findById(userId);
    if (!user || !user.profileCompleted) {
      socket.emit("chat_blocked", {
        message: "Complete your profile to start chatting"
      });
      socket.disconnect();
      return;
    }

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);
    socket.join(userId);

    socket.broadcast.emit("user_online", { userId });

    /* ================= ONLINE STATUS ================= */
    socket.on("check_online", async ({ userId: targetUserId }) => {
      const target = await User.findById(targetUserId).select("isSystemUser");
      socket.emit("online_status", {
        userId: targetUserId,
        online: target?.isSystemUser || onlineUsers.has(targetUserId)
      });
    });

    /* ================= CHAT ACCESS CHECK ================= */
    const ensureChatAccess = async () => {
      user = await User.findById(userId);

      // ✅ Subscription active → allow
      if (user.subscription?.isActive) return true;

      // ❌ Trial already used & expired
      if (user.freeTrialUsed && user.freeTrialEndsAt) {
        if (Date.now() > user.freeTrialEndsAt.getTime()) {
          socket.emit("chat_blocked", {
            message: "Free trial ended. Please subscribe to continue chatting."
          });
          return false;
        }
      }

      return true;
    };

    /* ================= SEND MESSAGE ================= */
    socket.on("send_message", async ({ receiverId, message }) => {
      if (!message || !receiverId) return;

      const canChat = await ensureChatAccess();
      if (!canChat) return;

      // 🎁 START FREE TRIAL ON FIRST MESSAGE
      if (!user.subscription?.isActive && !user.freeTrialUsed) {
        const now = new Date();
        const ends = new Date(now.getTime() + FREE_TRIAL_SECONDS * 1000);

        await User.findByIdAndUpdate(userId, {
          freeTrialUsed: true,
          freeTrialStartedAt: now,
          freeTrialEndsAt: ends
        });

        socket.emit("trial_started", {
          seconds: FREE_TRIAL_SECONDS
        });
      }

      const senderUser = await User.findById(userId);
      if (senderUser.blockedUsers.includes(receiverId)) return;

      const receiverUser = await User.findById(receiverId);

      // SAVE USER MESSAGE
      const chat = await ChatMessage.create({
        sender: userId,
        receiver: receiverId,
        message,
        status:
          receiverUser?.isSystemUser || onlineUsers.has(receiverId)
            ? "seen"
            : "sent"
      });

      io.to(userId).emit("receive_message", chat);
      io.to(receiverId).emit("receive_message", chat);

      // SYSTEM USER → AUTO SEEN
      if (receiverUser?.isSystemUser) {
        io.to(userId).emit("messages_seen", { by: receiverId });
      }

      /* 🤖 GEMINI AUTO REPLY */
      if (receiverUser?.isSystemUser) {
        io.to(userId).emit("typing", { senderId: receiverId });

        setTimeout(async () => {
          try {
            const aiReply = await getGeminiReply({
              systemName: receiverUser.name,
              gender: receiverUser.gender || "female",
              city: receiverUser.city || "nearby",
              userMessage: message
            });

            const aiMessage = await ChatMessage.create({
              sender: receiverId,
              receiver: userId,
              message: aiReply,
              status: "seen",
              isSystemReply: true
            });

            io.to(userId).emit("stop_typing", { senderId: receiverId });
            io.to(userId).emit("receive_message", aiMessage);
            io.to(userId).emit("messages_seen", { by: receiverId });
          } catch (err) {
            io.to(userId).emit("stop_typing", { senderId: receiverId });
          }
        }, 1200);
      }
    });

    /* ================= SEEN ================= */
    socket.on("mark_seen", async ({ withUser }) => {
      await ChatMessage.updateMany(
        {
          sender: withUser,
          receiver: userId,
          status: { $ne: "seen" }
        },
        { status: "seen" }
      );
      io.to(withUser).emit("messages_seen", { by: userId });
    });

    socket.on("disconnect", () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          socket.broadcast.emit("user_offline", { userId });
        }
      }
    });
  });
};
