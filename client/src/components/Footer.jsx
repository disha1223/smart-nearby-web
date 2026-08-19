import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import "./Footer.css";

function Footer() {
  return (
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
  );
}

export default Footer;