// server/routes/places.js
const express = require("express");
const axios = require("axios");
const router = express.Router();
const Place = require("../models/Place"); //
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

    const fetched = (serpRes.data.local_results || [])
      .filter(r => r.gps_coordinates?.latitude && r.gps_coordinates?.longitude)
      .map(r => ({
        title: r.title,
        type: r.type || mood || "Place",
        address: r.address || "",
        lat: r.gps_coordinates.latitude,
        lon: r.gps_coordinates.longitude,
        location: { type: "Point", coordinates: [r.gps_coordinates.longitude, r.gps_coordinates.latitude] },
        rating: r.rating || 0,
        reviews: r.reviews || 0,
        price_level: r.price || "",
        open_now: r.open_now ?? true,
        image: r.thumbnail || r.serpapi_thumbnail || fallbackImg,
        phone: r.phone || "",
        mood_tags: [mood || "search"],
      }));

    // Upsert into Mongo so the geo index has data to search
    for (const p of fetched) {
      await Place.updateOne(
        { title: p.title, address: p.address },
        { $set: p },
        { upsert: true }
      );
    }

    // Now let MongoDB do the distance math + sorting via the 2dsphere index
// Now let MongoDB do the distance math + sorting via the 2dsphere index
    const pipeline = [
      {
        $geoNear: {
          near: { type: "Point", coordinates: [userLon, userLat] },
          distanceField: "distanceMeters",
          maxDistance: Number(radius) * 1000, // radius is in km
          spherical: true,
        },
      },
    ];

    // ADD THIS — only return places matching the current mood
    if (mood) {
      pipeline.push({ $match: { mood_tags: mood } });
    }

    if (maxPrice) {
      pipeline.push({ $match: { price_level: maxPrice } });
    }
    const results = (await Place.aggregate(pipeline)).map(p => ({
      title: p.title,
      type: p.type,
      address: p.address,
      lat: p.lat,
      lon: p.lon,
      rating: p.rating,
      reviews: p.reviews,
      price_level: p.price_level,
      open_now: p.open_now,
      open_state: p.open_now === false ? "Closed" : "Open",
      thumbnail: p.image,
      phone: p.phone,
      distance: p.distanceMeters / 1000, // back to km, matches old field
    }));

    res.json({ mood: mood || q, results, total: results.length });
  } catch (err) {
    console.error("SerpApi/geo error:", err.message);
    res.status(500).json({ error: "Failed to fetch places" });
  }
});


router.get("/trending", async (req, res) => {
  const { lat, lon, radius = 5 } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: "lat and lon are required" });

  try {
    const results = await Place.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [parseFloat(lon), parseFloat(lat)] },
          distanceField: "distanceMeters",
          maxDistance: Number(radius) * 1000,
          spherical: true,
        },
      },
      { $match: { rating: { $gte: 4.0 }, reviews: { $gte: 20 } } },
      { $sort: { reviews: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      results: results.map(p => ({
        title: p.title, type: p.type, address: p.address,
        rating: p.rating, reviews: p.reviews, price_level: p.price_level,
        open_state: p.open_now === false ? "Closed" : "Open",
        thumbnail: p.image, phone: p.phone, distance: p.distanceMeters / 1000,
      })),
      total: results.length,
    });
  } catch (err) {
    console.error("Trending geo error:", err.message);
    res.status(500).json({ error: "Failed to fetch trending places" });
  }
});


// Simple image proxy — fetches the image once and passes it through
router.get("/image-proxy", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send("Missing url");

  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
    });
    res.set("Content-Type", response.headers["content-type"]);
    res.set("Cache-Control", "public, max-age=86400");
    res.send(response.data);
  } catch (err) {
    console.error("Image proxy error:", err.message);
    res.status(502).send("Failed to load image");
  }
});
module.exports = router;
