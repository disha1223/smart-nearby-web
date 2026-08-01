import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Phone, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "../components/Navbar";
import SafetyRatingWidget from "../components/SafetyRatingWidget";
import "./PlaceDetail.css";

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function getProxiedImage(url) {
  if (!url) return "";
  return `http://localhost:5000/api/places/image-proxy?url=${encodeURIComponent(url)}`;
}

function todayName() {
  return DAY_ORDER[(new Date().getDay() + 6) % 7];
}

function PhotoGallery({ place }) {
  const [photos, setPhotos] = useState(place.thumbnail ? [place.thumbnail] : []);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!place.dataId) return;
    let cancelled = false;
    setLoading(true);

    fetch(`http://localhost:5000/api/places/photos?dataId=${encodeURIComponent(place.dataId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.photos && data.photos.length > 0) {
          setPhotos([...new Set(data.photos)]);
        }
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [place.dataId]);

  if (photos.length === 0) return null;

  return (
    <div className="place-detail-gallery-wrap">
      <div className="place-detail-hero">
        <img src={getProxiedImage(photos[active])} alt={place.title} />
        <div className="place-detail-hero-fade" />

        {loading && <span className="gallery-loading-pill">Loading more photos…</span>}

        {photos.length > 1 && (
          <>
            <button
              className="gallery-nav gallery-nav-prev"
              onClick={() => setActive((i) => (i === 0 ? photos.length - 1 : i - 1))}
            >
              <ChevronLeft size={22} />
            </button>
            <button
              className="gallery-nav gallery-nav-next"
              onClick={() => setActive((i) => (i === photos.length - 1 ? 0 : i + 1))}
            >
              <ChevronRight size={22} />
            </button>
            <span className="gallery-counter">{active + 1} / {photos.length}</span>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div className="gallery-thumb-strip">
          {photos.map((url, i) => (
            <button
              key={i}
              className={`gallery-thumb ${i === active ? "active" : ""}`}
              onClick={() => setActive(i)}
            >
              <img src={getProxiedImage(url)} alt={`${place.title} photo ${i + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PlaceDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const place = location.state?.place;

  if (!place) {
    return (
      <div>
        <Navbar />
        <div className="place-detail-empty">
          <p>No place selected.</p>
          <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const today = todayName();
  const hasHours = place.hours && Object.keys(place.hours).length > 0;

  return (
    <div>
      <Navbar />
      <div className="place-detail-page">
        <PhotoGallery place={place} />

        <div className="place-detail-body">
          <div className="place-detail-header">
            <div>
              <h1>{place.title}</h1>
              {place.type && <span className="place-detail-type-pill">{place.type}</span>}
            </div>
            <button className="place-detail-heart-btn">
              <Heart size={24} />
            </button>
          </div>

          <div className="place-detail-meta">
            {place.rating && <span className="meta-rating">★ {place.rating} · {place.reviews} reviews</span>}
            {place.open_state && (
              <span className={`open-badge ${place.open_state.toLowerCase().includes("open") ? "open" : "closed"}`}>
                {place.open_state}
              </span>
            )}
            {place.price_level && <span className="price-badge">{place.price_level}</span>}
          </div>

          {place.address && (
            <div className="place-detail-row">
              <MapPin size={16} /> {place.address}
            </div>
          )}
          {place.phone && (
            <div className="place-detail-row">
              <Phone size={16} /> {place.phone}
            </div>
          )}

          <div className="place-detail-hours">
            <h3>Weekly Hours</h3>
            {hasHours ? (
              <table>
                <tbody>
                  {DAY_ORDER.map((day) => (
                    <tr key={day} className={day === today ? "today" : ""}>
                      <td>{day.charAt(0).toUpperCase() + day.slice(1)}</td>
                      <td>{place.hours[day] || "Closed"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="place-detail-no-hours">Hours not available for this place.</p>
            )}
          </div>

          <SafetyRatingWidget place={place} />

          <div className="place-detail-btn-row">
            <button className="place-detail-back" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} /> Back
            </button>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.title)}`}
              target="_blank"
              rel="noreferrer"
              className="place-detail-directions-btn"
            >
              Get Directions
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}