const express = require("express");

const cors = require("cors");

require("dotenv").config();

const connectDB = require("./config/db");

const placesRouter = require("./routes/places");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const configRoutes = require("./routes/configData");

connectDB();

const app = express();

const PORT = process.env.PORT || 5000;


app.use(cors());

app.use(express.json());


app.use("/api/places", placesRouter);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/config", configRoutes);
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});