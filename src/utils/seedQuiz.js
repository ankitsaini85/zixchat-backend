import mongoose from "mongoose";
import dotenv from "dotenv";
import QuizQuestion from "../modules/quiz/quiz.model.js";

dotenv.config();

const seedQuiz = async () => {
  try {
    // Check if questions already exist
    const count = await QuizQuestion.countDocuments();
    if (count > 0) {
      console.log("✅ Quiz questions already seeded");
      return;
    }

    await QuizQuestion.insertMany([
      {
        question: "I enjoy deep conversations.",
        options: [
          { label: "Strongly Disagree", value: 1 },
          { label: "Disagree", value: 2 },
          { label: "Neutral", value: 3 },
          { label: "Agree", value: 4 },
          { label: "Strongly Agree", value: 5 }
        ]
      },
      {
        question: "I prefer staying in over going out.",
        options: [
          { label: "Strongly Disagree", value: 1 },
          { label: "Disagree", value: 2 },
          { label: "Neutral", value: 3 },
          { label: "Agree", value: 4 },
          { label: "Strongly Agree", value: 5 }
        ]
      },
      {
        question: "I value honesty above all else.",
        options: [
          { label: "Strongly Disagree", value: 1 },
          { label: "Disagree", value: 2 },
          { label: "Neutral", value: 3 },
          { label: "Agree", value: 4 },
          { label: "Strongly Agree", value: 5 }
        ]
      },
      {
        question: "I am comfortable with silence.",
        options: [
          { label: "Strongly Disagree", value: 1 },
          { label: "Disagree", value: 2 },
          { label: "Neutral", value: 3 },
          { label: "Agree", value: 4 },
          { label: "Strongly Agree", value: 5 }
        ]
      },
      {
        question: "I like trying new things.",
        options: [
          { label: "Strongly Disagree", value: 1 },
          { label: "Disagree", value: 2 },
          { label: "Neutral", value: 3 },
          { label: "Agree", value: 4 },
          { label: "Strongly Agree", value: 5 }
        ]
      }
    ]);

    console.log("✅ Quiz questions seeded successfully");
  } catch (error) {
    console.error("❌ Quiz seeding failed:", error.message);
  }
};

// If run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await mongoose.connect(process.env.MONGO_URI);
  await seedQuiz();
  process.exit();
}

export default seedQuiz;
