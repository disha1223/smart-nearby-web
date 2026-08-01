const mongoose = require("mongoose");

const favouriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  type: String,
  address: { type: String, required: true },
  lat: Number,
  lon: Number,
  rating: Number,
  reviews: Number,
  price_level: String,
  open_now: Boolean,
  image: String,
  phone: String,
}, { timestamps: true });

favouriteSchema.index({ userId: 1, title: 1, address: 1 }, { unique: true });

module.exports = mongoose.model("Favourite", favouriteSchema);