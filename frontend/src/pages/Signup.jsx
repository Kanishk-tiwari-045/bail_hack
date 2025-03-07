import React, { useState } from "react";
import { useAuthStore } from "../components/auth";
import { KeyRound, Mail, Weight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../assets/css/signup.css";

export default function SignupPage() {
  const [isFlipped, setIsFlipped] = useState(false); // Determines which form to show
  const [isJudge, setIsJudge] = useState(false);       // For official authority signup
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");          // Full name state
  const [password, setPassword] = useState("");
  const [hover, setHover] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);        // Local error message state
  const { signup, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    // Build official info if this is an official authority sign-up
    const officialInfo = {};
    if (isFlipped) {
      officialInfo.isOfficial = true;
      officialInfo.isJudge = isJudge;
    }

    // Call the signup function from our auth store
    const result = await signup(email, password, { full_name: fullName, ...officialInfo });
    if (result.error) {
      setErrorMsg(result.error);
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="signup-container">
      <div className="flip-container">
        <div className={`flip-card ${isFlipped ? "flipped" : ""}`}>
          {/* Front: Normal User Signup */}
          <div className="flip-card-front">
            <div className="signup-box">
              <div className="signup-header">
                <h1>Create Account</h1>
                <p>Sign up to get started</p>
              </div>
              <form onSubmit={handleSubmit} className="signup-form">
                <div className="input-group">
                  <label>Email Address</label>
                  <div className="sign-input-wrapper">
                    <Mail className="input-icon" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label>Full Name</label>
                  <div className="sign-input-wrapper">
                    <Mail className="input-icon" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your Full Name"
                      required
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label>Password</label>
                  <div className="sign-input-wrapper">
                    <KeyRound className="input-icon" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
                {errorMsg && <div className="error-message">{errorMsg}</div>}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="signup-button"
                  style={{ marginTop: "20px" }}
                >
                  {isLoading ? "Signing up..." : "Sign up"}
                </button>
              </form>
              <p style={{ textAlign: "center" }}>Already have an account?</p>
              <button onClick={() => navigate("/login")} className="signup-button">
                Log In
              </button>
              <button
                type="button"
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                style={{
                  backgroundColor: hover ? "#34d399" : "white",
                  color: "#111827",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  marginTop: "20px",
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "bold",
                  margin: "20px auto",
                  transition: "background-color 0.3s ease",
                }}                
                onClick={() => setIsFlipped(true)}
              >
                Official Authority
              </button>
            </div>
          </div>

          {/* Back: Official Authority Signup */}
          <div className="flip-card-back">
            <div className="signup-box">
              <div className="signup-header">
                <h1>Create Official Account</h1>
                <p>Sign up to get started as an official authority</p>
              </div>
              <form onSubmit={handleSubmit} className="signup-form">
                <div className="input-group">
                  <label>Email Address</label>
                  <div className="sign-input-wrapper">
                    <Mail className="input-icon" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label>Full Name</label>
                  <div className="sign-input-wrapper">
                    <Mail className="input-icon" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your Full Name"
                      required
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label>Password</label>
                  <div className="sign-input-wrapper">
                    <KeyRound className="input-icon" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
                <div className="input-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={isJudge}
                      onChange={(e) => setIsJudge(e.target.checked)}
                    />
                    Judge
                  </label>
                </div>
                {errorMsg && <div className="error-message">{errorMsg}</div>}
                <button type="submit" disabled={isLoading} className="signup-button">
                  {isLoading ? "Signing up..." : "Sign up"}
                </button>
              </form>
              <p style={{ textAlign: "center" }}>Already have an account?</p>
              <button onClick={() => navigate("/login")} className="signup-button">
                Log In
              </button>
              <button
                type="button"
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                style={{
                  backgroundColor: hover ? "#34d399" : "white",
                  color: "#111827",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  marginTop: "20px",
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "bold",
                  margin: "20px auto",
                  transition: "background-color 0.3s ease",
                }}     
                onClick={() => setIsFlipped(false)}
              >
                Normal User
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
