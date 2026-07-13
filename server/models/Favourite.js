const mongoose = require("mongoose");

const favouriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  placeId: { type: mongoose.Schema.Types.ObjectId, ref: "Place", required: true },
}, { timestamps: true });

// Prevent the same user favouriting the same place twice
favouriteSchema.index({ userId: 1, placeId: 1 }, { unique: true });

module.exports = mongoose.model("Favourite", favouriteSchema);