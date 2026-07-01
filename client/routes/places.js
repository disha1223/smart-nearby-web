const express = require("express");
const router = express.Router();
const axios = require("axios");

const MOOD_CONFIG = {
  work: {
    "$":   "small budget cafes with wifi",
    "$$":  "cafes with wifi",
    "$$$": "premium coworking cafes",
    "":    "cafes with wifi",
  },
  date: {
    "$":   "affordable romantic restaurants",
    "$$":  "mid range romantic restaurants",
    "$$$": "fine dining romantic restaurants",
    "":    "romantic restaurants",
  },
  "quick-bite": {
    "$":   "street food stalls cheap eats",
    "$$":  "fast food restaurants",
    "$$$": "quick casual dining",
    "":    "fast food nearby",
  },
  budget: {
    "$":   "cheapest food under 100 rupees",
    "$$":  "affordable restaurants under 200 rupees",
    "$$$": "budget friendly restaurants",
    "":    "cheap eats nearby",
  },
};

router.get("/", async (req, res) => {
  const { mood, lat, lon, radius = 3, maxPrice } = req.query;

  if (!mood || !lat || !lon) {
    return res.status(400).json({ error: "mood, lat and lon are required" });
  }

  const moodQueries = MOOD_CONFIG[mood];
  if (!moodQueries) {
    return res.status(400).json({ error: "Invalid mood" });
  }

  const query = moodQueries[maxPrice] || moodQueries[""];

  try {
    const response = await axios.get("https://serpapi.com/search", {
      params: {
        api_key: process.env.SERPAPI_KEY,
        engine: "google_maps",
        q: query,
        ll: `@${lat},${lon},14z`,
        type: "search",
        hl: "en",
      },
    });

    const results = response.data.local_results || [];
    res.json({ mood, query, results, total: results.length });

  } catch (err) {
    console.error("ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch places" });
  }
});

module.exports = router;