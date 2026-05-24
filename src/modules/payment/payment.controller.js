import fetch from "node-fetch";
import Order from "../../models/Order.js";
import User from "../user/user.model.js";
import { buildPaymentSignString, buildCallbackSignString, md5GbkHex } from "../../utils/watchpay.js";
import mongoose from "mongoose";

const {
  WATCHPAY_MERCHANT_ID,
  WATCHPAY_KEY,
  WATCHPAY_API_DOMAIN,
  WATCHPAY_PAY_TYPE = "101",
  WATCHPAY_VERSION = "1.0",
  WATCHPAY_NOTIFY_URL
} = process.env;

function makeMchOrderNo() {
  const ts = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD${ts}${rand}`;
}

function fmtDate(d) {
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export const createPaymentOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan } = req.body;

    if (!plan || !["weekly", "monthly"].includes(plan)) {
      return res.status(400).json({ message: "Invalid plan" });
    }

    const amount = plan === "weekly" ? 105 : 199;
    const mchOrderNo = makeMchOrderNo();

    const order = new Order({
      mchOrderNo,
      user: userId,
      amount,
      plan,
      status: "PENDING"
    });
    await order.save();

    const order_date = fmtDate(new Date());

    const params = {
      version: WATCHPAY_VERSION,
      goods_name: `ZixChat ${plan} Subscription`,
      mch_id: WATCHPAY_MERCHANT_ID,
      mch_order_no: mchOrderNo,
      notify_url: WATCHPAY_NOTIFY_URL,
      order_date,
      pay_type: WATCHPAY_PAY_TYPE,
      trade_amount: String(amount)
    };

    const signSource = buildPaymentSignString(params);
    const sign = md5GbkHex(signSource, WATCHPAY_KEY);

    const rawBody =
      `goods_name=${params.goods_name}` +
      `&mch_id=${params.mch_id}` +
      `&mch_order_no=${params.mch_order_no}` +
      `&notify_url=${params.notify_url}` +
      `&order_date=${params.order_date}` +
      `&pay_type=${params.pay_type}` +
      `&trade_amount=${params.trade_amount}` +
      `&version=${params.version}` +
      `&sign_type=MD5` +
      `&sign=${sign}`;

    const gatewayDomain = WATCHPAY_API_DOMAIN || "https://api.watchglb.com";
    const gatewayUrl = `${gatewayDomain.replace(/\/$/, "")}/pay/web`;

    console.log("WATCHPAY create -> notify_url:", params.notify_url, "mchOrderNo:", mchOrderNo, "amount:", params.trade_amount);

    const gwResp = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0"
      },
      body: rawBody
    });

    const text = await gwResp.text();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }

    order.respData = parsed || text;
    await order.save();

    if (parsed && parsed.respCode === "SUCCESS") {
      return res.json({
        ok: true,
        payInfo: parsed.payInfo || null,
        orderId: order._id,
        raw: parsed
      });
    }

    return res.json({ ok: true, html: text, orderId: order._id });
  } catch (err) {
    console.error("Payment create error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const paymentCallback = async (req, res) => {
  try {
    const body = req.body || {};

    const signSource = buildCallbackSignString(body);
    const expected = md5GbkHex(signSource, WATCHPAY_KEY);
    const incoming = (body.sign || "").toLowerCase();

    if (expected !== incoming) {
      console.warn("Callback signature mismatch");
      return res.status(400).send("Signature error");
    }

    const mchOrderNo = body.mchOrderNo || body.mch_order_no;
    const tradeResult = String(body.tradeResult || "0");

    const order = await Order.findOne({ mchOrderNo });
    if (!order) return res.status(404).send("Order not found");

    if (order.status === "PAID") return res.send("success");

    if (tradeResult === "1") {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        const user = await User.findById(order.user).session(session);
        
        // Activate subscription
        const now = new Date();
        const expiresAt = new Date(now);
        if (order.plan === "weekly") {
          expiresAt.setDate(expiresAt.getDate() + 7);
        } else {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        }

        user.subscription = {
          isActive: true,
          plan: order.plan,
          startedAt: now,
          expiresAt,
          gateway: "watchpay",
          orderId: order._id
        };

        await user.save({ session });

        order.status = "PAID";
        order.gatewayOrderNo = body.orderNo || null;
        order.respData = body;
        await order.save({ session });

        await session.commitTransaction();
      } catch (e) {
        await session.abortTransaction();
        console.error("Callback processing failed", e);
        return res.status(500).send("Server error");
      } finally {
        session.endSession();
      }

      return res.send("success");
    }

    order.status = "FAILED";
    order.respData = body;
    await order.save();
    return res.send("success");
  } catch (err) {
    console.error("Payment callback error:", err);
    res.status(500).send("Server error");
  }
};

export const getOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    return res.json({ ok: true, status: order.status, order });
  } catch (err) {
    console.error("Order status error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const startFreeTrial = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (user.freeTrialUsed) {
      return res.status(400).json({ message: "Free trial already used" });
    }

    const now = new Date();
    const endsAt = new Date(now.getTime() + 40 * 1000); // 40 seconds

    user.freeTrialUsed = true;
    user.freeTrialStartedAt = now;
    user.freeTrialEndsAt = endsAt;
    await user.save();

    res.json({ 
      ok: true, 
      trialEndsAt: endsAt,
      message: "Free trial activated for 40 seconds" 
    });
  } catch (err) {
    console.error("Free trial error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const checkAccess = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    const now = new Date();
    let hasAccess = false;
    let reason = null;
    let trialEndsAt = null;

    // Check active subscription
    if (user.subscription?.isActive && user.subscription.expiresAt > now) {
      hasAccess = true;
    }
    // Check free trial
    else if (user.freeTrialStartedAt && user.freeTrialEndsAt > now) {
      hasAccess = true;
      trialEndsAt = user.freeTrialEndsAt;
      reason = "trial";
    }
    // No access
    else {
      hasAccess = false;
      reason = user.freeTrialUsed ? "trial_expired" : "no_trial";
    }

    res.json({ 
      hasAccess, 
      reason,
      trialEndsAt,
      subscription: user.subscription 
    });
  } catch (err) {
    console.error("Check access error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
