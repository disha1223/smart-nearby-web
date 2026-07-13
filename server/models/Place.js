const mongoose = require("mongoose");

const placeSchema = new mongoose.Schema({
  title: String,
  type: String,
  address: String,
  lat: Number,
  lon: Number,
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] }, // [lon, lat]
  },
  rating: Number,
  reviews: Number,
  price_level: String,
  open_now: Boolean,
  hours: { type: Map, of: String, default: {} },
  image: String,
  phone: String,
  mood_tags: [String],
  city: String,
}, { timestamps: true });

// Keep `location` in sync whenever lat/lon are set
placeSchema.pre("save", function (next) {
  if (this.lat != null && this.lon != null) {
    this.location = { type: "Point", coordinates: [this.lon, this.lat] };
  }
  next();
});

placeSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Place", placeSchema);