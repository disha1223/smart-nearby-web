const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const Favourite = require("../models/Favourite");
const Place = require("../models/Place");

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
// Get all journal entries (newest first)
router.get("/journal", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const sorted = [...user.journal].sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ message: "Error fetching journal" });
  }
});

// Toggle favourite
router.post("/favourites", auth, async (req, res) => {
  try {
    const { place } = req.body;

    let placeDoc = await Place.findOne({ title: place.title, address: place.address });
    if (!placeDoc) {
      placeDoc = await Place.create(place);
    }

    const existing = await Favourite.findOne({ userId: req.userId, placeId: placeDoc._id });

    if (existing) {
      await Favourite.deleteOne({ _id: existing._id });
    } else {
      await Favourite.create({ userId: req.userId, placeId: placeDoc._id });
    }

    const favourites = await Favourite.find({ userId: req.userId }).populate("placeId");
    res.json({ favourites: favourites.map(f => f.placeId) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating favourites" });
  }
});

// Get favourites
router.get("/favourites", auth, async (req, res) => {
  try {
    const favourites = await Favourite.find({ userId: req.userId }).populate("placeId");
    res.json({ favourites: favourites.map(f => f.placeId) });
  } catch (err) {
    res.status(500).json({ message: "Error fetching favourites" });
  }
});
// Add a journal entry
router.post("/journal", auth, async (req, res) => {
  try {
    const { place, note, date } = req.body;
    const user = await User.findById(req.userId);

    user.journal.push({ place, note, date: date || new Date() });
    await user.save();

    const savedEntry = user.journal[user.journal.length - 1];
    res.status(201).json(savedEntry);
  } catch (err) {
    res.status(500).json({ message: "Error saving journal entry" });
  }
});

// Delete a journal entry
router.delete("/journal/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    user.journal = user.journal.filter(
      (entry) => entry._id.toString() !== req.params.id
    );
    await user.save();
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting journal entry" });
  }
});

module.exports = router;