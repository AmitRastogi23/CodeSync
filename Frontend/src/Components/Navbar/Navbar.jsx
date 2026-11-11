import "./Navbar.css";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setShowDropdown(false);
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <a href="/" className="navbar-logo">
          <svg
            className="logo-icon"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 8L4 16L10 24"
              stroke="#0A0A0B"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M22 8L28 16L22 24"
              stroke="#0A0A0B"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M18 6L14 26"
              stroke="#0A0A0B"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          <span className="logo-text">
            Code<span className="logo-accent">Sync</span>
          </span>
        </a>

        <ul className="navbar-links">
          <li>
            <NavLink to="/features">Features</NavLink>
          </li>
          <li>
            <NavLink to="/howitworks">How It Works</NavLink>
          </li>
        </ul>

        <div className="navbar-actions">
          {user ? (
            <div className="profile-container">
              <button
                className="profile-circle"
                onClick={() => setShowDropdown(!showDropdown)}
                title={user.name}
              >
                {user?.photo && user.photo.length > 5 ? (
                  <img
                    src={user.photo.replace(/'/g, "")}
                    alt={user.name}
                    className="profile-img"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.parentElement.innerText = user.name
                        .charAt(0)
                        .toUpperCase();
                    }}
                  />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </button>

              {showDropdown && (
                <div className="profile-dropdown">
                  <div className="dropdown-header">
                    <p className="dropdown-name">{user.name}</p>
                    <p className="dropdown-email">{user.email}</p>
                  </div>
                  <hr className="dropdown-divider" />

                  <div className="dropdown-links">
                    <NavLink
                      to="/settings/profile"
                      className="dropdown-link"
                      onClick={() => setShowDropdown(false)}
                    >
                      Profile Settings
                    </NavLink>
                    <NavLink
                      to="/settings/security"
                      className="dropdown-link"
                      onClick={() => setShowDropdown(false)}
                    >
                      Security Settings
                    </NavLink>
                    <NavLink
                      to="/settings/questions"
                      className="dropdown-link"
                      onClick={() => setShowDropdown(false)}
                    >
                      My Questions
                    </NavLink>
                    <NavLink
                      to="/settings/sessions"
                      className="dropdown-link"
                      onClick={() => setShowDropdown(false)}
                    >
                      Session History
                    </NavLink>
                  </div>

                  <hr className="dropdown-divider" />
                  <button className="dropdown-logout" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <NavLink to={"/login"} className="navbar-btn">
              Get Started
              <span className="btn-arrow">→</span>
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
