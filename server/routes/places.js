const express = require("express");
const router = express.Router();
const Place = require("../models/Place");

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

router.get("/", async (req, res) => {
  const { mood, lat, lon, radius = 3, maxPrice } = req.query;

  if (!mood || !lat || !lon) {
    return res.status(400).json({ error: "mood, lat and lon are required" });
  }

  try {
    const filter = { mood_tags: mood };
    if (maxPrice) filter.price_level = maxPrice;

    let results = await Place.find(filter).lean();

results = results
  .map((p) => {
    //  Safely convert Mongoose Map to plain object
    let hours = {};
    if (p.hours instanceof Map) {
      hours = Object.fromEntries(p.hours);
    } else if (p.hours && typeof p.hours === "object") {
      hours = p.hours;
    }

    return {
      ...p,
      hours,
      distance: getDistanceKm(parseFloat(lat), parseFloat(lon), p.lat, p.lon),
    };
  })
  .filter((p) => p.distance <= Number(radius));

    res.json({ mood, results, total: results.length });
  } catch (err) {
    console.error("ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch places" });
  }
});

module.exports = router;