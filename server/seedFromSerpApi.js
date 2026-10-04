const mongoose = require("mongoose");
const axios = require("axios");
const Place = require("./models/Place");
require("dotenv").config();

const SERPAPI_KEY = process.env.SERPAPI_KEY;

const CENTER_LAT = parseFloat(process.argv[2]) || 13.3525;
const CENTER_LON = parseFloat(process.argv[3]) || 74.7934;
const CITY_NAME = process.argv[4] || "Manipal";
const CITY_SLUG = CITY_NAME.toLowerCase().replace(/\s+/g, "-");


const MOOD_QUERIES = {
  study: ["cafes with wifi", "study cafes"],
  hangout: ["hangout spots", "restaurants"],
  "quick-bite": ["fast food restaurants", "street food"],
  budget: ["cheap restaurants", "budget eateries"],
  nightlife: ["bars pubs nightclubs", "lounges"],
  gaming: ["gaming cafes arcades", "esports lounges"],
  fitness: ["gyms fitness centers", "yoga studios"],
  rentals: ["bike car rental shops", "scooter rental"],
  "hidden-gems": ["unique local hidden spots", "local attractions"],
  beaches: ["beaches", "beach resorts"],
};

// One SerpApi call per query. Reshapes the response into our Place schema.
async function fetchPlacesForQuery(mood, searchTerm) {
  const query = `${searchTerm} near ${CITY_NAME}`;

  const response = await axios.get("https://serpapi.com/search", {
    params: {
      engine: "google_maps",
      q: query,
      ll: `@${CENTER_LAT},${CENTER_LON},14z`,
      type: "search",
      api_key: SERPAPI_KEY,
    },
  });

  const rawResults = response.data.local_results || [];
  console.log(`  "${query}" → ${rawResults.length} places`);

  return rawResults.map((place) => {
    const { open_now, ...hoursByDay } = place.operating_hours || {};
    return {
      title: place.title,
      type: place.type || mood,
      address: place.address || "",
      lat: place.gps_coordinates?.latitude || CENTER_LAT,
      lon: place.gps_coordinates?.longitude || CENTER_LON,
      location: {
        type: "Point",
        coordinates: [
          place.gps_coordinates?.longitude || CENTER_LON,
          place.gps_coordinates?.latitude || CENTER_LAT,
        ],
      },
      rating: place.rating || 0,
      reviews: place.reviews || 0,
      price_level: place.price || "",
      hours: hoursByDay, 
      dataId: place.data_id || "",// full weekly schedule — lets us compute "open now" live
      image: place.thumbnail || "",
      phone: place.phone || "",
      mood_tags: [mood],
      city: CITY_SLUG,
    };
  });
} // <-- this closing brace was missing, which broke everything below it

// Runs both queries for a mood, one after another.
async function fetchPlacesForMood(mood, searchTerms) {
  let places = [];
  for (const term of searchTerms) {
    const results = await fetchPlacesForQuery(mood, term);
    places.push(...results);
    await new Promise((resolve) => setTimeout(resolve, 500)); // avoid rate limit
  }
  return places;
}

// Same place can appear under multiple moods/queries — merge duplicates
// instead of saving them twice.
function dedupePlaces(places) {
  const seen = new Map();

  for (const place of places) {
    const key = `${place.title.toLowerCase()}|${place.address.toLowerCase()}`;

    if (seen.has(key)) {
      const existing = seen.get(key);
      existing.mood_tags = [...new Set([...existing.mood_tags, ...place.mood_tags])];
    } else {
      seen.set(key, place);
    }
  }

  return [...seen.values()];
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected to MongoDB. Seeding ${CITY_NAME}...\n`);

  let allPlaces = [];

  for (const [mood, searchTerms] of Object.entries(MOOD_QUERIES)) {
    console.log(`Fetching mood: ${mood}`);
    const places = await fetchPlacesForMood(mood, searchTerms);
    allPlaces.push(...places);
  }

  const uniquePlaces = dedupePlaces(allPlaces);
  console.log(`\n${allPlaces.length} raw results → ${uniquePlaces.length} unique places`);

  await Place.deleteMany({ city: CITY_SLUG });
  await Place.insertMany(uniquePlaces);

  console.log(`Done! Seeded ${uniquePlaces.length} places for ${CITY_NAME}.`);
  process.exit();
}

run().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});