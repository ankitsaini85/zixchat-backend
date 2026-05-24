import express from "express";
import protect from "../../middlewares/auth.middleware.js";
import { reportUser } from "./report.controller.js";

const router = express.Router();

router.post("/", protect, reportUser);

export default router;
