import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

function Journal() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placeName, setPlaceName] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetch("http://localhost:5000/api/user/journal", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setEntries(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const addEntry = async () => {
    if (!placeName.trim() || !note.trim()) return;
    setSubmitting(true);
    const entry = {
      place: placeName,
      note,
      date: new Date().toISOString(),
    };
    try {
      const res = await fetch("http://localhost:5000/api/user/journal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(entry),
      });
      const saved = await res.json();
      setEntries((prev) => [saved, ...prev]);
      setPlaceName("");
      setNote("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteEntry = async (id) => {
    setEntries((prev) => prev.filter((e) => e._id !== id));
    try {
      await fetch(`http://localhost:5000/api/user/journal/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
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
          <p className="page-eyebrow">Reflect</p>
          <h1 className="page-title">Your Journal</h1>
          <p className="page-subtitle">
            Write down what a place meant to you — a memory for later.
          </p>
        </div>

        <div className="journal-form">
          <input
            type="text"
            placeholder="Place name..."
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
          />
          <textarea
            rows={3}
            placeholder="What made this place worth remembering?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="journal-form-actions">
            <button
              className="discover-btn"
              onClick={addEntry}
              disabled={submitting || !placeName.trim() || !note.trim()}
            >
              {submitting ? "Saving..." : "Add Entry"}
            </button>
          </div>
        </div>

        {loading && (
          <div className="loading">
            <div className="loading-spinner" />
            Loading your journal...
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="empty">No entries yet — write your first memory!</div>
        )}

        {!loading && entries.length > 0 && (
          <div className="journal-list">
            {entries.map((entry) => (
              <div className="journal-entry" key={entry._id || entry.date}>
                <div className="journal-entry-header">
                  <span className="journal-entry-place">{entry.place}</span>
                  <span className="journal-entry-date">
                    {new Date(entry.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="journal-entry-text">{entry.note}</p>
                <button
                  className="journal-entry-delete"
                  onClick={() => deleteEntry(entry._id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Journal;