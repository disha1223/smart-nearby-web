// Parses Google-style hour strings like "9 AM–11 PM" or "Open 24 hours"
// and tells you whether a place is open RIGHT NOW, based on real time —
// not a stale snapshot from whenever it was seeded.

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

function isOpenNow(hoursMap) {
  if (!hoursMap) return null;

  // hoursMap can be a Mongoose Map or a plain object depending on where it's called from
  const get = (key) => (hoursMap.get ? hoursMap.get(key) : hoursMap[key]);
  const size = hoursMap.size ?? Object.keys(hoursMap).length;
  if (size === 0) return null; // unknown, not "open"

  const now = new Date();
  const todayName = DAY_NAMES[now.getDay()];
  const todayStr = get(todayName);

  if (!todayStr) return null;
  if (/closed/i.test(todayStr)) return false;
  if (/24 hours/i.test(todayStr)) return true;

  const [openStr, closeStr] = todayStr.split(/[–-]/);
  if (!openStr || !closeStr) return null;

  const openMins = parseTimeToMinutes(openStr);
  const closeMins = parseTimeToMinutes(closeStr);
  if (openMins == null || closeMins == null) return null;

  const nowMins = now.getHours() * 60 + now.getMinutes();

  // Handles places open past midnight, e.g. 6 PM–2 AM
  if (closeMins < openMins) {
    return nowMins >= openMins || nowMins < closeMins;
  }
  return nowMins >= openMins && nowMins < closeMins;
}

module.exports = { isOpenNow };