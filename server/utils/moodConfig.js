// server/utils/moodConfig.js
// Single source of truth for mood search phrasing, quality keywords, and ranking.
// Both places.js and hangout.js import from here so they never drift out of sync.

const MOOD_QUERIES = {
  study: ["cafes with wifi", "study cafes", "libraries"],
  hangout: ["casual restaurants cafes", "hangout spots"],
  "quick-bite": ["fast food restaurants", "street food", "bakeries"],
  budget: ["cheap restaurants", "budget eateries"],
  nightlife: ["bars pubs nightclubs", "lounges"],
  gaming: ["gaming cafes arcades", "esports lounges"],
  fitness: ["gyms fitness centers", "yoga studios"],
  rentals: ["bike car rental shops", "scooter rental"],
  beaches: ["beaches"],
  "hidden-gems": ["unique local hidden spots", "local attractions"],
};

// Signals scanned in title/type to check a result actually FITS the mood,
// not just that it showed up in a Maps search for it.
const MOOD_KEYWORDS = {
  study: ["wifi", "quiet", "study", "peaceful", "calm", "library", "co-working", "coworking", "book"],
  hangout: ["cafe", "lounge", "casual", "restaurant", "bistro"],
  "quick-bite": ["fast food", "street food", "bakery", "snack", "quick"],
  budget: ["cheap", "budget", "affordable", "thali", "dhaba"],
  nightlife: ["bar", "pub", "club", "lounge", "brewery"],
  gaming: ["gaming", "arcade", "esports", "playstation", "console"],
  fitness: ["gym", "yoga", "fitness", "crossfit", "workout"],
  rentals: ["rental", "bike", "scooter", "car", "hire"],
  beaches: ["beach", "shore", "coast"],
  "hidden-gems": ["hidden", "unique", "local", "boutique", "offbeat"],
};

// Words that DISQUALIFY a place for a mood, even with a great rating.
// This is the piece that was missing: a 4.8-rated burger/juice/chats stall
// should never win a "study" search just because its rating is high —
// it needs to be excluded outright, not merely out-scored.
const MOOD_EXCLUDE_KEYWORDS = {
  study: [
    "burger", "pizza", "juice", "chat", "chaat", "pav bhaji", "pavbhaji",
    "biryani", "sweets", "bakery", "fast food", "dhaba", "buffet",
    "bar", "pub", "nightclub", "liquor", "grill", "bbq", "kebab",
  ],
  fitness: ["cafe", "restaurant", "bar", "pub"],
  nightlife: ["gym", "library", "study"],
  beaches: ["gym", "restaurant"],
};

function getMaxRupeeFromPriceLevel(priceLevel) {
  if (!priceLevel) return null;
  const numbers = priceLevel.match(/[\d,]+/g);
  if (!numbers || numbers.length === 0) return null;
  const cleanedNumbers = numbers.map((n) => parseInt(n.replace(/,/g, ""), 10));
  return Math.max(...cleanedNumbers);
}

// True if this place should be dropped from results for this mood entirely,
// regardless of rating/reviews. Check this BEFORE scoring/sorting.
function isMoodMismatch(p, mood) {
  const excludeList = MOOD_EXCLUDE_KEYWORDS[mood];
  if (!excludeList) return false;
  const haystack = `${p.title || ""} ${p.type || ""}`.toLowerCase();
  return excludeList.some((kw) => haystack.includes(kw));
}

// Higher score = better fit. Rating and review count reward genuinely
// well-reviewed places; keyword bonus rewards places that actually match
// what the mood implies, not just whatever category Google grouped them under.
function scorePlace(p, mood) {
  let score = (p.rating || 0) * 10 + Math.log((p.reviews || 0) + 1) * 3;
  const haystack = `${p.title || ""} ${p.type || ""}`.toLowerCase();
  const keywords = MOOD_KEYWORDS[mood] || [];
  for (const kw of keywords) {
    if (haystack.includes(kw)) score += 8;
  }
  return score;
}

module.exports = { MOOD_QUERIES, MOOD_KEYWORDS, MOOD_EXCLUDE_KEYWORDS, getMaxRupeeFromPriceLevel, isMoodMismatch, scorePlace };