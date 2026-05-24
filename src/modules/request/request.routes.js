import express from "express";
import protect from "../../middlewares/auth.middleware.js";
import requireProfileComplete from "../../middlewares/profileCcmplete.middleware.js";
import {
  sendRequest,
  getRequestStatus
} from "./request.controller.js";

const router = express.Router();

/* SEND REQUEST */
router.post(
  "/send",
  protect,
  requireProfileComplete,
  sendRequest
);

/* CHECK REQUEST STATUS */
router.get(
  "/status/:requestId",
  protect,
  requireProfileComplete,
  getRequestStatus
);

export default router;
