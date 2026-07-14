const redis = require("redis");

let client = null;
let isReady = false;

function getClient() {
  if (client) return client;

  if (!process.env.REDIS_URL) {
    console.log("REDIS_URL not set — cache layer disabled, all searches will hit SerpAPI directly.");
    return null;
  }

  client = redis.createClient({ url: process.env.REDIS_URL });

  client.on("error", (err) => {
    console.error("Redis error:", err.message);
    isReady = false;
  });

  client.on("ready", () => {
    isReady = true;
    console.log("Redis connected — place search caching is ON.");
  });

  client.connect().catch((err) => {
    console.error("Redis connection failed:", err.message);
  });

  return client;
}

getClient();

function buildPlacesCacheKey({ type, query, lat, lon, radius, maxPrice }) {
  const roundedLat = Number(lat).toFixed(2);
  const roundedLon = Number(lon).toFixed(2);
  return `places:${type}:${query || "none"}:${roundedLat}:${roundedLon}:${radius || "def"}:${maxPrice || "any"}`;
}

async function getCache(key) {
  const c = getClient();
  if (!c || !isReady) return null;
  try {
    const value = await c.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    console.error("Cache read failed:", err.message);
    return null;
  }
}

async function setCache(key, value, ttlSeconds = 6 * 60 * 60) {
  const c = getClient();
  if (!c || !isReady) return;
  try {
    await c.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch (err) {
    console.error("Cache write failed:", err.message);
  }
}

module.exports = { buildPlacesCacheKey, getCache, setCache };