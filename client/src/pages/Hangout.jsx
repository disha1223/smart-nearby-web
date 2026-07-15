import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Heart, X, Users, Copy } from "lucide-react";
import Navbar from "../components/Navbar";

function getProxiedImage(url) {
  if (!url) return "";
  return `http://localhost:5000/api/places/image-proxy?url=${encodeURIComponent(url)}`;
}

export default function Hangout() {
  const { code } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const myUsername = localStorage.getItem("username");

  const [session, setSession] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchSession = useCallback(async () => {
    if (!code) return;
    try {
      const res = await fetch(`http://localhost:5000/api/hangout/${code}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSession(data);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load session");
    } finally {
      setLoading(false);
    }
  }, [code, token]);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    fetch(`http://localhost:5000/api/hangout/${code}/join`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message && !data.members) throw new Error(data.message);
        setSession(data);
        setError("");
      })
      .catch((err) => setError(err.message || "Failed to join session"))
      .finally(() => setLoading(false));
  }, [code, token]);

  useEffect(() => {
    if (!code) return;
    const interval = setInterval(fetchSession, 4000);
    return () => clearInterval(interval);
  }, [code, fetchSession]);

  const castVote = async (candidateIndex, vote) => {
    try {
      const res = await fetch(`http://localhost:5000/api/hangout/${code}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ candidateIndex, vote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSession(data);
    } catch (err) {
      setError(err.message || "Failed to record vote");
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!code) {
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="page-header">
            <p className="page-eyebrow">Together</p>
            <h1 className="page-title">Join a hangout</h1>
            <p className="page-subtitle">Enter the code a friend shared with you.</p>
          </div>
          <div className="search-bar-wrap-main" style={{ maxWidth: 420 }}>
            <input
              type="text"
              placeholder="e.g. K3F9QZ"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              style={{ textTransform: "uppercase", letterSpacing: "2px" }}
            />
            <button
              className="discover-btn"
              onClick={() => joinCodeInput.trim() && navigate(`/hangout/${joinCodeInput.trim()}`)}
            >
              Join
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !session) {
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="loading">
            <div className="loading-spinner" />
            Loading hangout session...
          </div>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div>
        <Navbar />
        <div className="container">
          <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const myId = session.members.find((m) => m.username === myUsername)?.userId;

  const myVoteFor = (candidate) => {
    const v = candidate.votes.find((v) => v.userId === myId || v.userId?._id === myId);
    return v?.vote || null;
  };

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <p className="page-eyebrow">Together</p>
          <h1 className="page-title">Plan a hangout</h1>
          <p className="page-subtitle">
            <Users size={16} style={{ verticalAlign: "-2px", marginRight: 4 }} />
            {session.members.length} {session.members.length === 1 ? "person" : "people"} in this session
          </p>
        </div>

        <button
          className="discover-btn"
          onClick={copyCode}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 24 }}
        >
          <Copy size={16} /> {copied ? "Copied!" : `Code: ${session.code}`}
        </button>

        {session.status === "decided" && session.winner ? (
          <div style={{ textAlign: "center" }}>
            <p className="page-eyebrow">🎉 The group has decided</p>
            <div className="place-card" style={{ maxWidth: 400, margin: "20px auto" }}>
              <div className="place-img-wrap">
                <img
                  src={getProxiedImage(session.winner.thumbnail)}
                  alt={session.winner.title}
                  className="place-img"
                  onError={(e) => { e.target.src = "https://placehold.co/400x200?text=No+Image"; }}
                />
                <div className="place-img-overlay">
                  <span className="place-name-overlay">{session.winner.title}</span>
                  {session.winner.rating > 0 && <span className="rating-overlay">{session.winner.rating}</span>}
                </div>
              </div>
              <div className="place-info">
                <div className="place-type">{session.winner.type}</div>
                <div className="place-address">{session.winner.address}</div>
              </div>
            </div>
            
             <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(session.winner.title)}`}
              target="_blank"
              rel="noreferrer"
              className="modal-btn primary"
              style={{ textDecoration: "none", display: "inline-block" }}
            >
              Get Directions
            </a>
          </div>
        ) : (
          <>
            <p style={{ marginBottom: 20, opacity: 0.8 }}>
              Vote yes or no on each place. Once everyone in the group has voted on everything, we'll reveal the pick.
            </p>
            {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}
            <div className="results-grid">
              {session.candidates.map((candidate, i) => {
                const myVote = myVoteFor(candidate);
                return (
                  <div className="place-card" key={i}>
                    <div className="place-img-wrap">
                      <img
                        src={getProxiedImage(candidate.thumbnail)}
                        alt={candidate.title}
                        className="place-img"
                        onError={(e) => { e.target.src = "https://placehold.co/400x200?text=No+Image"; }}
                      />
                      <div className="place-img-overlay">
                        <span className="place-name-overlay">{candidate.title}</span>
                        {candidate.rating > 0 && <span className="rating-overlay">{candidate.rating}</span>}
                      </div>
                    </div>
                    <div className="place-info">
                      <div className="place-type">{candidate.type}</div>
                      <div className="place-address">{candidate.address}</div>
                      <div className="place-meta" style={{ justifyContent: "center", gap: 12, marginTop: 10 }}>
                        <button
                          onClick={() => castVote(i, "no")}
                          style={{
                            background: myVote === "no" ? "#fee2e2" : "#f3f4f6",
                            border: "none",
                            borderRadius: "50%",
                            width: 44,
                            height: 44,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                        >
                          <X size={20} color="#dc2626" />
                        </button>
                        <button
                          onClick={() => castVote(i, "yes")}
                          style={{
                            background: myVote === "yes" ? "#dcfce7" : "#f3f4f6",
                            border: "none",
                            borderRadius: "50%",
                            width: 44,
                            height: 44,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                        >
                          <Heart size={20} color="#16a34a" fill={myVote === "yes" ? "#16a34a" : "none"} />
                        </button>
                      </div>
                      <div style={{ textAlign: "center", fontSize: 12, opacity: 0.6, marginTop: 8 }}>
                        {candidate.votes.length}/{session.members.length} voted
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}