const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    title: String,
    type: String,
    address: String,
    rating: Number,
    reviews: Number,
    price_level: String,
    thumbnail: String,
    votes: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        vote: { type: String, enum: ["yes", "no"] },
      },
    ],
  },
  { _id: false }
);

const hangoutSessionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        username: String,
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    lat: Number,
    lon: Number,
    radius: Number,
    mood: String,
    candidates: [candidateSchema],
    status: { type: String, enum: ["voting", "decided"], default: "voting" },
    winner: { type: Object, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HangoutSession", hangoutSessionSchema);