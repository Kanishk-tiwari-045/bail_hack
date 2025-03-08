import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Scale } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import "../assets/css/Navbar.css";

// Initialize Supabase client with VITE_ environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const Navbar = () => {
  const [role, setRole] = useState("");

  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");

    const fetchUserRole = async () => {
      const { data: userData, error } = await supabase
        .from("users")
        .select("role")
        .eq("email", userEmail)
        .single();

      if (!error && userData) {
        setRole(userData.role);
      }
    };

    if (userEmail) {
      fetchUserRole();
    }
  }, []);

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

            {role === "under trial prisoner" && (
              <>
                <li className="nav-item">
                  <Link to="/bail" className="nav-link">
                    Bail Eligibility
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/case-list" className="nav-link">
                    Cases
                  </Link>
                </li>
              </>
            )}
            {role === "legal aid provider" && <></>}

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
