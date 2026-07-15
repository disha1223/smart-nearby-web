const express = require("express");

const cors = require("cors");

require("dotenv").config();

const connectDB = require("./config/db");

const placesRouter = require("./routes/places");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const configRoutes = require("./routes/configData");

const hangoutRoutes = require("./routes/hangout");
const insightsRoutes = require("./routes/insights");
const safetyRoutes = require("./routes/safety");
connectDB();

const app = express();

const PORT = process.env.PORT || 5000;


app.use(cors());

app.use(express.json());


app.use("/api/places", placesRouter);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/config", configRoutes);
app.use("/api/hangout", hangoutRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/safety", safetyRoutes);
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});