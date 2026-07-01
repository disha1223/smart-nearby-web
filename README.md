# 📍 MoodSpot – Smart Nearby Place Finder

## 📌 Description
MoodSpot is a full-stack web + mobile application that helps users discover nearby places based on their mood, preferences, and budget. It uses real-time GPS or selected cities like Manipal and Mangaluru to recommend cafes, clubs, gaming zones, gyms, and other experiences — with user accounts, saved favourites, and a native mobile app built with React Native + Expo.

---

## 🚀 Features

### 🎯 Core Features
- Mood-based recommendations (Study, Hangout, Quick Bite, Budget, Nightlife, Gaming, Fitness, Rentals)
- Real-time GPS location detection
- City toggle (Manipal, Mangalore, Bangalore, Mumbai, Delhi, Hyderabad, Pune, Chennai)
- Radius-based filtering (1km – 10km)
- Budget filtering (₹1000 / ₹2000 / ₹5000)

### 🔎 Advanced Features
- Search by name, type, or location
- Sort by Rating ⭐, Reviews 💬, Name 🔤
- "Open Now" filter 🕐
- Place detail modal (ratings, address, contact, open status, price)
- Direct Google Maps navigation
- Call place directly from the app 📞

### ⭐ User Features
- Signup / Login with JWT authentication
- Favourites saved to MongoDB (persistent across sessions)
- Favourites tab with live count
- Add / remove favourites with instant UI feedback (❤️ / 🤍)
- Logout with confirmation

---

## 🛠️ Tech Stack

### Web Frontend (`client/`)
- React.js
- CSS (custom UI design)
- React Router DOM

### Mobile App (`smart-nearby-mobile/`)
- React Native + Expo (Expo Router — file-based routing)
- AsyncStorage (replaces localStorage for token storage)
- expo-location (replaces browser Geolocation API)
- React Navigation (Stack navigator)

### Backend (`server/`)
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- bcrypt password hashing
- CORS enabled

### APIs & Tools
- SerpAPI (Google Maps place data)
- Browser / Device Geolocation API
- expo-location (mobile GPS)

---

## 📂 Project Structure

```plaintext
mood-places/
├── client/                  # React.js web frontend
│   └── src/
│       ├── components/      # Navbar
│       ├── pages/           # LandingPage, Dashboard, Login, Signup
│       └── App.js           # Routes
│
├── server/                  # Node.js + Express backend
│   ├── config/              # MongoDB connection
│   ├── controllers/         # Auth logic
│   ├── middleware/          # JWT auth middleware
│   ├── models/              # User.js, Place.js
│   ├── routes/              # places.js, authRoutes.js, userRoutes.js
│   └── index.js             # Entry point
│
└── smart-nearby-mobile/     # React Native + Expo mobile app
    └── src/
        ├── app/             # Expo Router screens (file = route)
        │   ├── _layout.tsx  # Stack navigator
        │   ├── index.tsx    # Landing page (/)
        │   ├── login.tsx    # Login (/login)
        │   ├── signup.tsx   # Signup (/signup)
        │   └── dashboard.tsx# Main app (/dashboard)
        ├── constants/       # moodsData.js, config.js (API base URL)
        ├── components/      # PlaceCard, PlaceModal
        └── styles/          # dashboardStyles, landingStyles
```

---

## 🌍 How It Works

1. User signs up / logs in (JWT token stored in AsyncStorage on mobile, localStorage on web)
2. User selects a mood on the dashboard
3. App detects GPS location or uses selected city coordinates
4. Frontend sends request to backend
5. Backend queries MongoDB (Place collection) filtered by mood tags and radius
6. Results are displayed as cards with image, rating, open status, price
7. User can save places to favourites — stored in MongoDB under their user profile
8. Favourites persist across sessions and are loaded on every dashboard visit

---

## 📱 Mobile App Setup

```bash
cd smart-nearby-mobile
npx expo install expo-location @react-native-async-storage/async-storage
npm install @react-navigation/native @react-navigation/stack
npx expo start
```

> ⚠️ Update `src/constants/config.js` with your laptop's local IP address before running on a physical device. Your phone and laptop must be on the same Wi-Fi network.

---

## 🖥️ Web App Setup

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

## 🎯 Future Improvements

- 🗺️ Map view with pins for nearby places
- 📊 Trending places in real-time
- 🧠 Smart recommendations based on past behaviour
- 🎉 Expanded mood categories (movie theatres, beaches, hidden gems)
- 🌐 Deploy backend to cloud (Railway / Render)
- 💡 Investment insights — identify high-demand areas and business opportunities

---

## 💡 Note

MoodSpot was built to explore full-stack development, REST API integration, JWT authentication, MongoDB, and cross-platform mobile development — while solving the real-world problem of discovering places based on mood and context.
