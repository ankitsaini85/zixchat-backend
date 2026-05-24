import mongoose from "mongoose";
import seedQuiz from "../utils/seedQuiz.js";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
    });
    console.log("✅ MongoDB connected");
    
    // Seed quiz questions if needed
    await seedQuiz();
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    console.error("Retrying in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;
