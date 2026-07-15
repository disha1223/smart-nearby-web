import React, { useState, useEffect } from "react";
import { Shield } from "lucide-react";

const TIME_LABELS = { day: " Day", evening: " Evening", night: " Night" };

export default function SafetyRatingWidget({ place }) {
  const [aggregate, setAggregate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTime, setSelectedTime] = useState("night");
  const [myRating, setMyRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!place?.title || !place?.address) return;
    setLoading(true);
    setJustSaved(false);

    const params = new URLSearchParams({ title: place.title, address: place.address });

    fetch(`http://localhost:5000/api/safety?${params}`)
      .then((res) => res.json())
      .then(setAggregate)
      .catch(console.error)
      .finally(() => setLoading(false));

    if (token) {
      fetch(`http://localhost:5000/api/safety/mine?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          const existing = data.ratings?.find((r) => r.timeOfDay === selectedTime);
          setMyRating(existing?.rating || 0);
        })
        .catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place?.title, place?.address]);

  useEffect(() => {
    if (!token || !place?.title || !place?.address) return;
    const params = new URLSearchParams({ title: place.title, address: place.address });
    fetch(`http://localhost:5000/api/safety/mine?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const existing = data.ratings?.find((r) => r.timeOfDay === selectedTime);
        setMyRating(existing?.rating || 0);
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTime]);

  const submitRating = async (stars) => {
    if (!token) return;
    setMyRating(stars);
    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:5000/api/safety/rate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          placeTitle: place.title,
          placeAddress: place.address,
          rating: stars,
          timeOfDay: selectedTime,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setJustSaved(true);
      const params = new URLSearchParams({ title: place.title, address: place.address });
      const aggRes = await fetch(`http://localhost:5000/api/safety?${params}`);
      setAggregate(await aggRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginTop: 12, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, marginBottom: 10 }}>
        <Shield size={16} color="#7c3aed" />
        Safety Ratings
      </div>

      {loading ? (
        <div style={{ fontSize: 13, opacity: 0.6 }}>Loading...</div>
      ) : aggregate?.totalRatings > 0 ? (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          {["day", "evening", "night"].map((tod) =>
            aggregate.byTimeOfDay[tod] ? (
              <div
                key={tod}
                style={{
                  background: "#f3f4f6",
                  borderRadius: 8,
                  padding: "6px 10px",
                  fontSize: 13,
                }}
              >
                {TIME_LABELS[tod]}: <strong>{aggregate.byTimeOfDay[tod].avg}/5</strong>{" "}
                <span style={{ opacity: 0.6 }}>({aggregate.byTimeOfDay[tod].count})</span>
              </div>
            ) : null
          )}
        </div>
      ) : (
        <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 14 }}>
          No safety ratings yet — be the first to help others.
        </div>
      )}

      {token ? (
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            {["day", "evening", "night"].map((tod) => (
              <button
                key={tod}
                onClick={() => setSelectedTime(tod)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: "none",
                  fontSize: 12,
                  cursor: "pointer",
                  background: selectedTime === tod ? "#7c3aed" : "#f3f4f6",
                  color: selectedTime === tod ? "#fff" : "#374151",
                }}
              >
                {TIME_LABELS[tod]}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
            How safe did this feel at {TIME_LABELS[selectedTime].toLowerCase()}?
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                disabled={submitting}
                onClick={() => submitRating(star)}
                style={{
                  fontSize: 22,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: star <= myRating ? "#7c3aed" : "#d1d5db",
                }}
              >
                ★
              </button>
            ))}
          </div>
          {justSaved && <div style={{ fontSize: 12, color: "#16a34a", marginTop: 4 }}>Thanks — saved!</div>}
        </div>
      ) : (
        <div style={{ fontSize: 12, opacity: 0.6 }}>Log in to add your own rating.</div>
      )}
    </div>
  );
}