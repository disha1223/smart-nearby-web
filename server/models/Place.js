const mongoose = require("mongoose");

const placeSchema = new mongoose.Schema({
  title: String,
  type: String,
  address: String,
  lat: Number,
  lon: Number,
  rating: Number,
  reviews: Number,
  price_level: String,
  open_now: Boolean,
  hours: { type: Map, of: String, default: {} }, // ✅ NEW
  image: String,
  phone: String,
  mood_tags: [String],
  city: String,
}, { timestamps: true });

module.exports = mongoose.model("Place", placeSchema);