import express from "express";
import protect from "../../middlewares/auth.middleware.js";
import { 
  createPaymentOrder, 
  paymentCallback, 
  getOrderStatus,
  startFreeTrial,
  checkAccess
} from "./payment.controller.js";

const router = express.Router();

router.post("/create", protect, createPaymentOrder);
router.post("/callback", express.urlencoded({ extended: true }), paymentCallback);
router.get("/status/:orderId", protect, getOrderStatus);
router.post("/trial/start", protect, startFreeTrial);
router.get("/access", protect, checkAccess);

export default router;
