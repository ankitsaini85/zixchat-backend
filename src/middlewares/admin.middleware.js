import User from "../modules/user/user.model.js";

const requireAdmin = async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: "Admin access only" });
  }

  next();
};

export default requireAdmin;
