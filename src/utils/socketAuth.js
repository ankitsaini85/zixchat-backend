import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();    
export const authenticateSocket = (socket) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch {
    return null;
  }
};
