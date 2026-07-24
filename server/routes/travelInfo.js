// server/routes/travelInfo.js
//
// Given an origin (user's current location or a chosen landmark) and a
// destination (a place card), this returns:
//   - straight-line/road distance
//   - walking time
//   - an ESTIMATED auto-rickshaw fare (Google Maps has no such data for Manipal)
//   - public bus availability on that route
//
// If GOOGLE_MAPS_API_KEY is configured, we use the Distance Matrix API for
// accurate road distance/walking time and the Directions API (transit mode)
// for bus info. If the key is missing or a call fails, we fall back to a
// haversine straight-line distance so the feature still works end-to-end.

const express = require("express");
const axios = require("axios");
const router = express.Router();
const { getCache, setCache } = require("../utils/cache");

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// ---------- Fallback distance calculation (haversine) ----------
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

// Straight-line distance underestimates actual road distance, so we pad it
// a bit when we don't have a real routing API to work with.
const FALLBACK_ROAD_FACTOR = 1.25;
// Average walking speed used for the fallback ETA.
const AVG_WALK_KMPH = 5;

// ---------- Auto-rickshaw fare estimator ----------
// Base fare = ₹30, first 2 km included, ₹15/km after that.
function estimateAutoFare(distanceKm) {
  const BASE_FARE = 30;
  const INCLUDED_KM = 2;
  const RATE_PER_KM = 15;

  const extraKm = Math.max(0, distanceKm - INCLUDED_KM);
  const rawFare = BASE_FARE + extraKm * RATE_PER_KM;

  // Give a friendly ± range around the raw estimate, rounded to nearest 10.
  const low = Math.max(20, Math.round((rawFare - 10) / 10) * 10);
  const high = Math.round((rawFare + 10) / 10) * 10;

  return { low, high, label: `₹${low}–${high}` };
}

function formatWalkingTime(minutes) {
  if (minutes == null || Number.isNaN(minutes)) return null;
  const rounded = Math.max(1, Math.round(minutes));
  return `${rounded} min walk`;
}

// ---------- Google Distance Matrix (walking) ----------
async function fetchWalkingInfo(originLat, originLng, destLat, destLng) {
  if (!GOOGLE_MAPS_API_KEY) return null;

  const res = await axios.get(
    "https://maps.googleapis.com/maps/api/distancematrix/json",
    {
      params: {
        origins: `${originLat},${originLng}`,
        destinations: `${destLat},${destLng}`,
        mode: "walking",
        units: "metric",
        key: GOOGLE_MAPS_API_KEY,
      },
      timeout: 5000,
    }
  );

  const element = res.data?.rows?.[0]?.elements?.[0];
  if (!element || element.status !== "OK") return null;

  return {
    distanceKm: element.distance.value / 1000,
    walkingMinutes: element.duration.value / 60,
  };
}

// ---------- Google Directions (transit) for bus info ----------
async function fetchBusInfo(originLat, originLng, destLat, destLng) {
  if (!GOOGLE_MAPS_API_KEY) return null;

  const res = await axios.get(
    "https://maps.googleapis.com/maps/api/directions/json",
    {
      params: {
        origin: `${originLat},${originLng}`,
        destination: `${destLat},${destLng}`,
        mode: "transit",
        transit_mode: "bus",
        key: GOOGLE_MAPS_API_KEY,
      },
      timeout: 5000,
    }
  );

  const route = res.data?.routes?.[0];
  if (!route || res.data.status !== "OK") {
    return { available: false };
  }

  const transitStep = route.legs?.[0]?.steps?.find(
    (s) => s.travel_mode === "TRANSIT" && s.transit_details?.line?.vehicle?.type === "BUS"
  );

  if (!transitStep) {
    return { available: false };
  }

  const line = transitStep.transit_details.line;
  return {
    available: true,
    route: line.short_name || line.name || "Bus",
    durationMinutes: Math.round(transitStep.duration.value / 60),
  };
}

router.get("/", async (req, res) => {
  const { originLat, originLng, destinationLat, destinationLng } = req.query;

  if (!originLat || !originLng || !destinationLat || !destinationLng) {
    return res.status(400).json({
      error: "originLat, originLng, destinationLat and destinationLng are required",
    });
  }

  const oLat = parseFloat(originLat);
  const oLng = parseFloat(originLng);
  const dLat = parseFloat(destinationLat);
  const dLng = parseFloat(destinationLng);

  const cacheKey = `travelInfo:${oLat.toFixed(4)},${oLng.toFixed(4)}:${dLat.toFixed(4)},${dLng.toFixed(4)}`;
  try {
    const cached = await getCache(cacheKey);
    if (cached) return res.json({ ...cached, cached: true });
  } catch (e) {
    // cache read failures should never block the response
  }

  let distanceKm = null;
  let walkingMinutes = null;
  let usedFallback = false;

  try {
    const walkInfo = await fetchWalkingInfo(oLat, oLng, dLat, dLng);
    if (walkInfo) {
      distanceKm = walkInfo.distanceKm;
      walkingMinutes = walkInfo.walkingMinutes;
    }
  } catch (err) {
    console.error("Distance Matrix API failed, falling back:", err.message);
  }

  if (distanceKm == null) {
    usedFallback = true;
    const straightLineKm = haversineKm(oLat, oLng, dLat, dLng);
    distanceKm = straightLineKm * FALLBACK_ROAD_FACTOR;
    walkingMinutes = (distanceKm / AVG_WALK_KMPH) * 60;
  }

  let busInfo = { available: false };
  try {
    const info = await fetchBusInfo(oLat, oLng, dLat, dLng);
    if (info) busInfo = info;
  } catch (err) {
    console.error("Directions API (transit) failed:", err.message);
  }

  const fare = estimateAutoFare(distanceKm);

  const responseBody = {
    distance: {
      km: Math.round(distanceKm * 10) / 10,
      label: `${(Math.round(distanceKm * 10) / 10).toFixed(1)} km away`,
    },
    walkingTime: {
      minutes: Math.round(walkingMinutes),
      label: formatWalkingTime(walkingMinutes),
    },
    estimatedFare: {
      low: fare.low,
      high: fare.high,
      label: `${fare.label} (Estimated)`,
    },
    busInfo: busInfo.available
      ? {
          available: true,
          route: busInfo.route,
          durationMinutes: busInfo.durationMinutes,
          label: busInfo.durationMinutes
            ? `${busInfo.route} · ${busInfo.durationMinutes} mins`
            : busInfo.route,
        }
      : { available: false, label: "No direct bus" },
    usedFallback,
  };

  try {
    await setCache(cacheKey, responseBody, 60 * 60); // 1 hour
  } catch (e) {
    // ignore cache write failures
  }

  res.json({ ...responseBody, cached: false });
});

module.exports = router;