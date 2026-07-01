import React, { useState, useEffect } from "react";
import "./App.css";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Signup from "./pages/Signup";
import LandingPage from "./pages/landingpage";
import Login from "./pages/Login";
import Navbar from "./components/Navbar";
const MOODS = [
  { key: "study", emoji: " 📚", label: "study", sub: "Wifi · Quiet", color: "#667eea", bg: "#eef0ff" },
  { key: "Hangout", emoji: "🍔", label: "Hangout", sub: "Cozy · Romantic", color: "#f093fb", bg: "#fdf0ff" },
  { key: "quick-bite", emoji: "🍕", label: "Quick Bite", sub: "Fast · Easy", color: "#f59e0b", bg: "#fffbeb" },
  { key: "budget", emoji: "🪙", label: "Budget", sub: "Cheap · Value", color: "#10b981", bg: "#ecfdf5" },
];

const CITIES = [
  { key: "manipal", label: "Manipal", lat: 13.3525, lon: 74.7934 },
  { key: "mangalore", label: " Mangalore", lat: 12.9716, lon: 74.8631 },
];

const RADIUS_OPTIONS = [1, 2, 3, 5, 10];
const BUDGET_OPTIONS = [
  { label: "Any", value: "" },
  { label: "Under ₹1000", value: "$" },
  { label: "Under ₹2000", value: "$$" },
  { label: "Under ₹5000", value: "$$$" },
];
const SORT_OPTIONS = [
  { label: "⭐ Rating", value: "rating" },
  { label: "💬 Reviews", value: "reviews" },
  { label: "🔤 Name", value: "name" },
];

function Dashboard() {
  const [mood, setMood] = useState("");
  const [city, setCity] = useState(CITIES[0]);
  const [useGPS, setUseGPS] = useState(true);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [radius, setRadius] = useState(3);
  const [budget, setBudget] = useState("");
  const [openNow, setOpenNow] = useState(false);
  const [sortBy, setSortBy] = useState("rating");
  const [searchQuery, setSearchQuery] = useState("");
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
const [favourites, setFavourites] = useState([]);
  const [activeTab, setActiveTab] = useState("explore");

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setGpsLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setUseGPS(false)
    );
  }, []);



  // ✅ ADD HERE (line 62)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://localhost:5000/api/user/favourites", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setFavourites(data);
      })
      .catch(console.error);
  }, []);

 // line 63 continues as normal
  const getLocation = () =>
    useGPS && gpsLocation ? gpsLocation : { lat: city.lat, lon: city.lon };

  const handleSearch = async () => {
    if (!mood) return;
    const loc = getLocation();
    setLoading(true);
    setError("");
    setPlaces([]);
    setSearched(true);
    setActiveTab("explore");

    try {
      const params = new URLSearchParams({
        mood, lat: loc.lat, lon: loc.lon, radius,
        ...(budget && { maxPrice: budget }),
      });
const res = await fetch(`http://localhost:5000/api/places?${params}`);      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPlaces(data.results || []);
    } catch (err) {
      setError(err.message || "Failed to fetch places");
    } finally {
      setLoading(false);
    }
  };

