# 📍 Moodly – Smart Nearby Place Finder

## 📌 Description
Moodly is a full-stack web application that helps users discover nearby places based on their mood, a free-text description of what they want, or a chosen city. It combines a mood-based discovery dashboard, a natural-language "Ask AI" search, saved favourites, a personal travel journal, and city switching — backed by MongoDB, SerpAPI (Google Maps data), and Google's Gemini API for language understanding.

---

## 🚀 Features

### 🎯 Mood-Based Discovery (`/dashboard`)
- 10+ mood categories: Study, Hangout, Quick Bite, Budget, Nightlife, Gaming, Fitness, Rentals, Beaches, Hidden Gems (easily extendable)
- Radius filtering (1–10 km)
- Budget filtering (Under ₹1000 / ₹2000 / ₹5000)
- Minimum rating filter and "Open Now" toggle
- Sort by Rating, Reviews, or Name
- Trending nearby places (highly rated, high-review places within your radius)
- Place detail modal with address, phone, price, open status, and one-tap Google Maps directions

### 🧠 "Ask AI" Smart Search
- Type what you're looking for in plain language (e.g. *"quiet place to work"*, *"cheap food, nothing too loud"*)
- Backed by Gemini, which parses free text into a structured search intent: search phrase, implied budget, implied travel radius, and things to exclude
- Falls back gracefully to a raw-text search if no Gemini API key is configured or parsing fails, so the feature still works either way

### ⭐ Collections (Favourites)
- Save/unsave any place with one tap, synced to MongoDB per user
- Persists across sessions and devices
- Self-healing: if a saved place is ever removed from the database (e.g. during a data reseed), the stale reference is automatically detected and cleaned up server-side instead of breaking the page

### 📓 Travel Journal
- Log personal notes about places you've visited, with automatic timestamps
- Chronological entry list (newest first) with delete support

### 🌆 Cities
- Switch between Manipal, Bangalore, Mumbai, Goa, Delhi, and Pune
- Selected city persists and is used as the search center across the dashboard

### 🔐 Accounts
- Signup / Login with JWT authentication
- Passwords hashed with bcrypt; signup enforces a strong-password policy
- Welcome email sent on signup (via Gmail/Nodemailer)
- Protected routes (Dashboard, Collections, Journal) redirect to login if not authenticated

### ⚙️ Under the Hood
- **Live + seeded data**: mood search checks live SerpAPI results first, then automatically falls back to the already-seeded MongoDB place data if SerpAPI is rate-limited or unavailable, so the app keeps working during API outages
- **Geospatial search**: MongoDB `2dsphere` index + `$geoNear` aggregation for accurate distance-based filtering and sorting
- **Response caching**: Redis-backed cache (6-hour TTL) for repeated searches, when `REDIS_URL` is configured — falls back to always-live search if not
- **Image proxying**: place images are proxied through the backend to avoid hotlinking/CORS issues
- **Bulk data seeding script** (`server/seedFromSerpApi.js`): pulls places from SerpAPI across many mood-specific query variants, paginates results, deduplicates places that match multiple moods, and includes retry-with-backoff plus quota-exhaustion detection so a rate limit doesn't silently corrupt a run

---

## 🛠️ Tech Stack

### Frontend (`client/`)
- React.js + React Router DOM
- Custom CSS (no UI framework)
- lucide-react icons

### Backend (`server/`)
- Node.js + Express.js
- MongoDB + Mongoose (with 2dsphere geospatial indexing)
- Redis (optional, for search-result caching)
- JWT authentication + bcrypt password hashing
- Nodemailer (Gmail) for welcome emails

### External APIs
- **SerpAPI** — Google Maps place data (search, hours, ratings, images)
- **Google Gemini API** — natural-language intent parsing for "Ask AI"
- Browser Geolocation API — GPS-based location detection

---

## 📂 Project Structure

```plaintext
smart-nearby-web/
├── client/                     # React web frontend
│   └── src/
│       ├── components/         # Navbar
│       ├── pages/              # LandingPage, Login, Signup,
│       │                       # Collections, Cities, Journal
│       └── App.js              # Routes + main Dashboard component
│
└── server/                     # Node.js + Express backend
    ├── config/                 # MongoDB connection
    ├── controllers/            # Auth logic (signup/login)
    ├── models/                 # User.js, Place.js, Favourite.js
    ├── routes/                 # places.js, authRoutes.js, userRoutes.js, configData.js
    ├── utils/                  # cache.js (Redis), intentParser.js (Gemini), mailer.js
    ├── seed.js                 # Manual/static seed data
    ├── seedFromSerpApi.js      # Bulk place seeding from SerpAPI
    └── index.js                # Entry point
```

---

## 🌍 How It Works

1. User signs up / logs in (JWT stored in `localStorage`)
2. User picks a mood, types a free-text request for "Ask AI", or selects a city
3. The app detects GPS location or uses the selected city's coordinates
4. **Mood search**: backend attempts a live SerpAPI refresh, then queries MongoDB (`Place` collection) via geospatial `$geoNear` filtered by mood tags and radius — falling back to DB-only results if SerpAPI fails
5. **Ask AI search**: user's text is parsed by Gemini into a structured intent (query, budget, radius, exclusions), then matched against live SerpAPI results
6. Results are shown as cards with image, rating, distance, open status, and price
7. User can save places to Collections (favourites) — persisted in MongoDB and available on every future visit
8. User can log notes about places visited in the Journal

---

## 🖥️ Setup

```bash
# Backend
cd server
npm install
node index.js

# Frontend
cd client
npm install
npm start
```


---
## 💡 Note

Moodly was built to explore full-stack development, geospatial search with MongoDB, third-party API integration (SerpAPI + Gemini), JWT authentication, and resilient error-handling patterns — while solving the real-world problem of discovering places based on mood and context.
