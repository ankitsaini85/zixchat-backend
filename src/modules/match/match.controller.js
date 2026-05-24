import mongoose from "mongoose";
import User from "../user/user.model.js";
import Match from "./match.model.js";

/* ======================================================
   PROFILE-BASED MATCHES (NO QUIZ)
   ====================================================== */
export const generateMatchesForUser = async (req, res) => {
  const currentUserId = req.user.id;

  const currentUser = await User.findById(currentUserId).select(
    "blockedUsers isAdmin gender lookingFor city"
  );

  if (!currentUser || currentUser.isAdmin) {
    return res.json([]);
  }

  const blocked = currentUser.blockedUsers || [];

  // Fetch candidates: real users only (no system), exclude admins/banned, exclude self
  const candidates = await User.find({
    _id: { $ne: currentUserId },
    isAdmin: { $ne: true },
    isBanned: { $ne: true },
    isSystemUser: { $ne: true }
  }).select("name photo gender lookingFor city location");

  const matches = [];

  for (const user of candidates) {
    if (blocked.includes(user._id)) continue;

    // If user only wants specific gender
    if (
      currentUser.lookingFor &&
      currentUser.lookingFor !== "everyone" &&
      user.gender !== currentUser.lookingFor
    ) {
      continue;
    }

    // Simple profile-based compatibility
    let score = 75;
    if (currentUser.gender && user.lookingFor && user.lookingFor !== "everyone") {
      if (user.lookingFor === currentUser.gender) score += 5;
    }
    if (currentUser.city && user.city && currentUser.city.toLowerCase() === user.city.toLowerCase()) {
      score += 10;
    }

    score = Math.max(60, Math.min(98, score));

    await Match.findOneAndUpdate(
      { userA: currentUserId, userB: user._id },
      {
        userA: currentUserId,
        userB: user._id,
        compatibility: score
      },
      { upsert: true }
    );

    matches.push({
      userId: user._id,
      name: user.name,
      photo: user.photo || null,
      compatibility: score
    });
  }

  res.json(matches.sort((a, b) => b.compatibility - a.compatibility));
};

/* ======================================================
   PHASE 2A — NEARBY USERS (30–40 KM)
   ====================================================== */
export const getNearbyUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const currentUser = await User.findById(currentUserId).select(
      "location isAdmin"
    );

    // ❌ Admins never get nearby users
    if (!currentUser || currentUser.isAdmin) {
      return res.json([]);
    }

    if (!currentUser.location?.coordinates) {
      return res.status(400).json({
        message: "User location not found"
      });
    }

    const [lng, lat] = currentUser.location.coordinates;

    const nearbyUsers = await User.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [lng, lat]
          },
          distanceField: "distance",
          maxDistance: 40000, // 40 km
          spherical: true,
          query: {
            isSystemUser: true,
            createdFor: new mongoose.Types.ObjectId(currentUserId),
            isAdmin: { $ne: true },
            isBanned: { $ne: true }
          }
        }
      },
      { $limit: 15 },
      {
        $project: {
          _id: 1,
          name: 1,
          gender: 1,
          photo: 1,
          location: 1,
          distanceKm: {
            $round: [{ $divide: ["$distance", 1000] }, 1]
          }
        }
      }
    ]);

    res.json({
      me: {
        lat,
        lng
      },
      users: nearbyUsers.map((u) => ({
        userId: u._id,
        name: u.name,
        gender: u.gender,
        photo: u.photo || null,
        distanceKm: u.distanceKm,
        lat: u.location?.coordinates?.[1] || lat,
        lng: u.location?.coordinates?.[0] || lng
      }))
    });
  } catch (err) {
    console.error("Nearby users error:", err);
    res.status(500).json({
      message: "Failed to fetch nearby users"
    });
  }
};
