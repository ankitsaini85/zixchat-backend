import mongoose from "mongoose";

const requestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending"
    },
    autoAccepted: {
      type: Boolean,
      default: false
    },
    acceptedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

// 🚫 Prevent duplicates
requestSchema.index(
  { sender: 1, receiver: 1 },
  { unique: true }
);

export default mongoose.model("Request", requestSchema);
