import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Compass } from "lucide-react";
import "./Navbar.css";

function Navbar() {
  const username = localStorage.getItem("username");
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.location.href = "/";
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        <span className="logo-badge"><Compass size={18} /></span>
        Moodly
      </Link>

      <div className="nav-right-group">
        <div className="nav-links">
          <Link to="/dashboard" className={location.pathname === "/dashboard" ? "active" : ""}>Discover</Link>
          <Link to="/collections" className={location.pathname === "/collections" ? "active" : ""}>Collections</Link>
          <Link to="/cities" className={location.pathname === "/cities" ? "active" : ""}>Cities</Link>
          <Link to="/journal" className={location.pathname === "/journal" ? "active" : ""}>Journal</Link>
        <Link to="/insights" className={location.pathname === "/insights" ? "active" : ""}>Insights</Link>
        </div>

        {username ? (
          <div className="nav-account-wrapper" ref={menuRef}>
            <button className="nav-account-btn" onClick={() => setOpen(!open)}>
              <span>{username}</span>
            </button>
            {open && (
              <div className="nav-account-dropdown">
                <button onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="nav-account-btn">
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;