import React, { useState, useEffect } from "react";
import "./App.css";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useSearchParams,
} from "react-router-dom";

import Signup from "./pages/Signup";
import LandingPage from "./pages/landingpage";
import Login from "./pages/Login";
import Navbar from "./components/Navbar";
import { SlidersHorizontal, Heart, Search } from "lucide-react";
import SafetyRatingWidget from "./components/SafetyRatingWidget";
import Collections from "./pages/collections";
import Cities from "./pages/Cities";
import Journal from "./pages/journal";
import Hangout from "./pages/Hangout";
import Insights from "./pages/Insights";


import studyImg from "./pages/images/study.jpeg";
import hangoutImg from "./pages/images/hangg.jpeg";
import quickBiteImg from "./pages/images/bite.jpeg";
import budgetImg from "./pages/images/hang.jpeg";
import nightlifeImg from "./pages/images/club.jpeg";
import gamingImg from "./pages/images/game.jpeg";
import fitnessImg from "./pages/images/gym.jpeg";
import rentalsImg from "./pages/images/rent.jpeg";
import beachImg from "./pages/images/beach.jpeg";
import hiddenGemImg from "./pages/images/hidden.jpeg";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const isValid = token && token !== "undefined" && token !== "null";
  return isValid ? children : <Navigate to="/login" replace />;
}

const MOODS = [
  { key: "study", label: "Study", sub: "Quiet & Focused", color: "#667eea", bg: "#e0e4ff", img: studyImg },
  { key: "hangout", label: "Hangout", sub: "Rooftops & Long Tables", color: "#ec4899", bg: "#fce7f3", img: hangoutImg },
  { key: "quick-bite", label: "Quick Bite", sub: "In a Hurry", color: "#f59e0b", bg: "#fef3c7", img: quickBiteImg },
  { key: "budget", label: "Budget", sub: "Easy on the Wallet", color: "#10b981", bg: "#d1fae5", img: budgetImg },
  { key: "nightlife", label: "Nightlife", sub: "After Dark", color: "#ec4899", bg: "#fdf2f8", img: nightlifeImg },
  { key: "gaming", label: "Gaming", sub: "Play Together", color: "#8b5cf6", bg: "#f5f3ff", img: gamingImg },
  { key: "fitness", label: "Fitness", sub: "Move Your Body", color: "#06b6d4", bg: "#ecfeff", img: fitnessImg },
  { key: "rentals", label: "Rentals", sub: "On the Move", color: "#84cc16", bg: "#f7fee7", img: rentalsImg },
  { key: "beaches", label: "Beaches", sub: "Sand & Salt Air", color: "#0ea5e9", bg: "#e0f2fe", img: beachImg },
  { key: "hidden-gems", label: "Hidden Gems", sub: "Off the Beaten Path", color: "#a855f7", bg: "#f3e8ff", img: hiddenGemImg },
];

const RADIUS_OPTIONS = [1, 2, 3, 5, 10];
const BUDGET_OPTIONS = [
  { label: "Any", value: "" },
  { label: "Under ₹1000", value: "$" },
  { label: "Under ₹2000", value: "$$" },
  { label: "Under ₹5000", value: "$$$" },
];
const SORT_OPTIONS = [
  { label: "Rating", value: "rating" },
  { label: "Reviews", value: "reviews" },
  { label: "Name", value: "name" },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning.";
  if (hour < 17) return "Good afternoon.";
  if (hour < 21) return "Good evening.";
  return "Good night.";
}

function getSubtitle() {
  const hour = new Date().getHours();
  if (hour < 12) {
    return "A quiet café, a fresh start, or somewhere new to think. Tell us the feeling — we'll find the place.";
  }
  if (hour < 17) {
    return "A quiet café, a quick lunch, or somewhere new to think. Tell us the feeling — we'll find the place.";
  }
  if (hour < 21) {
    return "A cozy dinner spot, a rooftop view, or somewhere new to unwind. Tell us the feeling — we'll find the place.";
  }
  return "A quiet café, a late-night bite, or somewhere new to think. Tell us the feeling — we'll find the place.";
}

