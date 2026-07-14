const mongoose = require("mongoose");
const axios = require("axios");
const Place = require("./models/Place");
require("dotenv").config();

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const CENTER_LAT = 13.3525;
const CENTER_LON = 74.7934;

// How many pages of results to pull per query (Google Maps returns ~20/page).
// 4 pages ≈ up to 80 results per query. Raise this if you want even deeper coverage,
// but each page is a separate SerpApi request, so it eats into your quota fast.
const MAX_PAGES_PER_QUERY = 4;
const RESULTS_PER_PAGE = 20;

// Multiple query variants per mood widen the net — SerpApi's Maps results
// differ noticeably depending on phrasing, so more phrasings = more unique places.
const MOOD_QUERIES = {
  study: [
    "cafes with wifi near Manipal",
    "study cafes near Manipal",
    "libraries near Manipal",
  ],
  hangout: [
    "casual restaurants cafes near Manipal",
    "hangout spots near Manipal",
    "restaurants near Manipal",
  ],
  "quick-bite": [
    "fast food restaurants near Manipal",
    "street food near Manipal",
    "bakeries near Manipal",
  ],
  budget: [
    "cheap restaurants near Manipal",
    "budget eateries near Manipal",
  ],
  nightlife: [
    "bars pubs nightclubs near Manipal",
    "lounges near Manipal",
  ],
  gaming: [
    "gaming cafes arcades near Manipal",
    "esports lounges near Manipal",
  ],
  fitness: [
    "gyms fitness centers near Manipal",
    "yoga studios near Manipal",
    "sports complexes near Manipal",
  ],
  rentals: [
    "bike car rental shops near Manipal",
    "scooter rental near Manipal",
  ],
  "hidden-gems": [
    "unique local hidden spots near Manipal",
    "local attractions near Manipal",
  ],
  beaches: [
    "beaches near Manipal Udupi",
  ],
  movies: [
    "movie theatres cinemas near Manipal",
  ],
  shopping: [
    "shopping malls near Manipal",
    "markets near Manipal",
    "stores near Manipal",
  ],
  outdoors: [
    "parks near Manipal",
    "tourist attractions near Manipal",
    "temples near Manipal",
  ],
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

// ✅ Paginates through a single query's results, up to MAX_PAGES_PER_QUERY pages
async function fetchAllResultsForQuery(query) {
  let allResults = [];

  for (let page = 0; page < MAX_PAGES_PER_QUERY; page++) {
    const start = page * RESULTS_PER_PAGE;
    try {
      const res = await axios.get("https://serpapi.com/search", {
        params: {
          engine: "google_maps",
          q: query,
          ll: `@${CENTER_LAT},${CENTER_LON},14z`,
          type: "search",
          start,
          api_key: SERPAPI_KEY,
        },
      });

      const results = res.data.local_results || [];
      if (results.length === 0) break; // no more pages

      allResults = allResults.concat(results);

      // Stop early if this page came back short — usually means it's the last page
      if (results.length < RESULTS_PER_PAGE) break;

      await new Promise((resolve) => setTimeout(resolve, 500)); // avoid rate limit
    } catch (err) {
      console.error(`    Page ${page} failed for "${query}":`, err.message);
      break;
    }
  }

  return allResults;
}

async function fetchPlacesForMood(mood, queries) {
  const places = [];

  for (const query of queries) {
    console.log(`  Query: "${query}"`);
    const results = await fetchAllResultsForQuery(query);
    console.log(`    Got ${results.length} raw results`);

    for (const r of results) {
      const rawHours = r.operating_hours || {};
      const { open_now, ...hoursByDay } = rawHours;

      let hours = hoursByDay;
      if (Object.keys(hours).length === 0 && r.data_id) {
        hours = await fetchHoursForPlace(r.title, r.address || "Manipal");
        await new Promise((resolve) => setTimeout(resolve, 600));
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
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return places;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");

  let allPlaces = [];

  for (const [mood, queries] of Object.entries(MOOD_QUERIES)) {
    console.log(`\nFetching mood: ${mood}...`);
    try {
      const places = await fetchPlacesForMood(mood, queries);
      console.log(`  Total for ${mood}: ${places.length} places`);
      allPlaces = allPlaces.concat(places);
    } catch (err) {
      console.error(`  Error for ${mood}:`, err.message);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // ✅ Dedupe places that showed up under multiple moods/queries, merging their mood_tags
  const dedupedMap = new Map();
  for (const p of allPlaces) {
    const key = `${p.title.trim().toLowerCase()}|${p.address.trim().toLowerCase()}`;
    if (dedupedMap.has(key)) {
      const existing = dedupedMap.get(key);
      const mergedTags = new Set([...existing.mood_tags, ...p.mood_tags]);
      existing.mood_tags = Array.from(mergedTags);
    } else {
      dedupedMap.set(key, p);
    }
  }

  let dedupedPlaces = Array.from(dedupedMap.values());
  console.log(`\nDeduped: ${allPlaces.length} raw -> ${dedupedPlaces.length} unique places`);

  dedupedPlaces = dedupedPlaces.map((p) => ({
    ...p,
    location: { type: "Point", coordinates: [p.lon, p.lat] },
  }));

  await Place.deleteMany({});
  await Place.insertMany(dedupedPlaces);
  console.log(`\nSeeded ${dedupedPlaces.length} unique places with hours!`);
  process.exit();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});