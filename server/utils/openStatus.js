// Parses Google-style hour strings like "9 AM–11 PM" or "Open 24 hours"
// and tells you whether a place is open RIGHT NOW, based on real time —
// not a stale snapshot from whenever it was seeded.
//
// IMPORTANT: this always evaluates "now" in IST (Asia/Kolkata, UTC+5:30),
// regardless of what timezone the Node server process itself is running in
// (e.g. AWS EC2 instances default to UTC). Without this, "open now" checks
// would be off by the server's UTC offset from IST.

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function parseTimeToMinutes(str) {
  const match = str.trim().match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (!match) return null;
  let [, hour, minute, meridiem] = match;
  hour = parseInt(hour, 10);
  minute = minute ? parseInt(minute, 10) : 0;
  if (meridiem.toUpperCase() === "PM" && hour !== 12) hour += 12;
  if (meridiem.toUpperCase() === "AM" && hour === 12) hour = 0;
  return hour * 60 + minute;
}

// Builds a Date object whose UTC-getter methods (getUTCDay, getUTCHours,
// getUTCMinutes) return IST wall-clock values, no matter what timezone
// the server process is actually running in. This avoids relying on
// process.env.TZ or any server-level timezone configuration.
function getISTNow() {
  const trueUtcMs = Date.now() + new Date().getTimezoneOffset() * 60000;
  return new Date(trueUtcMs + 5.5 * 60 * 60000);
}

function isOpenNow(hoursMap) {
  if (!hoursMap) return null;

  // hoursMap can be a Mongoose Map or a plain object depending on where it's called from
  const get = (key) => (hoursMap.get ? hoursMap.get(key) : hoursMap[key]);
  const size = hoursMap.size ?? Object.keys(hoursMap).length;
  if (size === 0) return null; // unknown, not "open"

  const now = getISTNow();
  const todayName = DAY_NAMES[now.getUTCDay()];
  const todayStr = get(todayName);

  if (!todayStr) return null;
  if (/closed/i.test(todayStr)) return false;
  if (/24 hours/i.test(todayStr)) return true;

  const [openStr, closeStr] = todayStr.split(/[–-]/);
  if (!openStr || !closeStr) return null;

  const openMins = parseTimeToMinutes(openStr);
  const closeMins = parseTimeToMinutes(closeStr);
  if (openMins == null || closeMins == null) return null;

  const nowMins = now.getUTCHours() * 60 + now.getUTCMinutes();

  // Handles places open past midnight, e.g. 6 PM–2 AM
  if (closeMins < openMins) {
    return nowMins >= openMins || nowMins < closeMins;
  }
  return nowMins >= openMins && nowMins < closeMins;
}

module.exports = { isOpenNow };