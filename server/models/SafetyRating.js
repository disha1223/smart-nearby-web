const mongoose = require("mongoose");

const safetyRatingSchema = new mongoose.Schema(
  {
    placeTitle: { type: String, required: true },
    placeAddress: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    timeOfDay: { type: String, enum: ["day", "evening", "night"], required: true },
  },
  { timestamps: true }
);

safetyRatingSchema.index({ placeTitle: 1, placeAddress: 1, userId: 1, timeOfDay: 1 }, { unique: true });

module.exports = mongoose.model("SafetyRating", safetyRatingSchema);