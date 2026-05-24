import dotenv from "dotenv";
dotenv.config();
import chatRoutes from "./modules/chat/chat.routes.js";
import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes.js";
import quizRoutes from "./modules/quiz/quiz.routes.js";
import matchRoutes from "./modules/match/match.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import reportRoutes from "./modules/report/report.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import requestRoutes from "./modules/request/request.routes.js";
import paymentRoutes from "./modules/payment/payment.routes.js";
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/payment", paymentRoutes);
app.get("/", (req, res) => {
  res.json({ status: "ZixChat API is running" });
});

export default app;
