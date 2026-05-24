import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },

    password: {
      type: String,
      required: true,
      select: false
    },

    isVerified: {
      type: Boolean,
      default: false
    },

    quizCompleted: {
      type: Boolean,
      default: false
    },

    bio: {
      type: String,
      maxLength: 500
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"]
    },

    dob: Date,
    phone: String,

    lookingFor: {
      type: String,
      enum: ["male", "female", "everyone"]
    },

    sexualOrientation: String,
    relationshipIntent: String,

    distancePreferenceKm: {
      type: Number,
      default: 25
    },

    school: String,
    drinking: String,
    smoking: String,
    exercise: String,
    pets: String,

    identity: {
      type: String,
      maxLength: 500
    },

    interests: [String],

    profileCompleted: {
      type: Boolean,
      default: false
    },

    photo: String,

    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    isAdmin: {
      type: Boolean,
      default: false
    },

    isBanned: {
      type: Boolean,
      default: false
    },

    banType: {
      type: String,
      enum: ["temporary", "permanent", null],
      default: null
    },

    banReason: String,
    banExpiresAt: Date,

    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    /* =======================
       🌍 LOCATION
       ======================= */
    location: {
      type: {
        type: String,
        enum: ["Point"]
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: undefined
      }
    },

    city: String,

    /* =======================
       🤖 SYSTEM USERS
       ======================= */
    isSystemUser: {
      type: Boolean,
      default: false
    },

    createdFor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    /* =======================
       🎁 FREE TRIAL (ONE TIME)
       ======================= */
    freeTrialUsed: {
      type: Boolean,
      default: false
    },

    freeTrialStartedAt: {
      type: Date,
      default: null
    },

    freeTrialEndsAt: {
      type: Date,
      default: null
    },

    /* =======================
       💳 SUBSCRIPTION
       ======================= */
    subscription: {
      isActive: {
        type: Boolean,
        default: false
      },
      plan: {
        type: String, // weekly / monthly
        enum: ["weekly", "monthly"],
        default: null
      },
      startedAt: Date,
      expiresAt: Date,
      gateway: {
        type: String,
        default: "watchpay"
      },
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        default: null
      }
    }
  },
  { timestamps: true }
);

/* ✅ SINGLE GEO INDEX */
userSchema.index({ location: "2dsphere" });

export default mongoose.model("User", userSchema);
