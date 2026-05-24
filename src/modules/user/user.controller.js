import User from "./user.model.js";
import cloudinary from "../../config/cloudinary.js";

/* ================= GET MY PROFILE ================= */
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "name email bio gender lookingFor photo profileCompleted quizCompleted isAdmin phone dob sexualOrientation relationshipIntent distancePreferenceKm school drinking smoking exercise pets identity interests city"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return user object with id field for frontend consistency
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      gender: user.gender,
      lookingFor: user.lookingFor,
      photo: user.photo,
      profileCompleted: user.profileCompleted,
      quizCompleted: user.quizCompleted,
      isAdmin: user.isAdmin,
      phone: user.phone,
      dob: user.dob,
      sexualOrientation: user.sexualOrientation,
      relationshipIntent: user.relationshipIntent,
      distancePreferenceKm: user.distancePreferenceKm,
      school: user.school,
      drinking: user.drinking,
      smoking: user.smoking,
      exercise: user.exercise,
      pets: user.pets,
      identity: user.identity,
      interests: user.interests,
      city: user.city
    });
  } catch {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

/* ================= UPDATE PROFILE ================= */
export const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const {
    bio,
    gender,
    lookingFor,
    sexualOrientation,
    relationshipIntent,
    distancePreferenceKm,
    school,
    drinking,
    smoking,
    exercise,
    pets,
    identity,
    interests,
    dob,
    phone,
    city
  } = req.body;

  const user = await User.findByIdAndUpdate(
    userId,
    {
      bio,
      gender,
      lookingFor,
      sexualOrientation,
      relationshipIntent,
      distancePreferenceKm,
      school,
      drinking,
      smoking,
      exercise,
      pets,
      identity,
      interests,
      dob,
      phone,
      city,
      profileCompleted: true
    },
    { new: true }
  ).select(
    "name email bio gender lookingFor photo profileCompleted quizCompleted isAdmin phone dob sexualOrientation relationshipIntent distancePreferenceKm school drinking smoking exercise pets identity interests city"
  );

  // Return user object with id field for frontend consistency
  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    bio: user.bio,
    gender: user.gender,
    lookingFor: user.lookingFor,
    photo: user.photo,
    profileCompleted: user.profileCompleted,
    quizCompleted: user.quizCompleted,
    isAdmin: user.isAdmin,
    phone: user.phone,
    dob: user.dob,
    sexualOrientation: user.sexualOrientation,
    relationshipIntent: user.relationshipIntent,
    distancePreferenceKm: user.distancePreferenceKm,
    school: user.school,
    drinking: user.drinking,
    smoking: user.smoking,
    exercise: user.exercise,
    pets: user.pets,
    identity: user.identity,
    interests: user.interests,
    city: user.city
  });
};

/* ================= GET USER BY ID ================= */
export const getUserProfile = async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id).select(
    "name bio gender lookingFor photo"
  );

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(user);
};

/* ================= UPLOAD PHOTO ================= */
export const uploadProfilePhoto = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const base64 = req.file.buffer.toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${base64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "zixchat_profiles",
      resource_type: "auto",
      max_bytes: 10485760
    });

    const user = await User.findByIdAndUpdate(
      userId,
      { photo: result.secure_url },
      { new: true }
    );

    res.json({ photo: user.photo });
  } catch (err) {
    console.error("Photo upload error:", err);
    res.status(500).json({ message: "Photo upload failed" });
  }
};

/* ================= BLOCK USER ================= */
export const blockUser = async (req, res) => {
  const userId = req.user.id;
  const { targetUserId } = req.body;

  if (userId === targetUserId) {
    return res.status(400).json({ message: "Cannot block yourself" });
  }

  await User.findByIdAndUpdate(userId, {
    $addToSet: { blockedUsers: targetUserId }
  });

  res.json({ message: "User blocked successfully" });
};

/* =================================================
   📍 NEARBY USERS (PHASE 2B)
   ================================================= */
export const getNearbyUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const radiusKm = Number(req.query.radius || 40);

    const currentUser = await User.findById(userId).select(
      "location blockedUsers"
    );

    if (!currentUser?.location?.coordinates) {
      return res.status(400).json({
        message: "User location not set"
      });
    }

    const [lng, lat] = currentUser.location.coordinates;
    const blocked = currentUser.blockedUsers || [];

    const users = await User.find({
      _id: {
        $ne: userId,
        $nin: blocked
      },
      isAdmin: false,
      isBanned: false,
      $or: [
        { isSystemUser: false },
        { isSystemUser: true, createdFor: userId }
      ],
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat]
          },
          $maxDistance: radiusKm * 1000
        }
      }
    })
      .limit(15)
      .select("name gender photo city isSystemUser");

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to fetch nearby users"
    });
  }
};

/* =================================================
   🔧 CREATE MISSING SYSTEM USERS (DEBUG ENDPOINT)
   ================================================= */
export const createMissingSystemUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.location?.coordinates) {
      return res.status(400).json({
        message: "User has no location. Cannot create system users."
      });
    }

    // Check if system users already exist
    const existingSystemUsers = await User.countDocuments({
      isSystemUser: true,
      createdFor: userId
    });

    if (existingSystemUsers >= 10) {
      return res.json({
        message: `Already have ${existingSystemUsers} system users`
      });
    }

    // Create system users
    const [lng, lat] = user.location.coordinates;
    const maleNames = ["Aman", "Rahul", "Rohit", "Karan", "Vikas"];
    const femaleNames = ["Riya", "Anjali", "Neha", "Pooja", "Simran"];
    const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.default.hash("system_user", 10);

    const systemUsers = [];
    for (let i = 0; i < 10; i++) {
      const isFemale = i % 2 === 0;
      systemUsers.push({
        name: isFemale ? randomFrom(femaleNames) : randomFrom(maleNames),
        email: `system_${userId}_${i}@zixchat.ai`,
        password: hashedPassword,
        gender: isFemale ? "female" : "male",
        lookingFor: "everyone",
        bio: "Hi! I'm new here 😊",
        quizCompleted: true,
        profileCompleted: true,
        isSystemUser: true,
        createdFor: userId,
        location: {
          type: "Point",
          coordinates: [
            lng + (Math.random() - 0.5) * 0.4,
            lat + (Math.random() - 0.5) * 0.4
          ]
        }
      });
    }

    await User.insertMany(systemUsers);

    res.json({
      message: `Created ${systemUsers.length} system users successfully`,
      count: systemUsers.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to create system users"
    });
  }
};
