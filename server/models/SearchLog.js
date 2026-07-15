const mongoose = require("mongoose");

const searchLogSchema = new mongoose.Schema(
  {
    mood: { type: String, required: true },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    resultsCount: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SearchLog", searchLogSchema);