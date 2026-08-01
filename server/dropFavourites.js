const mongoose = require("mongoose");
require("dotenv").config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  await mongoose.connection.db.collection("favourites").drop();
  console.log("Dropped favourites collection.");
  process.exit();
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});