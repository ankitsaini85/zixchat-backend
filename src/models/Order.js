import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  mchOrderNo: { 
    type: String, 
    required: true, 
    unique: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  plan: {
    type: String,
    enum: ["weekly", "monthly"],
    required: true
  },
  status: { 
    type: String, 
    enum: ["PENDING", "PAID", "FAILED", "CANCELLED"], 
    default: "PENDING" 
  },
  gatewayOrderNo: { 
    type: String, 
    default: null 
  },
  respData: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  }
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
