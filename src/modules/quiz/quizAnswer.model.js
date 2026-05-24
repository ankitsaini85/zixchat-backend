import mongoose from "mongoose";

const quizAnswerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuizQuestion",
      required: true
    },
    answer: {
      type: Number, // 1–5
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("QuizAnswer", quizAnswerSchema);
