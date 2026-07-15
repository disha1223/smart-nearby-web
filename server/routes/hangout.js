const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const router = express.Router();
const HangoutSession = require("../models/HangoutSession");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

const MOOD_QUERIES = {
  study: "cafes with wifi",
  hangout: "casual restaurants cafes",
  "quick-bite": "fast food restaurants",
  budget: "cheap restaurants",
  nightlife: "bars pubs nightclubs",
  gaming: "gaming cafes arcades",
  fitness: "gyms fitness centers",
  rentals: "bike car rental shops",
  beaches: "beaches",
  "hidden-gems": "unique hidden local spots",
};

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function fetchCandidates({ lat, lon, radius, mood }) {
  const query = MOOD_QUERIES[mood] || mood || "restaurants cafes";

  const serpRes = await axios.get("https://serpapi.com/search", {
    params: {
      engine: "google_maps",
      q: query,
      ll: `@${lat},${lon},14z`,
      type: "search",
      api_key: process.env.SERPAPI_KEY,
    },
  });

  return (serpRes.data.local_results || [])
    .slice(0, 8)
    .map((r) => ({
      title: r.title,
      type: r.type || mood || "Place",
      address: r.address || "",
      rating: r.rating || 0,
      reviews: r.reviews || 0,
      price_level: r.price || "",
      thumbnail: r.thumbnail || r.serpapi_thumbnail || "",
      votes: [],
    }));
}

router.post("/create", auth, async (req, res) => {
  try {
    const { lat, lon, radius = 3, mood } = req.body;
    if (!lat || !lon) return res.status(400).json({ message: "lat and lon are required" });

    const user = await User.findById(req.userId);
    const candidates = await fetchCandidates({ lat, lon, radius, mood });

    if (candidates.length === 0) {
      return res.status(400).json({ message: "No places found nearby to vote on. Try a different mood or location." });
    }

    let code;
    let exists = true;
    while (exists) {
      code = generateCode();
      exists = await HangoutSession.findOne({ code });
    }

    const session = await HangoutSession.create({
      code,
      hostId: req.userId,
      members: [{ userId: req.userId, username: user.username }],
      lat,
      lon,
      radius,
      mood,
      candidates,
    });

    res.status(201).json({ code: session.code, sessionId: session._id });
  } catch (err) {
    console.error("Hangout create error:", err.message);
    res.status(500).json({ message: "Failed to create hangout session" });
  }
});

router.post("/:code/join", auth, async (req, res) => {
  try {
    const session = await HangoutSession.findOne({ code: req.params.code.toUpperCase() });
    if (!session) return res.status(404).json({ message: "Session not found" });

    const alreadyMember = session.members.some((m) => m.userId.toString() === req.userId);
    if (!alreadyMember) {
      const user = await User.findById(req.userId);
      session.members.push({ userId: req.userId, username: user.username });
      await session.save();
    }

    res.json(session);
  } catch (err) {
    console.error("Hangout join error:", err.message);
    res.status(500).json({ message: "Failed to join session" });
  }
});

router.get("/:code", auth, async (req, res) => {
  try {
    const session = await HangoutSession.findOne({ code: req.params.code.toUpperCase() });
    if (!session) return res.status(404).json({ message: "Session not found" });

    const isMember = session.members.some((m) => m.userId.toString() === req.userId);
    if (!isMember) return res.status(403).json({ message: "You're not part of this session yet" });

    res.json(session);
  } catch (err) {
    console.error("Hangout fetch error:", err.message);
    res.status(500).json({ message: "Failed to fetch session" });
  }
});

router.post("/:code/vote", auth, async (req, res) => {
  try {
    const { candidateIndex, vote } = req.body;
    if (!["yes", "no"].includes(vote)) return res.status(400).json({ message: "vote must be yes or no" });

    const session = await HangoutSession.findOne({ code: req.params.code.toUpperCase() });
    if (!session) return res.status(404).json({ message: "Session not found" });

    const isMember = session.members.some((m) => m.userId.toString() === req.userId);
    if (!isMember) return res.status(403).json({ message: "You're not part of this session" });

    const candidate = session.candidates[candidateIndex];
    if (!candidate) return res.status(400).json({ message: "Invalid candidate" });

    candidate.votes = candidate.votes.filter((v) => v.userId.toString() !== req.userId);
    candidate.votes.push({ userId: req.userId, vote });

    const totalMembers = session.members.length;
    const everyoneVotedOnEverything = session.candidates.every(
      (c) => c.votes.length >= totalMembers
    );

    if (everyoneVotedOnEverything && session.status === "voting") {
      let best = null;
      let bestYesCount = -1;
      session.candidates.forEach((c) => {
        const yesCount = c.votes.filter((v) => v.vote === "yes").length;
        if (
          yesCount > bestYesCount ||
          (yesCount === bestYesCount && best && c.rating > best.rating)
        ) {
          best = c;
          bestYesCount = yesCount;
        }
      });
      session.status = "decided";
      session.winner = best;
    }

    await session.save();
    res.json(session);
  } catch (err) {
    console.error("Hangout vote error:", err.message);
    res.status(500).json({ message: "Failed to record vote" });
  }
});

module.exports = router;