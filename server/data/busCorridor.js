// server/data/busCorridor.js
const CORRIDOR_STOPS = [
  { name: "KMC", lat: 13.3538, lon: 74.7867 },
  { name: "MIT Main Gate", lat: 13.3510, lon: 74.7935 },
  { name: "Academic Block", lat: 13.3525, lon: 74.7934 },
  { name: "Manipal Bus Stand", lat: 13.3492, lon: 74.7913 },
  { name: "Tiger Circle", lat: 13.3489, lon: 74.7869 },
  { name: "Eshwar Nagar", lat: 13.3465, lon: 74.7899 },
  { name: "End Point", lat: 13.3459, lon: 74.7961 },
  { name: "Kadiyali", lat: 13.3400, lon: 74.7750 },
  { name: "Indrali", lat: 13.3350, lon: 74.7700 },
  { name: "MGM College, Udupi", lat: 13.3400, lon: 74.7700 },
  { name: "Udupi Service Bus Stand", lat: 13.3409, lon: 74.7460 },
];

const CORRIDOR_INFO = {
  routeName: "Manipal – Udupi Road",
  frequencyMinutes: 15,
  baseFare: 21,
  farePerKm: 12,
};

module.exports = { CORRIDOR_STOPS, CORRIDOR_INFO };