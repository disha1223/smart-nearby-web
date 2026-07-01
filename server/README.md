# 📍 MoodSpot – Smart Nearby Place Finder

## 📌 Description

MoodSpot is a full-stack web application that helps users discover nearby places based on their mood, preferences, and budget. It uses real-time location (GPS) or selected cities like Manipal and Mangaluru to recommend cafes, clubs, tourist spots, and other experiences.

---

## 🚀 Features

### 🎯 Core Features

* Mood-based recommendations (Work, Date, Quick Bite, Budget)
* Real-time location detection using Geolocation API
* City toggle (Manipal / Mangaluru)
* Radius-based filtering (1km – 10km)
* Budget filtering (₹1000 / ₹2000 / ₹5000)

### 🔎 Advanced Features

* Search by name, type, or location
* Sort by:

  * Rating ⭐
  * Reviews 💬
  * Name 🔤
* "Open Now" filter 🕐
* Clean and modern UI

### ⭐ User Features

* Save favourite places (stored using localStorage)
* Favourites tab
* Place detail modal (ratings, address, contact, etc.)
* Direct Google Maps navigation

---

## 🛠️ Tech Stack

### Frontend

* React.js
* CSS (custom UI design)

### Backend

* Node.js
* Express.js

### APIs & Tools

* SerpAPI (Google Maps data)
* Browser Geolocation API

---

## 📂 Project Structure

```plaintext
mood-places/
│── client/        # React frontend
│── server/        # Node.js backend
```

---

## ▶️ How to Run

### 1️⃣ Clone the Repository

```
git clone https://github.com/disha1223/smart-nearby.git
cd smart-nearby
```

---

### 2️⃣ Setup Backend

```
cd server
npm install
```

Create `.env` file:

```
SERPAPI_KEY=your_api_key_here
PORT=5000
```

Run backend:

```
npm run dev
```

---

### 3️⃣ Setup Frontend

```
cd ../client
npm install
npm start
```

---

## 🌍 How It Works

1. User selects a mood (Work, Date, etc.)
2. App detects location (GPS or selected city)
3. Frontend sends request to backend
4. Backend fetches data using SerpAPI (Google Maps)
5. Results are filtered and displayed in a clean UI

---

## 📸 Screenshots

*Add your UI screenshots here (recommended for better presentation)*

---

## 🎯 Future Improvements

* 🎉 Add category-based exploration:

  * Clubs & nightlife
  * Cafes
  * Tourist spots (beaches, hidden gems)
  * Gaming zones (Glitch, Trigger, Black Tiger, etc.)
  * Movie theatres
  * Gyms
  * Vehicle rentals

* 🧭 Discover hidden and less-known places

* 📍 Show “happening places” in cities like Manipal & Mangaluru

* 🗺️ Map integration for better visualization

* 📊 Show trending places in real-time

* 🧠 Smart recommendations based on user behavior

* 💡 Investment insights:

  * Identify high-demand areas
  * Suggest potential business opportunities

---

## 👤 Author

**Disha**

---

## 💡 Note

This project was built to explore full-stack development, API integration, and frontend UI design while solving a real-world problem of discovering places based on user mood and context.
