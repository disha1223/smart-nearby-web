import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { TrendingUp, MapPin } from "lucide-react";

const CATEGORY_STYLES = {
  opportunity: { bg: "#fef3c7", color: "#92400e", label: "Opportunity" },
  "well-served": { bg: "#d1fae5", color: "#065f46", label: "Well served" },
  "low-data": { bg: "#f3f4f6", color: "#4b5563", label: "Not enough data" },
};

export default function Insights() {
  const [insights, setInsights] = useState([]);
  const [totalSearchesLogged, setTotalSearchesLogged] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/insights")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setInsights(data.insights || []);
        setTotalSearchesLogged(data.totalSearchesLogged || 0);
        setMessage(data.message || "");
      })
      .catch((err) => setError(err.message || "Failed to load insights"))
      .finally(() => setLoading(false));
  }, []);

  const maxDemand = Math.max(1, ...insights.map((i) => i.demandCount));

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <p className="page-eyebrow">Local Intelligence</p>
          <h1 className="page-title">Demand & Supply Insights</h1>
          <p className="page-subtitle">
            Aggregated, anonymized search patterns — where demand for a mood outpaces the places actually available.
          </p>
        </div>

        {loading && (
          <div className="loading">
            <div className="loading-spinner" />
            Crunching search data...
          </div>
        )}

        {error && <div className="error">{error}</div>}

        {!loading && !error && insights.length === 0 && (
          <div className="empty">
            {message || "No data yet — search around for a while and check back here."}
          </div>
        )}

        {!loading && insights.length > 0 && (
          <>
            <p style={{ marginBottom: 24, opacity: 0.7, fontSize: 14 }}>
              Based on {totalSearchesLogged} logged {totalSearchesLogged === 1 ? "search" : "searches"}.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {insights.map((item, i) => {
                const style = CATEGORY_STYLES[item.category] || CATEGORY_STYLES["low-data"];
                const demandBarWidth = (item.demandCount / maxDemand) * 100;
                return (
                  <div
                    key={i}
                    className="place-card"
                    style={{ padding: 20, cursor: "default" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 17, textTransform: "capitalize" }}>
                          {item.mood}
                        </div>
                        <div style={{ fontSize: 13, opacity: 0.6, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                          <MapPin size={13} />
                          near {item.lat.toFixed(2)}°, {item.lon.toFixed(2)}°
                        </div>
                      </div>
                      <span
                        style={{
                          background: style.bg,
                          color: style.color,
                          padding: "4px 12px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {style.label}
                      </span>
                    </div>

                    <p style={{ marginTop: 12, marginBottom: 14, fontSize: 14 }}>{item.insightText}</p>

                    <div style={{ display: "flex", gap: 24, fontSize: 13 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, opacity: 0.7 }}>
                          <span>
                            <TrendingUp size={12} style={{ verticalAlign: "-1px", marginRight: 4 }} />
                            Demand
                          </span>
                          <span>{item.demandCount} searches</span>
                        </div>
                        <div style={{ background: "#e5e7eb", borderRadius: 999, height: 8, overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${demandBarWidth}%`,
                              background: "#7c3aed",
                              height: "100%",
                            }}
                          />
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, opacity: 0.7 }}>
                          <span>Avg. supply</span>
                          <span>~{item.avgSupply} places</span>
                        </div>
                        <div style={{ background: "#e5e7eb", borderRadius: 999, height: 8, overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${Math.min(100, (item.avgSupply / 10) * 100)}%`,
                              background: "#10b981",
                              height: "100%",
                            }}
                          />
                        </div>
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