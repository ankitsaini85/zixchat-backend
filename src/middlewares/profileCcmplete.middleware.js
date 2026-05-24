import User from "../modules/user/user.model.js";

const requireProfileComplete = async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user || !user.profileCompleted) {
    return res.status(403).json({
      message: "Complete your profile to use chat"
    });
  }

  next();
};

export default requireProfileComplete;
