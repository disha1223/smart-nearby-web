import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import Navbar from "../components/Navbar";
function getProxiedImage(url) {
  if (!url) return "";
  return `http://localhost:5000/api/places/image-proxy?url=${encodeURIComponent(url)}`;
}
function Collections() {
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState(null);

 useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) {
    setLoading(false);
    return;
  }
  fetch("http://localhost:5000/api/user/favourites", {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then((data) => {
      if (Array.isArray(data.favourites)) {
        setFavourites(data.favourites.filter(Boolean));
      }
    })
    .catch(console.error)
    .finally(() => setLoading(false));
}, []);

const removeFav = async (place) => {
  if (!place) return;
  setFavourites((prev) => prev.filter((p) => p && p.title !== place.title));
  const token = localStorage.getItem("token");
  if (!token) return;
  try {
    await fetch("http://localhost:5000/api/user/favourites", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ place }),
    });
  } catch (err) {
    console.error(err);
  }
};

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <p className="page-eyebrow">Saved</p>
          <h1 className="page-title">Your Collections</h1>
          <p className="page-subtitle">
            Every place you've saved along the way, all in one spot.
          </p>
        </div>

        {loading && (
          <div className="loading">
            <div className="loading-spinner" />
            Loading your saved places...
          </div>
        )}

        {!loading && favourites.length === 0 && (
          <div className="empty">No favourites yet — start exploring!</div>
        )}

        {!loading && favourites.length > 0 && (
          <div className="results-grid">
            {favourites.map((place, i) => (
              <div
                className="place-card"
                key={i}
                onClick={() => setSelectedPlace(place)}
              >
                <div className="place-img-wrap">
                  <img
                    src={getProxiedImage(place.image)}
                    alt={place.title}
                    className="place-img"
                    onError={(e) => {
                      e.target.src = "https://placehold.co/400x200?text=No+Image";
                    }}
                  />
                  <div className="place-img-overlay">
                    <span className="place-name-overlay">{place.title}</span>
                    {place.rating && (
                      <span className="rating-overlay">{place.rating}</span>
                    )}
                  </div>
                </div>
                <div className="place-info">
                  <div className="place-type">{place.type}</div>
                  <div className="place-address">{place.address}</div>
                  <div className="place-meta">
                    {place.reviews && (
                      <span className="reviews">({place.reviews} reviews)</span>
                    )}
                    <button
                      className="fav-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFav(place);
                      }}
                    >
                      <Heart size={18} fill="#e0433f" color="#e0433f" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPlace && (
        <div className="modal-overlay" onClick={() => setSelectedPlace(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {selectedPlace.thumbnail && (
              <img
                src={getProxiedImage(selectedPlace.image)}
                alt={selectedPlace.title}
                className="modal-img"
              />
            )}
            <div className="modal-body">
              <div className="modal-title">{selectedPlace.title}</div>
              <div className="modal-type">{selectedPlace.type}</div>
              {selectedPlace.address && (
                <div className="modal-row">{selectedPlace.address}</div>
              )}
              <div className="modal-actions">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    selectedPlace.title
                  )}`}
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

export default Collections;