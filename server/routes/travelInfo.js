// server/routes/travelInfo.js
//
// Given an origin (user's current location or a chosen landmark) and a
// destination (a place card), this returns:
//   - real road-walking distance/time via OSRM (free, no API key needed)
//   - a distance-proportional auto-rickshaw fare estimate
//   - public bus availability, checked against a hardcoded real
//     Manipal-Udupi corridor (no transit API covers this area at all,
//     Google included, so this hardcoded corridor IS the real answer here)
//   - if OSRM fails, a haversine straight-line fallback so the feature
//     still works end-to-end

const express = require("express");
const axios = require("axios");
const router = express.Router();
const { getCache, setCache } = require("../utils/cache");
const { CORRIDOR_STOPS, CORRIDOR_INFO } = require("../data/busCorridor");

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

const FALLBACK_ROAD_FACTOR = 1.25;
const AVG_WALK_KMPH = 5;

// ---------- Auto-rickshaw fare estimator ----------
function estimateAutoFare(distanceKm) {
  const BASE_FARE = 30;
  const INCLUDED_KM = 2;
  const RATE_PER_KM = 15;

  const extraKm = Math.max(0, distanceKm - INCLUDED_KM);
  const rawFare = BASE_FARE + extraKm * RATE_PER_KM;

  const low = Math.max(20, Math.round((rawFare - 10) / 10) * 10);
  const high = Math.round((rawFare + 10) / 10) * 10;

  return { low, high, label: `₹${low}–${high}` };
}

function formatWalkingTime(minutes) {
  if (minutes == null || Number.isNaN(minutes)) return null;
  const rounded = Math.max(1, Math.round(minutes));
  return `${rounded} min walk`;
}

// ---------- OSRM (free, no key) walking route ----------
// OSRM's public demo server. Note: its default profile is car-based routing,
// but for a walkable-radius app like this (few km max), it still returns a
// real road-following distance, which is what we actually need — we apply
// our own walking speed to get the ETA rather than trusting OSRM's
// car-oriented duration field.
async function fetchWalkingInfo(originLat, originLng, destLat, destLng) {
  const url = `https://router.project-osrm.org/route/v1/foot/${originLng},${originLat};${destLng},${destLat}`;

  const res = await axios.get(url, {
    params: { overview: "false" },
    timeout: 6000,
  });

  const route = res.data?.routes?.[0];
  if (!route) return null;

  return {
    distanceKm: route.distance / 1000, // meters -> km
    walkingMinutes: route.duration / 60, // seconds -> minutes
  };
}

// ---------- Manipal-Udupi corridor bus check ----------
const CORRIDOR_SNAP_KM = 0.6;

function nearestCorridorStop(lat, lon) {
  let nearest = null;
  let nearestDist = Infinity;
  for (const stop of CORRIDOR_STOPS) {
    const d = haversineKm(lat, lon, stop.lat, stop.lon);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = stop;
    }
  }
  return nearestDist <= CORRIDOR_SNAP_KM ? { stop: nearest, distanceKm: nearestDist } : null;
}

function checkCorridorBus(oLat, oLng, dLat, dLng, roadDistanceKm) {
  const originStop = nearestCorridorStop(oLat, oLng);
  const destStop = nearestCorridorStop(dLat, dLng);

  if (!originStop || !destStop || originStop.stop.name === destStop.stop.name) {
    return { available: false };
  }

  const fare = Math.max(
    CORRIDOR_INFO.baseFare,
    Math.round(CORRIDOR_INFO.baseFare + roadDistanceKm * CORRIDOR_INFO.farePerKm)
  );

  return {
    available: true,
    route: `${CORRIDOR_INFO.routeName} (${originStop.stop.name} → ${destStop.stop.name})`,
    frequencyMinutes: CORRIDOR_INFO.frequencyMinutes,
    fare,
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
      // We apply our own walking speed instead of OSRM's duration, since
      // OSRM's default profile skews toward car-timing assumptions.
      walkingMinutes = (walkInfo.distanceKm / AVG_WALK_KMPH) * 60;
    }
  } catch (err) {
    console.error("OSRM routing failed, falling back:", err.message);
  }

  if (distanceKm == null) {
    usedFallback = true;
    const straightLineKm = haversineKm(oLat, oLng, dLat, dLng);
    distanceKm = straightLineKm * FALLBACK_ROAD_FACTOR;
    walkingMinutes = (distanceKm / AVG_WALK_KMPH) * 60;
  }

  let busInfo = { available: false };
  const corridorResult = checkCorridorBus(oLat, oLng, dLat, dLng, distanceKm);
  if (corridorResult.available) {
    busInfo = {
      available: true,
      route: corridorResult.route,
      label: `${corridorResult.route} · every ~${corridorResult.frequencyMinutes} min · ₹${corridorResult.fare}`,
    };
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
      ? { available: true, route: busInfo.route, label: busInfo.label }
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