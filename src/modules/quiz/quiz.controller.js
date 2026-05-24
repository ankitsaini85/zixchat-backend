import QuizQuestion from "./quiz.model.js";
import QuizAnswer from "./quizAnswer.model.js";
import User from "../user/user.model.js";
export const getQuestions = async (req, res) => {
  const questions = await QuizQuestion.find();
  res.json(questions);
};

export const submitAnswer = async (req, res) => {
  const { questionId, answer } = req.body;
  const userId = req.user.id;

  await QuizAnswer.findOneAndUpdate(
    { userId, questionId },
    { answer },
    { upsert: true }
  );

  const totalQuestions = await QuizQuestion.countDocuments();
  const answered = await QuizAnswer.countDocuments({ userId });

  if (answered === totalQuestions) {
    await User.findByIdAndUpdate(userId, {
      quizCompleted: true
    });
  }

  res.json({ success: true });
};
