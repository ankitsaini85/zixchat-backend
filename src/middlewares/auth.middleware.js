import jwt from "jsonwebtoken";

export default function protect(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 ENSURE req.user.id EXISTS
    req.user = {
      id: decoded.id || decoded._id,
      isAdmin: decoded.isAdmin
    };

    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}