// REPLACE your toggleFav with this
const toggleFav = async (place) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    const exists = favourites.find((p) => p.title === place.title);

    if (exists) {
      // ✅ Remove from local state
      setFavourites((prev) => prev.filter((p) => p.title !== place.title));

      // ✅ Remove from DB
      await fetch("/api/user/favourite", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: place.title }),
      });

    } else {
      // ✅ Add to local state
      setFavourites((prev) => [...prev, place]);

      // ✅ Add to DB
      await fetch("http://localhost:5000/api/user/favourite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(place),
      });
    }
  } catch (error) {
    console.error(error);
  }
};

  const isFav = (place) => favourites.some((p) => p.title === place.title);

  const filterAndSort = (list) => {
    let result = [...list];
    if (openNow) {
      result = result.filter((p) =>
        p.open_state?.toLowerCase().includes("open")
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.type?.toLowerCase().includes(q) ||
          p.address?.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "reviews") return (b.reviews || 0) - (a.reviews || 0);
      if (sortBy === "name") return a.title?.localeCompare(b.title);
      return 0;
    });
    return result;
  };

  const displayPlaces = activeTab === "favourites"
    ? filterAndSort(favourites)
    : filterAndSort(places);

  const activeLocation = useGPS && gpsLocation
    ? "📡 Using your GPS location"
    : `📍 ${city.label}`;

  return (
    <div>
      <Navbar />
      <div className="header">
          <h1>Discover Places That Match Your Mood</h1>

        <p>
    Find cafes, restaurants and hangout spots
    <br />
    tailored to how you feel.
  </p>
      

</div>

      <div className="container">
        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === "explore" ? "active" : ""}`}
            onClick={() => setActiveTab("explore")}
          >
            🔍 Explore
          </button>
          <button
            className={`tab ${activeTab === "favourites" ? "active" : ""}`}
            onClick={() => setActiveTab("favourites")}
          >
            ⭐ Favourites ({favourites.length})
          </button>
        </div>

        {activeTab === "explore" && (
          <>
            {/* Location Bar */}
            <div className="location-bar">
              <span>{activeLocation}</span>
              <div className="city-btns">
                {gpsLocation && (
                  <button
                    className={`city-btn ${useGPS ? "active" : ""}`}
                    onClick={() => setUseGPS(true)}
                  >
                    GPS
                  </button>
                )}
                {CITIES.map((c) => (
                  <button
                    key={c.key}
                    className={`city-btn ${!useGPS && city.key === c.key ? "active" : ""}`}
                    onClick={() => { setCity(c); setUseGPS(false); }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mood */}
            <p className="section-title">What's your mood?</p>
            <div className="mood-grid">
              {MOODS.map((m) => (
                <button
                  key={m.key}
                  className={`mood-btn ${mood === m.key ? "active" : ""}`}
                  style={{ "--color": m.color, "--bg": m.bg }}
                  onClick={() => setMood(m.key)}
                >
                  <span className="emoji">{m.emoji}</span>
                  <span className="label">{m.label}</span>
                  <span className="sub">{m.sub}</span>
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="filters">
              <div>
                <p className="section-title">Radius</p>
                <div className="filter-pills">
                  {RADIUS_OPTIONS.map((r) => (
                    <button
                      key={r}
                      className={`pill ${radius === r ? "active" : ""}`}
                      onClick={() => setRadius(r)}
                    >
                      {r} km
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="section-title">Budget</p>
                <div className="filter-pills">
                  {BUDGET_OPTIONS.map((b) => (
                    <button
                      key={b.value}
                      className={`pill ${budget === b.value ? "active" : ""}`}
                      onClick={() => setBudget(b.value)}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="toggle-row">
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={openNow}
                    onChange={(e) => setOpenNow(e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
                <span className="toggle-label">🕐 Open Now only</span>
              </div>
            </div>

            {/* Search Button */}
            <button
              className="search-btn"
              onClick={handleSearch}
              disabled={!mood || loading}
            >
              {loading ? "Searching..." : "🔍 Find Places Near Me"}
            </button>
          </>
        )}

        {/* Search + Sort bar — shown after results load */}
        {(places.length > 0 || activeTab === "favourites") && (
          <>
            <div className="search-bar-wrap">
              <span className="search-icon">🔎</span>
              <input
                type="text"
                placeholder="Search by name, type, area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="sort-row">
              <span>Sort by:</span>
              {SORT_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  className={`pill ${sortBy === s.value ? "active" : ""}`}
                  onClick={() => setSortBy(s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* States */}
        {loading && (
          <div className="loading">
            <div className="loading-spinner" />
            Finding places for you...
          </div>
        )}
        {error && <div className="error">❌ {error}</div>}
        {searched && !loading && displayPlaces.length === 0 && !error && (
          <div className="empty">
            {activeTab === "favourites"
              ? "⭐ No favourites yet — start exploring!"
              : "😕 No places found. Try increasing the radius!"}
          </div>
        )}

        {/* Results */}
       {/* Results */}
{displayPlaces.length > 0 && (
  <>
    <p className="results-header">
      {activeTab === "favourites"
        ? `⭐ ${displayPlaces.length} saved places`
        : `🎯 ${displayPlaces.length} places found`}
    </p>
    <div className="results-grid">
      {displayPlaces.map((place, i) => (
        <div
          className="place-card"
          key={i}
          style={{ animationDelay: `${i * 50}ms` }}
          onClick={() => setSelectedPlace(place)}
        >
          <div className="place-img-wrap">
            <img
              src={place.thumbnail}
              alt={place.title}
              className="place-img"
              onError={(e) => { e.target.src = "https://placehold.co/400x200?text=No+Image"; }}
            />
            <div className="place-img-overlay">
              <span className="place-name-overlay">{place.title}</span>
              {place.rating && <span className="rating-overlay">⭐ {place.rating}</span>}
            </div>
          </div>
          <div className="place-info">
            <div className="place-type">{place.type}</div>
            <div className="place-address">📍 {place.address}</div>
            <div className="place-meta">
              {place.reviews && <span className="reviews">({place.reviews} reviews)</span>}
              {place.open_state && (
                <span className={`open-badge ${place.open_state.toLowerCase().includes("open") ? "open" : "closed"}`}>
                  {place.open_state}
                </span>
              )}
              {place.price && <span className="price-badge">{place.price}</span>}
              <button
                className="fav-btn"
                onClick={(e) => { e.stopPropagation(); toggleFav(place); }}
              >
                {isFav(place) ? "❤️" : "🤍"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </>
)}
      </div>

      {/* Place Detail Modal */}
      {selectedPlace && (
        <div className="modal-overlay" onClick={() => setSelectedPlace(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {selectedPlace.thumbnail && (
              <img src={selectedPlace.thumbnail} alt={selectedPlace.title} className="modal-img" />
            )}
            <div className="modal-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div className="modal-title">{selectedPlace.title}</div>
                  <div className="modal-type">{selectedPlace.type}</div>
                </div>
                <button
                  className="fav-btn"
                  style={{ fontSize: "24px" }}
                  onClick={() => toggleFav(selectedPlace)}
                >
                  {isFav(selectedPlace) ? "❤️" : "🤍"}
                </button>
              </div>

              {selectedPlace.rating && (
                <div className="modal-row">⭐ {selectedPlace.rating} · {selectedPlace.reviews} reviews</div>
              )}
              {selectedPlace.address && (
                <div className="modal-row">📍 {selectedPlace.address}</div>
              )}
              {selectedPlace.open_state && (
                <div className="modal-row">🕐 {selectedPlace.open_state}</div>
              )}
              {selectedPlace.price && (
                <div className="modal-row">💰 {selectedPlace.price}</div>
              )}
              {selectedPlace.phone && (
                <div className="modal-row">📞 {selectedPlace.phone}</div>
              )}
              {selectedPlace.description && (
                <div className="modal-row">📝 {selectedPlace.description}</div>
              )}

              <div className="modal-actions">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPlace.title)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="modal-btn primary"
                  style={{ textDecoration: "none", textAlign: "center" }}
                >
                  🗺️ Get Directions
                </a>
                <button
                  className="modal-btn secondary"
                  onClick={() => setSelectedPlace(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<LandingPage />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

      </Routes>

    </BrowserRouter>
    

  );
}