const express = require("express");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const {
  signup,
  login,
} = require("../controllers/authController");


// RATE LIMITERS
// Login: strict — only 5 attempts per 15 min per IP, to block password-guessing scripts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { message: "Too many login attempts. Please try again after 15 minutes." },
  standardHeaders: true, // adds RateLimit-* headers so the client can see remaining attempts
  legacyHeaders: false,
});

// Signup: looser — 10 per hour per IP, to stop bots from mass-creating fake accounts
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { message: "Too many signup attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});


// ROUTES
router.post("/signup", signupLimiter, signup);

router.post("/login", loginLimiter, login);


module.exports = router;