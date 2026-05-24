import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../user/user.model.js";
import Request from "../request/request.model.js";

/* =======================
   🔐 TOKEN
   ======================= */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

/* =======================
   🌍 GEOCODING: CITY TO COORDS
   ======================= */
const geocodeCity = async (cityName) => {
  if (!cityName || !cityName.trim()) return null;
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1`,
      {
        headers: { "User-Agent": "ZixChat/1.0" }
      }
    );
    
    if (!response.ok) return null;
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
  } catch (error) {
    console.error("Geocoding error:", error);
  }
  
  return null;
};

/* =======================
   🇮🇳 RANDOM INDIAN NAMES
   ======================= */
const maleNames = [
  "Aman", "Rahul", "Rohit", "Karan", "Vikas",
  "Arjun", "Sahil", "Ankit", "Nikhil", "Varun"
];

const femaleNames = [
  "Riya", "Anjali", "Neha", "Pooja", "Simran",
  "Kriti", "Aisha", "Isha", "Sneha", "Kajal"
];

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* =======================
   🖼️ CDN AVATAR POOLS
   ======================= */
// Realistic AI faces (CDN, no API, free)
const maleAvatars = [
  "https://randomuser.me/api/portraits/men/32.jpg",
  "https://randomuser.me/api/portraits/men/45.jpg",
  "https://randomuser.me/api/portraits/men/61.jpg",
  "https://randomuser.me/api/portraits/men/72.jpg",
  "https://randomuser.me/api/portraits/men/85.jpg"
];

const femaleAvatars = [
  "https://randomuser.me/api/portraits/women/31.jpg",
  "https://randomuser.me/api/portraits/women/44.jpg",
  "https://randomuser.me/api/portraits/women/56.jpg",
  "https://randomuser.me/api/portraits/women/68.jpg",
  "https://randomuser.me/api/portraits/women/79.jpg"
];

const randomAvatar = (gender) =>
  gender === "female"
    ? randomFrom(femaleAvatars)
    : randomFrom(maleAvatars);

/* =======================
   🤖 CREATE SYSTEM USERS
   ======================= */
const createSystemUsers = async (realUser, lat, lng, city) => {
  const users = [];
  const hashedSystemPassword = await bcrypt.hash("system_user", 10);

  // Pools copied so we can sample without replacement to reduce duplicates per batch
  const maleNamesPool = [...maleNames];
  const femaleNamesPool = [...femaleNames];
  const maleAvatarsPool = [
    "https://randomuser.me/api/portraits/men/32.jpg",
    "https://randomuser.me/api/portraits/men/36.jpg",
    "https://randomuser.me/api/portraits/men/41.jpg",
    "https://randomuser.me/api/portraits/men/45.jpg",
    "https://randomuser.me/api/portraits/men/53.jpg",
    "https://randomuser.me/api/portraits/men/58.jpg",
    "https://randomuser.me/api/portraits/men/64.jpg",
    "https://randomuser.me/api/portraits/men/67.jpg"
  ];

  const femaleAvatarsPool = [
    "https://randomuser.me/api/portraits/women/44.jpg",
    "https://randomuser.me/api/portraits/women/47.jpg",
    "https://randomuser.me/api/portraits/women/52.jpg",
    "https://randomuser.me/api/portraits/women/56.jpg",
    "https://randomuser.me/api/portraits/women/65.jpg",
    "https://randomuser.me/api/portraits/women/68.jpg",
    "https://randomuser.me/api/portraits/women/71.jpg",
    "https://randomuser.me/api/portraits/women/74.jpg"
  ];

  const takeRandom = (pool, fallbackPool) => {
    if (pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      return pool.splice(idx, 1)[0];
    }
    // Fallback if pool exhausted
    return randomFrom(fallbackPool);
  };

  for (let i = 0; i < 10; i++) {
    const isFemale = i % 2 === 0;

    const name = isFemale
      ? takeRandom(femaleNamesPool, femaleNames)
      : takeRandom(maleNamesPool, maleNames);

    const avatar = isFemale
      ? takeRandom(femaleAvatarsPool, femaleAvatars)
      : takeRandom(maleAvatarsPool, maleAvatars);

    users.push({
      name,
      email: `system_${realUser._id}_${i}@zixchat.ai`,
      password: hashedSystemPassword,
      gender: isFemale ? "female" : "male",
      photo: avatar,
      lookingFor: "everyone",
      bio: "Hi 😊 Nice to meet you!",
      quizCompleted: true,
      profileCompleted: true,
      isSystemUser: true,
      createdFor: realUser._id,
      city: city || "nearby",
      location: {
        type: "Point",
        coordinates: [
          lng + (Math.random() - 0.5) * 0.4,
          lat + (Math.random() - 0.5) * 0.4
        ]
      }
    });
  }

  await User.insertMany(users);
};


/* =======================
   📝 SIGNUP
   ======================= */
export const signup = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      lat,
      lng,
      city,
      dob,
      gender,
      sexualOrientation,
      interestedIn,
      relationshipIntent,
      distanceKm,
      school,
      drinking,
      smoking,
      exercise,
      pets,
      identity,
      interests,
      bio
    } = req.body;

    const latNum = Number(lat);
    const lngNum = Number(lng);
    let hasCoords = Number.isFinite(latNum) && Number.isFinite(lngNum);
    let finalLat = latNum;
    let finalLng = lngNum;
    
    // If no coords but city provided, geocode the city
    if (!hasCoords && city && city.trim()) {
      const geocoded = await geocodeCity(city);
      if (geocoded) {
        finalLat = geocoded.lat;
        finalLng = geocoded.lng;
        hasCoords = true;
      }
    }
    
    if (!hasCoords && !city) {
      return res.status(400).json({
        message: "Please share your city or enable location"
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const userData = {
      name,
      email,
      password: hashedPassword,
      phone,
      city,
      dob: dob ? new Date(dob) : undefined,
      gender,
      sexualOrientation,
      lookingFor: interestedIn || "everyone",
      relationshipIntent,
      distancePreferenceKm: distanceKm || 25,
      school,
      drinking,
      smoking,
      exercise,
      pets,
      identity,
      interests: Array.isArray(interests) ? interests : [],
      bio,
      profileCompleted: true,
      quizCompleted: true
    };

    if (hasCoords) {
      userData.location = {
        type: "Point",
        coordinates: [finalLng, finalLat]
      };
    }

    const user = await User.create(userData);

    console.log("✅ User created:", user._id, user.email);

    // 🔥 CREATE SYSTEM USERS WITH PHOTOS (only if coords exist)
    if (hasCoords) {
      console.log("🤖 Creating system users...");
      await createSystemUsers(user, finalLat, finalLng, city);
      console.log("✅ System users created");
    } else {
      console.log("⚠️ No coords, skipping system users");
    }

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photo: user.photo,
        gender: user.gender,
        lookingFor: user.lookingFor,
        bio: user.bio,
        profileCompleted: user.profileCompleted,
        quizCompleted: user.quizCompleted,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Signup failed" });
  }
};

/* =======================
   🔑 LOGIN
   ======================= */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔑 Login attempt:", email);

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      console.log("❌ User not found:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.password) {
      console.log("❌ User has no password (system user?):", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log("❌ Invalid password for:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("✅ Login successful:", user._id);

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photo: user.photo,
        gender: user.gender,
        lookingFor: user.lookingFor,
        bio: user.bio,
        profileCompleted: user.profileCompleted,
        quizCompleted: user.quizCompleted,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error("🔥 Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};
