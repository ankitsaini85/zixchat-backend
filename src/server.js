import http from "http";
import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";
import { setupSocket } from "./socket.js";

dotenv.config(
);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  const server = http.createServer(app);
  setupSocket(server);

  server.listen(PORT, () => {
    console.log(`✅ Server + Socket running on ${PORT}`);
  });

  // Connect to MongoDB after server starts
  connectDB();
};

startServer();
