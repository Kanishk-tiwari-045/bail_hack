import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { FileText, Send } from "lucide-react"; 
import "../assets/css/casepage.css";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with credentials from .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CasePage = () => {
  const [activeSection, setActiveSection] = useState(1);
  const [formData, setFormData] = useState({
    caseDescription: "",
    age: "",
    gender: "",
    socioeconomic: "",
    employment: "",
    offenseNature: "",
    severity: "",
    criminalHistory: "",
    victimImpact: "",
    publicInterest: "",
    custodyTime: "",
    adjournments: "",
    bailAmount: "",
    bailConditions: "",
    judgeAssigned: ""
  });

  const nextSection = () => {
    setActiveSection((prev) => Math.min(prev + 1, 3));
  };

  const prevSection = () => {
    setActiveSection((prev) => Math.max(prev - 1, 1));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Get the email from localStorage
    const email = localStorage.getItem('userEmail');

    // Check if email exists
    if (!email) {
      console.error("User email not found in localStorage.");
      return;
    }

    // Check if all fields are filled
    const allFieldsFilled = Object.values(formData).every((field) => field !== "");
    if (!allFieldsFilled) {
      alert("Please fill all fields before submitting.");
      return;
    }

    // Submit to Supabase
    try {
      const { data, error } = await supabase.from("cases").insert([
        {
          caseDescription: formData.caseDescription,
          age: formData.age,
          gender: formData.gender,
          socioeconomicBackground: formData.socioeconomic,
          employmentStatus: formData.employment,
          offenseNature: formData.offenseNature,
          severity: formData.severity,
          criminalHistory: formData.criminalHistory,
          victimImpact: formData.victimImpact,
          publicInterest: formData.publicInterest,
          custodyTime: formData.custodyTime,
          adjournments: formData.adjournments,
          bailAmount: formData.bailAmount,
          bailConditions: formData.bailConditions,
          submitted_by: email, // Add the email to the submission data
          judgeAssigned: formData.judgeAssigned
        },
      ], { returning: "minimal" });

      if (error) {
        alert("Error submitting case: " + error.message);
      } else {
        alert("Case submitted successfully!");

        // Optionally reset the form after successful submission
        setFormData({
          caseDescription: "",
          age: "",
          gender: "",
          socioeconomic: "",
          employment: "",
          offenseNature: "",
          severity: "",
          criminalHistory: "",
          victimImpact: "",
          publicInterest: "",
          custodyTime: "",
          adjournments: "",
          bailAmount: "",
          bailConditions: "",
          judgeAssigned: ""
        });

        setActiveSection(1); // Reset to the first section after submission
      }
    } catch (error) {
      alert("Error submitting case: " + error.message);
    }
  };

  const isFormValid = Object.values(formData).every((field) => field !== "");
  return (
    <div className="case-page">
      <Navbar />
      <div className="case-container">
        <div className="form-header">
          <FileText className="form-icon" />
          <h1>Case Details Submission</h1>
          <p style={{ color: "white" }}>Please provide correct information</p>
        </div>

        <div className={`progress-bar progress-step-${activeSection}`}>
          <div className={`progress-step ${activeSection >= 1 ? 'active' : ''}`}>
            <span>1</span>
            <p>Case Description</p>
          </div>
          <div className={`progress-step ${activeSection >= 2 ? 'active' : ''}`}>
            <span>2</span>
            <p>Personal Details</p>
          </div>
          <div className={`progress-step ${activeSection >= 3 ? 'active' : ''}`}>
            <span>3</span>
            <p>Legal Information</p>
          </div>
        </div>

        <form className="case-form" onSubmit={handleSubmit}>
          <div className={`form-section ${activeSection === 1 ? 'active' : ''}`}>
            <h2>Case Description</h2>
            <div className="form-group">
              <textarea
                id="caseDescription"
                rows={6}
                name="caseDescription"
                value={formData.caseDescription}
                onChange={handleChange}
                placeholder="Please provide a detailed description of your case..."
                style={{ fontWeight: 550, fontSize: 15, color: "rgb(75, 77, 77)" }}
              ></textarea>
            </div>
          </div>

          <div className={`form-section ${activeSection === 2 ? 'active' : ''}`}>
            <h2>Defendant Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="age">Age</label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  min="18"
                  max="100"
                  style={{ fontWeight: 550, fontSize: 15, color: "rgb(75, 77, 77)" }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select
                  style={{ fontWeight: 550, fontSize: 14.5, color: "rgb(75, 77, 77)" }}
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="socioeconomic">Socioeconomic Background</label>
                <select
                  style={{ fontWeight: 550, fontSize: 14.5, color: "rgb(75, 77, 77)" }}
                  id="socioeconomic"
                  name="socioeconomic"
                  value={formData.socioeconomic}
                  onChange={handleChange}
                >
                  <option value="">Select background</option>
                  <option value="low">Low Income</option>
                  <option value="middle">Middle Income</option>
                  <option value="high">High Income</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="employment">Employment Status</label>
                <select
                  style={{ fontWeight: 550, fontSize: 14.5, color: "rgb(75, 77, 77)" }}
                  id="employment"
                  name="employment"
                  value={formData.employment}
                  onChange={handleChange}
                >
                  <option value="">Select status</option>
                  <option value="employed">Employed</option>
                  <option value="unemployed">Unemployed</option>
                  <option value="self-employed">Self-employed</option>
                  <option value="student">Student</option>
                </select>
              </div>
            </div>
          </div>

          <div className={`form-section ${activeSection === 3 ? 'active' : ''}`}>
            <h2>Legal Proceedings Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="offenseNature">Nature of Offense</label>
                <select
                  style={{ fontWeight: 550, fontSize: 14.5, color: "rgb(75, 77, 77)" }}
                  id="offenseNature"
                  name="offenseNature"
                  value={formData.offenseNature}
                  onChange={handleChange}
                >
                  <option value="">Select type</option>
                  <option value="bailable">Bailable</option>
                  <option value="non-bailable">Non-bailable</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="severity">Offense Severity</label>
                <select
                  style={{ fontWeight: 550, fontSize: 14.5, color: "rgb(75, 77, 77)" }}
                  id="severity"
                  name="severity"
                  value={formData.severity}
                  onChange={handleChange}
                >
                  <option value="">Select severity</option>
                  <option value="petty">Petty</option>
                  <option value="minor">Minor</option>
                  <option value="moderate">Moderate</option>
                  <option value="serious">Serious</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="criminalHistory">Criminal History</label>
                <select
                  style={{ fontWeight: 550, fontSize: 14.5, color: "rgb(75, 77, 77)" }}
                  id="criminalHistory"
                  name="criminalHistory"
                  value={formData.criminalHistory}
                  onChange={handleChange}
                >
                  <option value="">Select history</option>
                  <option value="first-time">First-time Offender</option>
                  <option value="repeat">Repeat Offender</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="victimImpact">Victim Impact</label>
                <textarea
                  id="victimImpact"
                  name="victimImpact"
                  value={formData.victimImpact}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe the impact on the victim..."
                  style={{ fontWeight: 550, fontSize: 14.5, color: "rgb(75, 77, 77)" }}
                ></textarea>
              </div>
              <div className="form-group">
                <label htmlFor="publicInterest">Public Interest Considerations</label>
                <textarea
                  id="publicInterest"
                  name="publicInterest"
                  value={formData.publicInterest}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe any public interest considerations..."
                  style={{ fontWeight: 550, fontSize: 14.5, color: "rgb(75, 77, 77)" }}
                ></textarea>
              </div>
              <div className="form-group">
                <label htmlFor="bailConditions">Bail Conditions</label>
                <textarea
                  id="bailConditions"
                  name="bailConditions"
                  value={formData.bailConditions}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Enter bail conditions..."
                  style={{ fontWeight: 550, fontSize: 15, color: "rgb(75, 77, 77)" }}
                ></textarea>
              </div>
              <div className="form-group">
                <label htmlFor="custodyTime">Custody Time</label>
                <input
                  type="text"
                  id="custodyTime"
                  name="custodyTime"
                  value={formData.custodyTime}
                  onChange={handleChange}
                  placeholder="Enter custody time..."
                  style={{ fontWeight: 550, fontSize: 15, color: "rgb(75, 77, 77)" }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="adjournments">Adjournments</label>
                <input
                  type="text"
                  id="adjournments"
                  name="adjournments"
                  value={formData.adjournments}
                  onChange={handleChange}
                  placeholder="Enter adjournments..."
                  style={{ fontWeight: 550, fontSize: 15, color: "rgb(75, 77, 77)" }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="bailAmount">Bail Amount</label>
                <input
                  type="text"
                  id="bailAmount"
                  name="bailAmount"
                  value={formData.bailAmount}
                  onChange={handleChange}
                  placeholder="Enter bail amount..."
                  style={{ fontWeight: 550, fontSize: 15, color: "rgb(75, 77, 77)" }}
                />
              </div>
              <div className="form-group">
                <label htmlFor="judgeAssigned">Judge Assigned</label>
                <input
                  type="text"
                  id="judgeAssigned"
                  name="judgeAssigned"
                  value={formData.judgeAssigned}
                  onChange={handleChange}
                  placeholder="Name of the Judge..."
                  style={{ fontWeight: 550, fontSize: 15, color: "rgb(75, 77, 77)" }}
                />
              </div>
            </div>
          </div>

          <div className="form-navigation">
          {activeSection > 1 && (
            <button
              type="button"
              className="btn-secondary"
              onClick={prevSection}
              disabled={activeSection === 1}
            >
              Prev
            </button>
          )}
            {activeSection < 3 && (
            <button
              type="button"
              className="btn-primary"
              onClick={nextSection}
              disabled={activeSection === 3}
            >
              Next
            </button>
          )}
            <button
              type="submit"
              className="btn-primary"
              disabled={!isFormValid}
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CasePage;
