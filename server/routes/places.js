// server/routes/places.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

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

const FALLBACK_IMAGES = {
  study: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600",
  hangout: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600",
  "quick-bite": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600",
  budget: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600",
  nightlife: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600",
  gaming: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600",
  fitness: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600",
  rentals: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600",
  beaches: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600",
  "hidden-gems": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600",
};

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
  const { mood, q, lat, lon, radius = 3, maxPrice } = req.query;

  if (!lat || !lon || (!mood && !q)) {
    return res.status(400).json({ error: "lat, lon and mood or a search term are required" });
  }

  const query = q ? q : (MOOD_QUERIES[mood] || mood);
  const userLat = parseFloat(lat);
  const userLon = parseFloat(lon);
  const fallbackImg = FALLBACK_IMAGES[mood] || "";

  try {
    const serpRes = await axios.get("https://serpapi.com/search", {
      params: {
        engine: "google_maps",
        q: query,
        ll: `@${lat},${lon},14z`,
        type: "search",
        api_key: process.env.SERPAPI_KEY,
      },
    });

    let results = (serpRes.data.local_results || [])
      .filter((r) => r.gps_coordinates?.latitude && r.gps_coordinates?.longitude)
      .map((r) => ({
        title: r.title,
        type: r.type || mood || "Place",
        address: r.address || "",
        lat: r.gps_coordinates.latitude,
        lon: r.gps_coordinates.longitude,
        rating: r.rating || 0,
        reviews: r.reviews || 0,
        price_level: r.price || "",
        open_now: r.open_now ?? true,
        open_state: r.open_now === false ? "Closed" : "Open",
        thumbnail: r.thumbnail || r.serpapi_thumbnail || fallbackImg,
        phone: r.phone || "",
        distance: getDistanceKm(userLat, userLon, r.gps_coordinates.latitude, r.gps_coordinates.longitude),
      }))
      .filter((p) => p.distance <= Number(radius));

    if (maxPrice) {
      results = results.filter((p) => p.price_level === maxPrice);
    }

    res.json({ mood: mood || q, results, total: results.length });
  } catch (err) {
    console.error("SerpApi error:", err.message);
    res.status(500).json({ error: "Failed to fetch places" });
  }
});

router.get("/trending", async (req, res) => {
  const { lat, lon, radius = 5 } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: "lat and lon are required" });
  }

  const userLat = parseFloat(lat);
  const userLon = parseFloat(lon);

  try {
    const serpRes = await axios.get("https://serpapi.com/search", {
      params: {
        engine: "google_maps",
        q: "popular restaurants cafes",
        ll: `@${lat},${lon},14z`,
        type: "search",
        api_key: process.env.SERPAPI_KEY,
      },
    });

    let results = (serpRes.data.local_results || [])
      .filter((r) => r.gps_coordinates?.latitude && r.gps_coordinates?.longitude)
      .map((r) => ({
        title: r.title,
        type: r.type || "Popular",
        address: r.address || "",
        lat: r.gps_coordinates.latitude,
        lon: r.gps_coordinates.longitude,
        rating: r.rating || 0,
        reviews: r.reviews || 0,
        price_level: r.price || "",
        open_state: r.open_now === false ? "Closed" : "Open",
        thumbnail: r.thumbnail || r.serpapi_thumbnail || "",
        phone: r.phone || "",
        distance: getDistanceKm(userLat, userLon, r.gps_coordinates.latitude, r.gps_coordinates.longitude),
      }))
      .filter((p) => p.distance <= Number(radius))
      .filter((p) => p.rating >= 4.0 && p.reviews >= 20)
      .sort((a, b) => b.reviews - a.reviews)
      .slice(0, 10);

    res.json({ results, total: results.length });
  } catch (err) {
    console.error("Trending SerpApi error:", err.message);
    res.status(500).json({ error: "Failed to fetch trending places" });
  }
});

module.exports = router;