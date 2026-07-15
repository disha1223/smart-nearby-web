const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const SafetyRating = require("../models/SafetyRating");

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

router.get("/", async (req, res) => {
  try {
    const { title, address } = req.query;
    if (!title || !address) return res.status(400).json({ message: "title and address are required" });

    const ratings = await SafetyRating.find({ placeTitle: title, placeAddress: address });

    if (ratings.length === 0) {
      return res.json({ totalRatings: 0, overallAvg: null, byTimeOfDay: {} });
    }

    const overallAvg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

    const byTimeOfDay = {};
    ["day", "evening", "night"].forEach((tod) => {
      const subset = ratings.filter((r) => r.timeOfDay === tod);
      if (subset.length > 0) {
        byTimeOfDay[tod] = {
          avg: Math.round((subset.reduce((sum, r) => sum + r.rating, 0) / subset.length) * 10) / 10,
          count: subset.length,
        };
      }
    });

    res.json({
      totalRatings: ratings.length,
      overallAvg: Math.round(overallAvg * 10) / 10,
      byTimeOfDay,
    });
  } catch (err) {
    console.error("Safety fetch error:", err.message);
    res.status(500).json({ message: "Failed to fetch safety data" });
  }
});

router.get("/mine", auth, async (req, res) => {
  try {
    const { title, address } = req.query;
    if (!title || !address) return res.status(400).json({ message: "title and address are required" });

    const mine = await SafetyRating.find({ placeTitle: title, placeAddress: address, userId: req.userId });
    res.json({ ratings: mine });
  } catch (err) {
    console.error("Safety fetch mine error:", err.message);
    res.status(500).json({ message: "Failed to fetch your ratings" });
  }
});

router.post("/rate", auth, async (req, res) => {
  try {
    const { placeTitle, placeAddress, rating, timeOfDay } = req.body;

    if (!placeTitle || !placeAddress) return res.status(400).json({ message: "placeTitle and placeAddress are required" });
    if (!["day", "evening", "night"].includes(timeOfDay)) return res.status(400).json({ message: "Invalid timeOfDay" });
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: "rating must be 1-5" });

    await SafetyRating.findOneAndUpdate(
      { placeTitle, placeAddress, userId: req.userId, timeOfDay },
      { rating },
      { upsert: true, new: true }
    );

    res.json({ message: "Rating saved" });
  } catch (err) {
    console.error("Safety rate error:", err.message);
    res.status(500).json({ message: "Failed to save rating" });
  }
});

module.exports = router;