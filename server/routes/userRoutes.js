const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Middleware to verify token and get user
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Toggle favorite
router.post("/favourites", auth, async (req, res) => {
  try {
    const { place } = req.body; // full place object
    const user = await User.findById(req.userId);

    const index = user.favourites.findIndex(
      (f) => f.title === place.title && f.address === place.address
    );

    if (index > -1) {
      user.favourites.splice(index, 1);
    } else {
      user.favourites.push(place);
    }

    await user.save();
    res.json({ favourites: user.favourites });
  } catch (err) {
    res.status(500).json({ message: "Error updating favourites" });
  }
});

// Get favorites
router.get("/favourites", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({ favourites: user.favourites });
  } catch (err) {
    res.status(500).json({ message: "Error fetching favourites" });
  }
});

module.exports = router;