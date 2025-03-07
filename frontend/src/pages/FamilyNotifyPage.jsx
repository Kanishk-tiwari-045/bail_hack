import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Navbar from "../components/Navbar";
import { ArrowLeft, Mail, AlertCircle, Check, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../assets/css/familynotifypage.css";  // Merged CSS file

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function FamilyNotificationPage() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null); // User record from "users"
  const [loadingUser, setLoadingUser] = useState(true);
  const [familyEmail, setFamilyEmail] = useState("");
  const [emailCollected, setEmailCollected] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  const userEmail = localStorage.getItem("userEmail");

  useEffect(() => {
    fetchUser();
  }, []);

  // Fetch user data from the "users" table
  const fetchUser = async () => {
    setLoadingUser(true);
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", userEmail)
      .single();
    if (error) {
      console.error("Error fetching user:", error);
    } else {
      setUserData(data);
      if (data.family_email) {
        const emailClean = data.family_email.trim();
        setFamilyEmail(emailClean);
        setEmailCollected(true);
        // Debug: log the family email
        console.log("Family email from user record:", emailClean);
        fetchNotifications(emailClean);
      }
    }
    setLoadingUser(false);
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Update family_email in the users table
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailError("");
    if (!validateEmail(familyEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setLoadingNotifs(true);
    
    const { error } = await supabase
      .from("users")
      .update({ family_email: familyEmail })
      .eq("email", userEmail);
    
    setLoadingNotifs(false);
    if (error) {
      console.error("Error saving family email:", error);
      setEmailError("Failed to save email. Please try again.");
      return;
    }
    setEmailCollected(true);
    setSuccessMessage("Email saved successfully!");
    setTimeout(() => setSuccessMessage(""), 3000);
    fetchNotifications(familyEmail);
  };

  // Fetch notifications sent to the collected family email
  const fetchNotifications = async (emailForNotif) => {
    setLoadingNotifs(true);
    const { data, error } = await supabase
      .from("family_notifications")
      .select("*")
      .eq("family_email", emailForNotif)
      .order("created_at", { ascending: false });
    setLoadingNotifs(false);
    if (error) {
      console.error("Error fetching notifications:", error);
      return;
    }
    // Debug: log notifications fetched
    console.log("Fetched notifications:", data);
    setNotifications(data || []);
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  if (loadingUser) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="family-notification-page">
      <Navbar />
      <div className="notification-page-container">
        {/* Header */}
        <div className="notification-page-header">
          <div className="header-left">
            <ArrowLeft className="back-arrow" onClick={handleBack} />
            <h1>Family Notifications</h1>
          </div>
        </div>

        {/* Email Collection Form */}
        {!emailCollected ? (
          <div className="email-collection-section">
            <p className="section-description">
              Please provide a valid family email
            </p>
            <form onSubmit={handleEmailSubmit} className="email-form">
              <div className="familyinput-group">
                <input
                  type="email"
                  id="familyEmail"
                  value={familyEmail}
                  onChange={(e) => setFamilyEmail(e.target.value)}
                  placeholder="Enter family email address"
                  required
                />
                {emailError && (
                  <div className="error-message">
                    <AlertCircle size={16} />
                    <span>{emailError}</span>
                  </div>
                )}
              </div>
              <button type="submit" className="submit-button" disabled={loadingNotifs}>
                {loadingNotifs ? "Saving..." : "Save Email"}
              </button>
            </form>
            {successMessage && (
              <div className="success-message">
                <Check size={16} />
                <span>{successMessage}</span>
              </div>
            )}
          </div>
        ) : (
          // Notification Section: Show family email and history of notifications
          <div className="notification-section">
            <div className="email-display">
              <span className="label">Family Email:</span>
              <span className="email">{familyEmail}</span>
              <button className="change-email-btn" onClick={() => setEmailCollected(false)}>
                Change
              </button>
            </div>
            <div className="notification-history-header">
              <h3>Notification History</h3>
            </div>

            {showHistory && (
              <div className="notification-history">
                {loadingNotifs ? (
                  <div className="loading-state">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                  <div className="empty-state">
                    <AlertCircle size={24} />
                    <p>No notifications have been sent yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div key={notification.id} className="notification-card">
                      <div className="notification-card-header">
                        <h4>{notification.title}</h4>
                        <span className="notification-date">
                          {new Date(notification.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {notification.description && (
                        <p className="notification-description">{notification.description}</p>
                      )}
                      <div className="notification-footer">
                        <span className="notification-status">
                          <Check size={14} />
                          Sent to {notification.family_email}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
