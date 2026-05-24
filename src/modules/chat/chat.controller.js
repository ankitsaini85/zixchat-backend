import ChatMessage from "./chat.model.js";

export const getChatHistory = async (req, res) => {
  const userId = req.user.id;
  const { withUser } = req.params;

  const messages = await ChatMessage.find({
    $or: [
      { sender: userId, receiver: withUser },
      { sender: withUser, receiver: userId }
    ]
  }).sort({ createdAt: 1 });

  res.json(messages);
};

import mongoose from "mongoose";

export const getInbox = async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id);

  const conversations = await ChatMessage.aggregate([
    {
      $match: {
        $or: [{ sender: userId }, { receiver: userId }]
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ["$sender", userId] },
            "$receiver",
            "$sender"
          ]
        },
        lastMessage: { $first: "$message" },
        lastAt: { $first: "$createdAt" }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    {
      $project: {
        userId: "$user._id",
        name: "$user.name",
        photo: "$user.photo",
        lastMessage: 1,
        lastAt: 1
      }
    },
    { $sort: { lastAt: -1 } }
  ]);

  res.json(conversations);
};
