import express from "express";
import protect from "../../middlewares/auth.middleware.js";
import { getQuestions, submitAnswer } from "./quiz.controller.js";

const router = express.Router();

router.get("/questions", protect, getQuestions);
router.post("/answer", protect, submitAnswer);

export default router;
