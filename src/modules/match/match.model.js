import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    userA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    userB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    compatibility: {
      type: Number, // 0–100
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Match", matchSchema);
