const express = require("express");
const router = express.Router();
const SearchLog = require("../models/SearchLog");

router.get("/", async (req, res) => {
  try {
    const totalLogs = await SearchLog.countDocuments();

    if (totalLogs === 0) {
      return res.json({
        insights: [],
        totalSearchesLogged: 0,
        message: "No search data yet — insights will appear here as people use the search feature.",
      });
    }

    const pipeline = [
      {
        $group: {
          _id: {
            mood: "$mood",
            lat: { $round: [{ $multiply: ["$lat", 100] }, 0] },
            lon: { $round: [{ $multiply: ["$lon", 100] }, 0] },
          },
          demandCount: { $sum: 1 },
          avgSupply: { $avg: "$resultsCount" },
          lastSearched: { $max: "$createdAt" },
        },
      },
      {
        $project: {
          _id: 0,
          mood: "$_id.mood",
          lat: { $divide: ["$_id.lat", 100] },
          lon: { $divide: ["$_id.lon", 100] },
          demandCount: 1,
          avgSupply: { $round: ["$avgSupply", 1] },
          lastSearched: 1,
          opportunityScore: {
            $round: [{ $divide: ["$demandCount", { $add: ["$avgSupply", 1] }] }, 2],
          },
        },
      },
      { $sort: { opportunityScore: -1 } },
      { $limit: 15 },
    ];

    const raw = await SearchLog.aggregate(pipeline);

    const insights = raw.map((item) => {
      let insightText;
      let category;
      if (item.demandCount >= 3 && item.avgSupply <= 3) {
        insightText = `"${item.mood}" is searched often here, but only ~${item.avgSupply} places typically show up — a potential gap in supply.`;
        category = "opportunity";
      } else if (item.demandCount < 3) {
        insightText = `Not enough searches yet for "${item.mood}" in this area to draw a strong conclusion.`;
        category = "low-data";
      } else {
        insightText = `"${item.mood}" demand here is well matched by ~${item.avgSupply} available places on average.`;
        category = "well-served";
      }
      return { ...item, insightText, category };
    });

    res.json({ insights, totalSearchesLogged: totalLogs });
  } catch (err) {
    console.error("Insights aggregation error:", err.message);
    res.status(500).json({ error: "Failed to compute insights" });
  }
});

module.exports = router;