function getProxiedImage(url) {
  if (!url) return "";
  return `http://localhost:5000/api/places/image-proxy?url=${encodeURIComponent(url)}`;
}
function Dashboard() {
  const [mood, setMood] = useState("");
  const city = { label: "Manipal", lat: 13.3525, lon: 74.7934 };
  const [useGPS, setUseGPS] = useState(false);
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
  const moodScrollRef = React.useRef(null);
  const [minRating, setMinRating] = useState(0);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [trending, setTrending] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [smartLoading, setSmartLoading] = useState(false);
  const [interpretedAs, setInterpretedAs] = useState(null);
  const [isSmartSearch, setIsSmartSearch] = useState(false);

  const [searchParams] = useSearchParams();
  const initialSearchDone = React.useRef(false);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !initialSearchDone.current) {
      setSearchQuery(q);
      initialSearchDone.current = true;
    }
  }, []);

  useEffect(() => {
    if (initialSearchDone.current && searchQuery) {
      handleSearch();
      initialSearchDone.current = false;
    }
  }, [searchQuery]);

  const scrollMoods = (dir) => {
    if (moodScrollRef.current) {
      moodScrollRef.current.scrollBy({ left: dir * 320, behavior: "smooth" });
    }
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log("Accuracy (meters):", pos.coords.accuracy);
        setGpsLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => setUseGPS(false)
    );
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://localhost:5000/api/user/favourites", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.favourites)) {
          setFavourites(data.favourites.filter(Boolean));
        }
      })
      .catch(console.error);
  }, []);

  const getLocation = () =>
    useGPS && gpsLocation ? gpsLocation : { lat: city.lat, lon: city.lon };

  useEffect(() => {
    const loc = getLocation();
    setTrendingLoading(true);
    fetch(`http://localhost:5000/api/places/trending?lat=${loc.lat}&lon=${loc.lon}&radius=5`)
      .then((res) => res.json())
      .then((data) => setTrending(data.results || []))
      .catch(console.error)
      .finally(() => setTrendingLoading(false));
  }, [useGPS, gpsLocation]);

  const handleSearch = async () => {
    if (!mood && !searchQuery.trim()) return;
    const loc = getLocation();
    setLoading(true);
    setError("");
    setPlaces([]);
    setSearched(true);
    setActiveTab("explore");
    setIsSmartSearch(false);
    

    try {
      const params = new URLSearchParams({
        lat: loc.lat,
        lon: loc.lon,
        radius,
        ...(mood && { mood }),
        ...(searchQuery.trim() && { q: searchQuery.trim() }),
        ...(budget && { maxPrice: budget }),
      });
      const res = await fetch(`http://localhost:5000/api/places?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPlaces(data.results || []);
    } catch (err) {
      setError(err.message || "Failed to fetch places");
    } finally {
      setLoading(false);
    }
  };
const handleSmartSearch = async () => {
    if (!searchQuery.trim()) return;
    const loc = getLocation();
    setSmartLoading(true);
    setError("");
    setPlaces([]);
    setSearched(true);
    setActiveTab("explore");
    setInterpretedAs(null);
    setIsSmartSearch(true);

    try {
      const res = await fetch("http://localhost:5000/api/places/smart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: searchQuery.trim(),
          lat: loc.lat,
          lon: loc.lon,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPlaces(data.results || []);
      setInterpretedAs(data.interpretedAs || null);
    } catch (err) {
      setError(err.message || "Failed to fetch places");
    } finally {
      setSmartLoading(false);
    }
  };
  const toggleFav = async (place) => {
    const token = localStorage.getItem("token");
    if (!token || !place) return;

    const exists = favourites.find((p) => p && p.title === place.title);

    setFavourites((prev) =>
      exists
        ? prev.filter((p) => p && p.title !== place.title)
        : [...prev, place]
    );

    try {
      const res = await fetch("http://localhost:5000/api/user/favourites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ place }),
      });
      const data = await res.json();
      if (Array.isArray(data.favourites)) {
        setFavourites(data.favourites.filter(Boolean));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const isFav = (place) =>
    !!place && favourites.some((p) => p && p.title === place.title);

  const filterAndSort = (list) => {
    let result = [...list];
    if (openNow) {
      result = result.filter((p) => p.open_state?.toLowerCase().includes("open"));
    }
    if (minRating > 0) {
      result = result.filter((p) => (p.rating || 0) >= minRating);
    }
    if (searchQuery.trim() && !isSmartSearch) {
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

  return (
    <div>
      <Navbar />
      <div className="hero">
        <div className="hero-location">
          <span className="hero-location-dot" />
          {useGPS && gpsLocation ? "Current Location" : city.label} · {radius} km radius
        </div>
        <h1 className="hero-title">
          {getGreeting()}<br />
          What are you in the mood for?
        </h1>
        <p className="hero-subtitle">
          {getSubtitle()}
        </p>

<div className="search-bar-row">
        <div className="search-bar-wrap-main">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search cafes, study spots, hidden gems..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <div className="search-actions">
            <button
              className="discover-btn"
              onClick={handleSearch}
              disabled={(!mood && !searchQuery.trim()) || loading}
            >
              {loading ? "..." : "Discover"}
            </button>
            <button
              className="discover-btn ask-ai-btn"
              onClick={handleSmartSearch}
              disabled={!searchQuery.trim() || smartLoading}
              title="Describe what you want in plain language and let AI find it"
            >
              {smartLoading ? "Thinking..." : "Ask AI"}
            </button>
          </div>
        </div>
      </div>
        {interpretedAs && (
          <div
            className="hero-location"
            style={{ marginTop: "14px", display: "inline-flex" }}
          >
            <span className="hero-location-dot" style={{ background: "#7c3aed" }} />
            ✨ Searching for <strong style={{ margin: "0 4px" }}>{interpretedAs.searchQuery}</strong>
            {interpretedAs.maxBudgetRupees ? `· under ₹${interpretedAs.maxBudgetRupees} ` : ""}
            {interpretedAs.radiusKm ? `· within ${interpretedAs.radiusKm}km ` : ""}
            {interpretedAs.excludeKeywords?.length > 0 ? `· avoiding ${interpretedAs.excludeKeywords.join(", ")}` : ""}
          </div>
        )}
      </div>

      <div className="container">
        {activeTab === "explore" && (
          <>
            {trendingLoading ? (
              <div className="mood-section">
                <p className="mood-eyebrow">00 — TRENDING</p>
                <h2 className="mood-title">Trending nearby</h2>
                <div className="loading">
                  <div className="loading-spinner" />
                  Finding what's popular...
                </div>
              </div>
            ) : trending.length > 0 ? (
              <div className="mood-section">
                <div className="mood-heading-row">
                  <div>
                    <p className="mood-eyebrow">00 — TRENDING</p>
                    <h2 className="mood-title">Trending nearby</h2>
                    <p className="mood-subtitle">The most talked-about places around you right now.</p>
                  </div>
                </div>
                <div className="mood-grid">
                  {trending.map((place, i) => (
                    <div
                      key={i}
                      className="trending-card"
                      style={{ backgroundImage: `url(${getProxiedImage(place.thumbnail)})` }}
                      onClick={() => setSelectedPlace(place)}
                    >
                      <span className="trending-card-overlay">
                        <span className="trending-card-rating">★ {place.rating} · {place.reviews} reviews</span>
                        <span className="trending-card-name">{place.title}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mood-section">
              <div className="mood-heading-row">
                <div>
                  <p className="mood-eyebrow">01 — MOODS</p>
                  <h2 className="mood-title">Choose your mood</h2>
                  <p className="mood-subtitle">Discover places that match how you're feeling today.</p>
                </div>
                <div className="mood-nav-arrows">
                  <button className="mood-arrow" onClick={() => scrollMoods(-1)}>‹</button>
                  <button className="mood-arrow" onClick={() => scrollMoods(1)}>›</button>
                </div>
              </div>
              <div className="mood-grid" ref={moodScrollRef}>
                {MOODS.map((m) => (
                  <button
                    key={m.key}
                    className={`mood-card ${mood === m.key ? "active" : ""}`}
                    style={{ backgroundImage: `url(${m.img})` }}
                    onClick={() => setMood(m.key)}
                  >
                    <span className="mood-card-overlay">
                      <span className="mood-card-sub">{m.sub}</span>
                      <span className="mood-card-label">{m.label}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="search-btn"
                onClick={handleSearch}
                disabled={!mood || loading}
              >
                {loading ? "Searching..." : "Find Places Near Me"}
              </button>
              <button
                className="search-btn"
                style={{ background: "#3F6DF6" }}
                onClick={async () => {
                  const loc = getLocation();
                  const token = localStorage.getItem("token");
                  try {
                    const res = await fetch("http://localhost:5000/api/hangout/create", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({ lat: loc.lat, lon: loc.lon, radius, mood: mood || "hangout" }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message);
                    window.location.href = `/hangout/${data.code}`;
                  } catch (err) {
                    alert(err.message || "Failed to create hangout session");
                  }
                }}
              >
                 Plan a Hangout
              </button>
            </div>
          </>
        )}
        {(activeTab === "explore" || activeTab === "favourites") && (
          <div className="results-heading-row">
            <p className="mood-eyebrow">04 — ALL PLACES</p>
            <h2 className="mood-title">Within a short walk from you</h2>

            <div className="filter-pills-row">
              <div className="filter-dropdown-wrap">
                <button
                  className={`filter-dropdown-pill ${openDropdown === "radius" ? "open" : ""}`}
                  onClick={() => setOpenDropdown(openDropdown === "radius" ? null : "radius")}
                >
                  Within {radius} km <span className="chevron">▾</span>
                </button>
                {openDropdown === "radius" && (
                  <div className="filter-dropdown-menu">
                    {RADIUS_OPTIONS.map((r) => (
                      <button
                        key={r}
                        className={radius === r ? "active" : ""}
                        onClick={() => { setRadius(r); setOpenDropdown(null); }}
                      >
                        {r} km
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="filter-dropdown-wrap">
                <button
                  className={`filter-dropdown-pill ${openDropdown === "budget" ? "open" : ""}`}
                  onClick={() => setOpenDropdown(openDropdown === "budget" ? null : "budget")}
                >
                  {BUDGET_OPTIONS.find((b) => b.value === budget)?.label || "Any budget"} <span className="chevron">▾</span>
                </button>
                {openDropdown === "budget" && (
                  <div className="filter-dropdown-menu">
                    {BUDGET_OPTIONS.map((b) => (
                      <button
                        key={b.value}
                        className={budget === b.value ? "active" : ""}
                        onClick={() => { setBudget(b.value); setOpenDropdown(null); }}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                className={`filter-dropdown-pill toggle-only ${openNow ? "active" : ""}`}
                onClick={() => setOpenNow(!openNow)}
              >
                Open now
              </button>

              <div className="filter-dropdown-wrap">
                <button
                  className={`filter-dropdown-pill ${openDropdown === "rating" ? "open" : ""}`}
                  onClick={() => setOpenDropdown(openDropdown === "rating" ? null : "rating")}
                >
                  {minRating > 0 ? `${minRating}★ & above` : "Any rating"} <span className="chevron">▾</span>
                </button>
                {openDropdown === "rating" && (
                  <div className="filter-dropdown-menu">
                    {[0, 3.5, 4.0, 4.5].map((r) => (
                      <button
                        key={r}
                        className={minRating === r ? "active" : ""}
                        onClick={() => { setMinRating(r); setOpenDropdown(null); }}
                      >
                        {r === 0 ? "Any rating" : `${r}★ & above`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="filter-dropdown-wrap">
                <button
                  className={`filter-dropdown-pill ${openDropdown === "sort" ? "open" : ""}`}
                  onClick={() => setOpenDropdown(openDropdown === "sort" ? null : "sort")}
                >
                  Sort: {SORT_OPTIONS.find((s) => s.value === sortBy)?.label || "Recommended"} <span className="chevron">▾</span>
                </button>
                {openDropdown === "sort" && (
                  <div className="filter-dropdown-menu">
                    {SORT_OPTIONS.map((s) => (
                      <button
                        key={s.value}
                        className={sortBy === s.value ? "active" : ""}
                        onClick={() => { setSortBy(s.value); setOpenDropdown(null); }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="loading">
            <div className="loading-spinner" />
            Finding places for you...
          </div>
        )}
        {error && <div className="error">{error}</div>}
        {searched && !loading && displayPlaces.length === 0 && !error && (
          <div className="empty">
            {activeTab === "favourites"
              ? "No favourites yet — start exploring!"
              : "No places found. Try increasing the radius!"}
          </div>
        )}

        {displayPlaces.length > 0 && (
          <>
            <p className="results-header">
              {activeTab === "favourites"
                ? `${displayPlaces.length} saved places`
                : `${displayPlaces.length} places found`}
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
  src={getProxiedImage(place.thumbnail)}
  alt={place.title}
  className="place-img"
  onError={(e) => { e.target.src = "https://placehold.co/400x200?text=No+Image"; }}
/>
                    <div className="place-img-overlay">
                      <span className="place-name-overlay">{place.title}</span>
                      {place.rating && <span className="rating-overlay">{place.rating}</span>}
                    </div>
                  </div>
                  <div className="place-info">
                    <div className="place-type">{place.type}</div>
                    <div className="place-address">{place.address}</div>
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
                        <Heart size={18} fill={isFav(place) ? "#e0433f" : "none"} color={isFav(place) ? "#e0433f" : "#999"} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {selectedPlace && (
        <div className="modal-overlay" onClick={() => setSelectedPlace(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {selectedPlace.thumbnail && (
              <img src={getProxiedImage(selectedPlace.thumbnail)} alt={selectedPlace.title} className="modal-img" />
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
                  <Heart size={22} fill={isFav(selectedPlace) ? "#e0433f" : "none"} color={isFav(selectedPlace) ? "#e0433f" : "#999"} />
                </button>
              </div>

              {selectedPlace.rating && (
                <div className="modal-row">{selectedPlace.rating} · {selectedPlace.reviews} reviews</div>
              )}
              {selectedPlace.address && (
                <div className="modal-row">{selectedPlace.address}</div>
              )}
              {selectedPlace.open_state && (
                <div className="modal-row">{selectedPlace.open_state}</div>
              )}
              {selectedPlace.price && (
                <div className="modal-row">{selectedPlace.price}</div>
              )}
              {selectedPlace.phone && (
                <div className="modal-row">{selectedPlace.phone}</div>
              )}
              {selectedPlace.description && (
                <div className="modal-row">{selectedPlace.description}</div>
              )}
<SafetyRatingWidget place={selectedPlace} />
              <div className="modal-actions">
                
                <a  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPlace.title)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="modal-btn primary"
                  style={{ textDecoration: "none", textAlign: "center" }}
                >
                  Get Directions
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
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/collections"
          element={
            <ProtectedRoute>
              <Collections />
            </ProtectedRoute>
          }
        />
        <Route path="/cities" element={<Cities />} />
        <Route
          path="/journal"
          element={
            <ProtectedRoute>
              <Journal />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hangout"
          element={
            <ProtectedRoute>
              <Hangout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hangout/:code"
          element={
            <ProtectedRoute>
              <Hangout />
            </ProtectedRoute>
          }
        />
<Route path="/insights" element={<Insights />} />

      </Routes>
    </BrowserRouter>
  );
}