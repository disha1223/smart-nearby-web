const mongoose = require("mongoose");
const axios = require("axios");
const Place = require("./models/Place");
require("dotenv").config();

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const CENTER_LAT = 13.3525;
const CENTER_LON = 74.7934;

const MOOD_QUERIES = {
  study: "cafes with wifi near Manipal",
  hangout: "casual restaurants cafes near Manipal",
  "quick-bite": "fast food restaurants near Manipal",
  budget: "cheap restaurants near Manipal",
  nightlife: "bars pubs nightclubs near Manipal",
  gaming: "gaming cafes arcades near Manipal",
  fitness: "gyms fitness centers near Manipal",
  rentals: "bike car rental shops near Manipal",
  "hidden-gems": "unique local hidden spots near Manipal",
  beaches: "beaches near Manipal Udupi",
  movies: "movie theatres cinemas near Manipal",
};

// ✅ Fetch full weekly hours from Place Details endpoint
async function fetchHoursForPlace(title, location) {
  try {
    const res = await axios.get("https://serpapi.com/search", {
      params: {
        engine: "google_maps",
        q: `${title} ${location}`,
        ll: `@${CENTER_LAT},${CENTER_LON},14z`,
        type: "search",
        api_key: SERPAPI_KEY,
      },
    });
    const match = res.data.local_results?.[0];
    const hours = match?.operating_hours || {};
    const { open_now, ...hoursByDay } = hours;
    return hoursByDay;
  } catch (err) {
    return {};
  }
}
async function fetchPlacesForMood(mood, query) {
  const res = await axios.get("https://serpapi.com/search", {
    params: {
      engine: "google_maps",
      q: query,
      ll: `@${CENTER_LAT},${CENTER_LON},14z`,
      type: "search",
      api_key: SERPAPI_KEY,
    },
  });

  // ✅ Only top 20 per mood to save API quota
  const results = (res.data.local_results || []).slice(0, 20);
  const places = [];

  for (const r of results) {
    const rawHours = r.operating_hours || {};
    const { open_now, ...hoursByDay } = rawHours;

    // ✅ If search result has no day-by-day hours, fetch from Place Details
    let hours = hoursByDay;
    if (Object.keys(hours).length === 0 && r.data_id) {
      console.log(`  Fetching hours for: ${r.title}`);
      hours = await fetchHoursForPlace(r.data_id);
      await new Promise((resolve) => setTimeout(resolve, 600)); // avoid rate limit
    }

    places.push({
      title: r.title,
      type: r.type || mood,
      address: r.address || "",
      lat: r.gps_coordinates?.latitude || CENTER_LAT,
      lon: r.gps_coordinates?.longitude || CENTER_LON,
      rating: r.rating || 0,
      reviews: r.reviews || 0,
      price_level: r.price || "",
      open_now: open_now ?? r.open_now ?? true,
      hours,
      image: r.thumbnail || "",
      phone: r.phone || "",
      mood_tags: [mood],
      city: "manipal",
    });

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return places;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");

  let allPlaces = [];

  for (const [mood, query] of Object.entries(MOOD_QUERIES)) {
    console.log(`\nFetching mood: ${mood}...`);
    try {
      const places = await fetchPlacesForMood(mood, query);
      console.log(`  Got ${places.length} places`);
      allPlaces = allPlaces.concat(places);
    } catch (err) {
      console.error(`  Error for ${mood}:`, err.message);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  await Place.deleteMany({});

  allPlaces = allPlaces.map(p => ({
  ...p,
  location: { type: "Point", coordinates: [p.lon, p.lat] },
}));

await Place.insertMany(allPlaces);
  console.log(`\nSeeded ${allPlaces.length} places with hours!`);
  process.exit();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});