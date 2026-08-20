const { isOpenNow, getISTNow } = require('./openStatus');

console.log("Current IST time:", getISTNow());

console.log("Result for 3-11:30 PM hours:", isOpenNow(new Map([
  ["monday", "3–11:30 PM"],
  ["tuesday", "3–11:30 PM"],
  ["wednesday", "3–11:30 PM"],
  ["thursday", "3–11:30 PM"],
  ["friday", "3–11:30 PM"],
  ["saturday", "3–11:30 PM"],
  ["sunday", "3–11:30 PM"],
])));