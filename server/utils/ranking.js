// server/utils/ranking.js
// Shared "trustworthy quality" score. A plain average lets one 5-star
// review outrank a place with hundreds of reviews at 4.5 — this shrinks
// low-review-count ratings toward a neutral prior until they've earned trust.

function weightedScore(rating = 0, reviews = 0, minVotes = 10) {
  const PRIOR = 3.8; // assumed average until proven otherwise
  const v = reviews || 0;
  const R = rating || 0;
  return (v / (v + minVotes)) * R + (minVotes / (v + minVotes)) * PRIOR;
}

module.exports = { weightedScore };