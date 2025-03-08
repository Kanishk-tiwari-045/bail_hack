import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Navbar from "../components/Navbar";
import {
  User,
  Settings,
  Shield,
  Edit, // Using the Edit (pencil) icon from lucide-react
} from "lucide-react";
import "../assets/css/userprofile.css";
import { useNavigate } from "react-router-dom";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const UserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [editedProfile, setEditedProfile] = useState(null);
  const [editFields, setEditFields] = useState({
    email: false,
    specialization: false,
    address: false,
    phone: false,
    barCouncilId: false,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const userEmail = localStorage.getItem("userEmail");

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", userEmail)
        .single();
      if (error) throw error;
      setProfile(data);
      setEditedProfile(data);
    } catch (err) {
      console.error("Error fetching user profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldToggle = (field) => {
    setEditFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleInputChange = (field, value) => {
    setEditedProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from("users")
        .update(editedProfile)
        .eq("email", userEmail);
      if (error) throw error;
      setProfile(editedProfile);
      // Reset all edit toggles
      setEditFields({
        email: false,
        specialization: false,
        address: false,
        phone: false,
        barCouncilId: false,
      });
      alert("Profile saved successfully!");
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Failed to save profile.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (!profile) {
    return <div>No profile data found.</div>;
  }

  const joinedDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      })
    : "N/A";

  // Fallbacks based on the fetched profile and editedProfile
  const userName = editedProfile.full_name || "No Name";
  const userRole = editedProfile.role || "N/A";
  const userSpecialization = editedProfile.specialization || "N/A";
  const userBarCouncilId = editedProfile.bar_council_id || "N/A";
  const userExperience = editedProfile.experience || "N/A";
  const userAddress = editedProfile.address || "N/A";
  const userPhone = editedProfile.phone || "N/A";
  const userCases = editedProfile.cases_handled || 0;

  // Determine if any field is currently being edited
  const isEditing = Object.values(editFields).some((val) => val);

  return (
    <div className="profile-page">
      <Navbar />
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-cover"></div>
          <div className="profile-avatar">
            <User className="avatar-icon" />
          </div>
          <div className="profile-info">
            <h1>{userName}</h1>
            <p className="role">{userRole}</p>
            <div className="profile-stats">
              <div className="stat-item">
                <strong>{userCases}</strong>
                <span>Cases</span>
              </div>
              <div className="stat-item">
                <strong>{userExperience}</strong>
                <span>Experience</span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-content">
          <div className="profile-section">
            <h2>
              <Settings className="section-icon" />
              Personal Information
            </h2>
            <div className="info-grid">
              {/* Email */}
              <div className="info-item">
                <div className="info-text">
                  <label>Email</label>
                  {editFields.email ? (
                    <input
                      type="text"
                      value={editedProfile.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                    />
                  ) : (
                    <p>{editedProfile.email}</p>
                  )}
                </div>
              </div>
              {/* Phone */}
              <div className="info-item">
                <div className="info-text">
                  <label>Phone</label>
                  {editFields.phone ? (
                    <input
                      type="text"
                      value={editedProfile.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                    />
                  ) : (
                    <p>{userPhone}</p>
                  )}
                </div>
                <Edit
                  className="edit-icon"
                  onClick={() => handleFieldToggle("phone")}
                />
              </div>
              {/* Address */}
              <div className="info-item full-width">
                <div className="info-text">
                  <label>Address</label>
                  {editFields.address ? (
                    <input
                      type="text"
                      value={editedProfile.address}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
                    />
                  ) : (
                    <p>{userAddress}</p>
                  )}
                </div>
                <Edit
                  className="edit-icon"
                  onClick={() => handleFieldToggle("address")}
                />
              </div>
            </div>
          </div>
          
          {userRole.toLowerCase() !== "under trial prisoner" && (
          <div className="profile-section">
            <h2>
              <Shield className="section-icon" />
              Professional Details
            </h2>
            <div className="info-grid">
            {/* Specialization */}
            <div className="info-item full-width">
                <div className="info-text">
                  <label>Specialization</label>
                  {editFields.specialization ? (
                    <input
                      type="text"
                      value={editedProfile.specialization}
                      onChange={(e) =>
                        handleInputChange("specialization", e.target.value)
                      }
                    />
                  ) : (
                    <p>{userSpecialization}</p>
                  )}
                </div>
                <Edit
                  className="edit-icon"
                  onClick={() => handleFieldToggle("specialization")}
                />
              </div>
              {/* Member Since */}
              <div className="info-item">
                <div className="info-text">
                  <label>Member Since</label>
                  <p>{joinedDate}</p>
                </div>
              </div>
              {/* Bar Council ID */}
              <div className="info-item">
                <div className="info-text">
                  <label>Bar Council ID</label>
                  {editFields.barCouncilId ? (
                    <input
                      type="text"
                      value={editedProfile.bar_council_id}
                      onChange={(e) =>
                        handleInputChange("bar_council_id", e.target.value)
                      }
                    />
                  ) : (
                    <p>{userBarCouncilId}</p>
                  )}
                </div>
                <Edit
                  className="edit-icon"
                  onClick={() => handleFieldToggle("barCouncilId")}
                />
              </div>
            </div>
          </div>
          )}
          <div className="profile-actions">
            {isEditing && (
              <button className="btn-save" onClick={handleSaveProfile}>
                Save Profile
              </button>
            )}
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;