const express = require("express");

const router = express.Router();

const User = require("../models/User");

const jwt = require("jsonwebtoken");


// AUTH MIDDLEWARE
const auth = async (req, res, next) => {

  try {

    const token =
  req.headers.authorization.replace(
    "Bearer ",
    ""
  );

    if (!token) {

      return res.status(401).json({
        message: "No token",
      });

    }

    const decoded = jwt.verify(

      token,

      process.env.JWT_SECRET

    );

    req.userId = decoded.id;

    next();

  } catch (error) {

    res.status(401).json({
      message: "Invalid token",
    });

  }
};



// ADD FAVOURITE
router.post(
  "/favourite",
  auth,

  async (req, res) => {

    try {

      const user = await User.findById(
        req.userId
      );

      user.favourites.push(req.body);

      await user.save();

      res.json({
        message: "Added to favourites",
        favourites: user.favourites,
      });

    } catch (error) {

      res.status(500).json({
        message: error.message,
      });

    }
  }
);



// GET FAVOURITES
router.get(
  "/favourites",
  auth,

  async (req, res) => {

    try {

      const user = await User.findById(
        req.userId
      );

      res.json(user.favourites);

    } catch (error) {

      res.status(500).json({
        message: error.message,
      });

    }
  }
);
router.delete("/favourite", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    user.favourites = user.favourites.filter(
      (f) => f.title !== req.body.title
    );
    await user.save();
    res.json({ message: "Removed", favourites: user.favourites });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;