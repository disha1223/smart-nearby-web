const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  journal: [
    {
      place: { type: String, required: true },
      note: { type: String, required: true },
      date: { type: Date, default: Date.now },
    },
  ],
}, {
  timestamps: true,
});
module.exports = mongoose.model("User", userSchema);