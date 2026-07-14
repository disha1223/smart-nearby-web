const axios = require("axios");

const FALLBACK_INTENT = {
  searchQuery: null,
  maxBudgetRupees: null,
  radiusKm: null,
  excludeKeywords: [],
};

const SYSTEM_PROMPT = `You are an intent parser for a local places app in Manipal/Udupi, India.
A user will describe, in plain language, what kind of place they're looking for.
Output ONLY a single JSON object with exactly these fields:

{
  "searchQuery": string,        // a short Google-Maps-style search phrase describing the TYPE of place, e.g. "quiet cafes", "cheap street food", "rooftop bars". Always in English, 2-6 words.
  "maxBudgetRupees": number|null,  // the user's rough max spend per person in INR, as a plain number, if they imply a budget (e.g. "cheap" ~ 300, "not too expensive" ~ 600, "fancy/premium" ~ 2000). null if no budget signal at all.
  "radiusKm": number|null,      // how far they're willing to travel in kilometers, if implied (e.g. "close by"/"nearby" ~ 2, "doesn't matter"/"anywhere" ~ 8). null if not implied.
  "excludeKeywords": string[]   // words describing what to AVOID (e.g. loud, crowded, bar, nightclub), lowercase, empty array if none implied
}`;

const GEMINI_MODEL = "gemini-flash-latest";

async function parseSearchIntent(userText) {
  if (!process.env.GEMINI_API_KEY) {
    console.log("GEMINI_API_KEY not set — smart search will use the raw text as-is.");
    return { ...FALLBACK_INTENT, searchQuery: userText, usedFallback: true };
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: userText }] }],
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig: {
          responseMimeType: "application/json",
        },
      },
      { headers: { "content-type": "application/json" } }
    );

    const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    const parsed = JSON.parse(rawText);

    return {
      searchQuery: parsed.searchQuery || userText,
      maxBudgetRupees: typeof parsed.maxBudgetRupees === "number" ? parsed.maxBudgetRupees : null,
      radiusKm: typeof parsed.radiusKm === "number" ? parsed.radiusKm : null,
      excludeKeywords: Array.isArray(parsed.excludeKeywords) ? parsed.excludeKeywords.map((k) => String(k).toLowerCase()) : [],
    };
  } catch (err) {
    console.error("Intent parsing failed, falling back to raw text search:", err.message);
   return { ...FALLBACK_INTENT, searchQuery: userText, usedFallback: true };
  }
}

module.exports = { parseSearchIntent };