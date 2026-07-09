import { Link, useLocation } from "react-router-dom";
import { Compass, Heart, User } from "lucide-react";
import "./Navbar.css";

function Navbar() {
  const username = localStorage.getItem("username");
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.location.href = "/";
  };

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
        </div>

        

         
        
      </div>
    </nav>
  );
}

export default Navbar;