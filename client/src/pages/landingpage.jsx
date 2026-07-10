import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapPin, Search, SlidersHorizontal, Star, ArrowRight, UtensilsCrossed, Coffee, Compass } from "lucide-react";
import Navbar from "../components/Navbar";
import "./landingpage.css";

const FLOATING_PLACES = [
  { name: "Ando Omakase", meta: "0.9 mi · Sushi", top: "6%", left: "4%", icon: "sushi" },
  { name: "Fern & Fig", meta: "0.6 mi · Brunch", bottom: "8%", right: "4%", icon: "brunch" },
];

const PIN_POSITIONS = [
  { top: "16%", left: "24%", delay: "0s" }, { top: "24%", left: "50%", delay: "0.15s" },
  { top: "12%", left: "64%", delay: "0.3s" }, { top: "34%", left: "14%", delay: "0.45s" },
  { top: "40%", left: "40%", delay: "0.6s" }, { top: "28%", left: "72%", delay: "0.2s" },
  { top: "52%", left: "28%", delay: "0.5s" }, { top: "48%", left: "58%", delay: "0.35s" },
  { top: "62%", left: "46%", delay: "0.1s" }, { top: "68%", left: "20%", delay: "0.55s" },
  { top: "72%", left: "64%", delay: "0.4s" }, { top: "80%", left: "38%", delay: "0.25s" },
];

const BUILDINGS = [
  { top: "10%", left: "10%", w: 34, h: 22, r: -8 },  { top: "8%", left: "40%", w: 46, h: 30, r: 4 },
  { top: "20%", left: "58%", w: 30, h: 44, r: -3 },   { top: "38%", left: "20%", w: 40, h: 26, r: 6 },
  { top: "30%", left: "78%", w: 28, h: 36, r: -6 },   { top: "50%", left: "42%", w: 52, h: 28, r: 2 },
  { top: "58%", left: "10%", w: 30, h: 40, r: -4 },   { top: "62%", left: "68%", w: 38, h: 24, r: 5 },
  { top: "74%", left: "30%", w: 44, h: 30, r: -2 },   { top: "78%", left: "56%", w: 26, h: 38, r: 7 },
  { top: "18%", left: "26%", w: 24, h: 18, r: 3 },    { top: "44%", left: "64%", w: 32, h: 22, r: -5 },
];

const GUIDES = [
  {
    title: "Best cafés to study",
    desc: "Quiet corners, strong Wi-Fi, endless refills.",
    count: "18 places",
    img: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80",
  },
  {
    title: "Late-night food",
    desc: "For the 1 AM cravings — kitchens still open.",
    count: "24 places",
    img: "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=800&q=80",
  },
  {
    title: "Hidden gems",
    desc: "Loved by locals, missed by everyone else.",
    count: "12 places",
    img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80",
  },
  {
    title: "Weekend brunch",
    desc: "Slow mornings, sunshine, and a good coffee.",
    count: "16 places",
    img: "https://images.unsplash.com/photo-1496412705862-e0088f16f791?w=800&q=80",
  },
];

function LandingPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleDiscover = () => {
    if (query.trim()) {
      navigate(`/dashboard?q=${encodeURIComponent(query.trim())}`);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="landing2">
      <Navbar />

      <section className="landing2-hero">
        <div className="hero-copy">
          <div className="live-badge">
            <span className="live-dot" />
            287 places open near you right now
          </div>

          <h1 className="hero-heading">
            Find places that
            <br />
            match your <em>mood</em>.
          </h1>

          <p className="hero-sub">
            A calmer way to discover restaurants, cafes and small corners of
            the city — curated by mood, distance and taste. No endless
            scrolling.
          </p>

          <div className="hero-search">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Ramen, rooftop bar, quiet cafe..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleDiscover()}
            />
            <span className="search-or"></span>
            
            <button className="discover-btn" onClick={handleDiscover}>
              Discover <ArrowRight size={16} />
            </button>
          </div>

          <div className="hero-stats">
            <div>
              <strong>12k+</strong>
              <span>curated spots</span>
            </div>
            <div className="stat-divider" />
            <div>
              <strong>4.8</strong>
              <span>avg. rating</span>
            </div>
            <div className="stat-divider" />
            <div>
              <strong>87</strong>
              <span>neighborhoods</span>
            </div>
          </div>
        </div>

        <div className="hero-map">
          <div className="map-canvas">
            <div className="map-glow map-glow-1" />
            <div className="map-glow map-glow-2" />

            {BUILDINGS.map((b, i) => (
              <div
                key={i}
                className="map-building"
                style={{
                  top: b.top,
                  left: b.left,
                  width: `${b.w}px`,
                  height: `${b.h}px`,
                  transform: `rotate(${b.r}deg)`,
                }}
              />
            ))}

            {PIN_POSITIONS.map((pos, i) => (
              <div key={i} className="map-pin-wrap" style={{ top: pos.top, left: pos.left, animationDelay: pos.delay }}>
                <span className="map-pin-pulse" />
                <MapPin size={22} className="map-pin" />
              </div>
            ))}
          </div>

          {FLOATING_PLACES.map((p) => (
            <div className="place-float-card" key={p.name} style={p}>
              <div className="place-float-thumb">
                {p.icon === "sushi" ? <UtensilsCrossed size={18} /> : <Coffee size={18} />}
              </div>
              <div>
                <p className="place-float-name">{p.name}</p>
                <p className="place-float-meta">
                  <Star size={12} fill="currentColor" /> {p.meta}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="landing2-guides">
        <h2 className="guides-heading">Editorial guides, hand-picked by locals</h2>
        <div className="guides-grid">
          {GUIDES.map((g) => (
            <div
              key={g.title}
              className="guide-card"
              style={{ backgroundImage: `url(${g.img})` }}
              onClick={() => navigate("/dashboard")}
            >
              <span className="guide-arrow"><ArrowRight size={16} /></span>
              <div className="guide-card-overlay">
                <span className="guide-count">{g.count}</span>
                <h3 className="guide-title">{g.title}</h3>
                <p className="guide-desc">{g.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="landing2-cta">
        <h2>Ready to find your next favourite spot?</h2>
        <p>Sign up free and start exploring places that match how you feel.</p>
        <Link to="/signup" className="cta-btn">
          Get started <ArrowRight size={16} />
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="landing2-footer">
        <div className="footer-grid">
          <div className="footer-col footer-brand-col">
            <div className="footer-brand">
              <span className="footer-logo-badge"><Compass size={16} /></span>
              <span className="footer-logo-text">Moodly</span>
            </div>
            <p className="footer-tagline">Made for the moments in between.</p>
            <p className="footer-copyright">© {new Date().getFullYear()} Moodly. All rights reserved.</p>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <Link to="/">About Us</Link>
            <Link to="/">How it Works</Link>
            <Link to="/">Team</Link>
          </div>

          <div className="footer-col">
            <h4>Explore</h4>
            <Link to="/dashboard">Discover</Link>
            <Link to="/collections">Collections</Link>
            <Link to="/cities">Cities</Link>
            <Link to="/journal">Journal</Link>
          </div>

          <div className="footer-col">
            <h4>Legal</h4>
            <Link to="/">Help & FAQ</Link>
            <Link to="/">Contact Us</Link>
            <Link to="/">Report an Issue</Link>
          </div>

          <div className="footer-col">
            <h4>Social Links</h4>
            <div className="footer-socials">
              <button aria-label="Instagram">Instagram</button>
              <button aria-label="Twitter">Twitter</button>
              <button aria-label="LinkedIn">LinkedIn</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;