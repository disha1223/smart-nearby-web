const mongoose = require("mongoose");
const Place = require("./models/Place");
require("dotenv").config();

const CENTER_LAT = 13.3525;
const CENTER_LON = 74.7934;

function jitter() {
  return (Math.random() - 0.5) * 0.018;
}

const IMAGES = {
  study: [
    "https://source.unsplash.com/400x300/?cafe,coffee",
    "https://source.unsplash.com/400x300/?library,study",
    "https://source.unsplash.com/400x300/?coffee,laptop",
  ],
  hangout: [
    "https://source.unsplash.com/400x300/?friends,hangout",
    "https://source.unsplash.com/400x300/?lounge,cafe",
    "https://source.unsplash.com/400x300/?rooftop,cafe",
  ],
  "quick-bite": [
    "https://source.unsplash.com/400x300/?fastfood,burger",
    "https://source.unsplash.com/400x300/?streetfood",
    "https://source.unsplash.com/400x300/?snacks,food",
  ],
  budget: [
    "https://source.unsplash.com/400x300/?indianfood,restaurant",
    "https://source.unsplash.com/400x300/?thali,food",
    "https://source.unsplash.com/400x300/?diner",
  ],
  nightlife: [
    "https://source.unsplash.com/400x300/?nightclub,bar",
    "https://source.unsplash.com/400x300/?cocktail,bar",
    "https://source.unsplash.com/400x300/?lounge,night",
  ],
  gaming: [
    "https://source.unsplash.com/400x300/?arcade,gaming",
    "https://source.unsplash.com/400x300/?videogame",
    "https://source.unsplash.com/400x300/?esports",
  ],
  fitness: [
    "https://source.unsplash.com/400x300/?gym,fitness",
    "https://source.unsplash.com/400x300/?workout",
    "https://source.unsplash.com/400x300/?crossfit",
  ],
  rentals: [
    "https://source.unsplash.com/400x300/?scooter,bike",
    "https://source.unsplash.com/400x300/?carrental",
    "https://source.unsplash.com/400x300/?motorbike",
  ],
};

const NAME_TEMPLATES = {
  study: ["Cafe", "Coffee House", "Study Lounge", "Brew House", "Reading Cafe", "Wifi Cafe"],
  hangout: ["Hangout Spot", "Chill Point", "Lounge", "Garden Cafe", "Terrace Cafe", "Friends Cafe"],
  "quick-bite": ["Fast Food Corner", "Quick Bites", "Snack Bar", "Food Truck", "Express Eats", "Bite House"],
  budget: ["Mess", "Deluxe Restaurant", "Family Restaurant", "Tiffin Center", "Budget Bites", "Thali House"],
  nightlife: ["Lounge Bar", "Night Club", "Rooftop Bar", "Pub", "Music Lounge", "Sky Bar"],
  gaming: ["Game Zone", "Arcade", "Gaming Cafe", "Play Station Hub", "VR Zone", "Esports Cafe"],
  fitness: ["Gym", "Fitness Center", "CrossFit Studio", "Workout Hub", "Health Club", "Power Gym"],
  rentals: ["Bike Rentals", "Scooter Rentals", "Car Rentals", "Vehicle Hub", "Ride Rentals", "Wheels On Rent"],
};

const AREAS = [
  "Tiger Circle", "Court Road", "Madhav Nagar", "End Point Road",
  "MIT Circle", "Eshwar Nagar", "Syndicate Circle", "Bejai Road",
  "Hospital Road", "Airport Road Manipal", "Pragathi Nagar", "Brahmavar Road",
  "KMC Greens", "Athletic Stadium Road", "Welcome Inn Road",
];

const PRICE_LEVELS = ["", "$", "$", "$$", "$$", "$$$"];

function generatePlacesForMood(mood) {
  const places = [];
  const templates = NAME_TEMPLATES[mood];
  const images = IMAGES[mood];

  for (let i = 0; i < 15; i++) {
    const namePrefix = templates[i % templates.length];
    const area = AREAS[i % AREAS.length];
    const rating = (3.5 + Math.random() * 1.5).toFixed(1);
    const reviews = Math.floor(30 + Math.random() * 500);
    const price = PRICE_LEVELS[Math.floor(Math.random() * PRICE_LEVELS.length)];
    const openNow = Math.random() > 0.2;

    places.push({
      title: `${namePrefix} ${i + 1} - ${area}`,
      type: namePrefix,
      address: `${area}, Manipal`,
      lat: CENTER_LAT + jitter(),
      lon: CENTER_LON + jitter(),
      rating: parseFloat(rating),
      reviews,
      price_level: price,
      open_now: openNow,
      image: images[i % images.length],
      mood_tags: [mood],
      city: "manipal",
    });
  }
  return places;
}

let allPlaces = [];
Object.keys(NAME_TEMPLATES).forEach((mood) => {
  allPlaces = allPlaces.concat(generatePlacesForMood(mood));
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    await Place.deleteMany({});
    allPlaces = allPlaces.map(p => ({
  ...p,
  location: { type: "Point", coordinates: [p.lon, p.lat] },
}));


    await Place.insertMany(allPlaces);
    console.log(`Seeded ${allPlaces.length} places!`);
    process.exit();
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });