const express = require("express");
const router = express.Router();

const MOODS = [
  { key: "study", emoji: "📚", label: "Study", sub: "Wifi · Quiet", color: "#667eea", bg: "#e0e4ff" },
  { key: "hangout", emoji: "🍔", label: "Hangout", sub: "Cozy · Casual", color: "#ec4899", bg: "#fce7f3" },
  { key: "quick-bite", emoji: "🍕", label: "Quick Bite", sub: "Fast · Easy", color: "#f59e0b", bg: "#fef3c7" },
  { key: "budget", emoji: "🪙", label: "Budget", sub: "Cheap · Value", color: "#10b981", bg: "#d1fae5" },
  { key: "nightlife", emoji: "🎉", label: "Nightlife", sub: "Clubs · Music", color: "#ec4899", bg: "#fdf2f8" },
  { key: "gaming", emoji: "🎮", label: "Gaming", sub: "Arcade · Fun", color: "#8b5cf6", bg: "#f5f3ff" },
  { key: "fitness", emoji: "🏋️", label: "Fitness", sub: "Gym · Active", color: "#06b6d4", bg: "#ecfeff" },
  { key: "rentals", emoji: "🚗", label: "Rentals", sub: "Bikes · Cars", color: "#84cc16", bg: "#f7fee7" },
];

const CITIES = [
  { key: "manipal", label: "Manipal", lat: 13.3525, lon: 74.7934 },
  { key: "mangalore", label: "Mangalore", lat: 12.9716, lon: 74.8631 },
  { key: "bangalore", label: "Bangalore", lat: 12.9716, lon: 77.5946 },
  { key: "mumbai", label: "Mumbai", lat: 19.0760, lon: 72.8777 },
  { key: "delhi", label: "Delhi", lat: 28.7041, lon: 77.1025 },
  { key: "hyderabad", label: "Hyderabad", lat: 17.3850, lon: 78.4867 },
  { key: "pune", label: "Pune", lat: 18.5204, lon: 73.8567 },
  { key: "chennai", label: "Chennai", lat: 13.0827, lon: 80.2707 },
];

// GET /api/config/moods
router.get("/moods", (req, res) => {
  res.json(MOODS);
});

// GET /api/config/cities
router.get("/cities", (req, res) => {
  res.json(CITIES);
});

module.exports = router;