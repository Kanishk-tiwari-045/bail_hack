import React from "react";
import { Link } from "react-router-dom";
import { Scale } from "lucide-react";
import "../assets/css/Navbar.css";

const Navbar = () => {
  return (
    <header id="header">
      <div className="container">
        <div className="logo">
        <Link to="/dashboard" className="logo-link">
            <Scale className="logo-icon" />
            <span>Bail Reckoner</span>
          </Link>
        </div>
        <nav className="navbar">
          <ul className="nav-list">
            <li className="nav-item">
              <Link to="/dashboard" className="nav-link">
                Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/case-list" className="nav-link">
                Cases
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/bail" className="nav-link">
                Bail Eligibility
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/profile" className="nav-link">
                Profile
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
