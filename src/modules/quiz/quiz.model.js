import mongoose from "mongoose";

const quizQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  options: [
    {
      label: String,
      value: Number // 1–5
    }
  ]
});

export default mongoose.model("QuizQuestion", quizQuestionSchema);
