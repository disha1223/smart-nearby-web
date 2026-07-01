import { Link } from "react-router-dom";

import "./Navbar.css";

function Navbar() {

  const username =
    localStorage.getItem("username");

  return (

    <nav className="navbar">

      <h1 className="logo">
        Smart Nearby 
      </h1>

      <div className="nav-links">

        {username ? (

          <div className="user-section">

            <span className="username">
  {username}
</span>

            <button
              className="logout-btn"
              onClick={() => {

                localStorage.removeItem("token");

                localStorage.removeItem("username");

                window.location.href = "/";

              }}
            >
              Logout
            </button>

          </div>

        ) : (

          <>

            <Link to="/login">
              Login
            </Link>

            <Link to="/signup">
              Signup
            </Link>

          </>

        )}

      </div>

    </nav>
  );
}

export default Navbar;