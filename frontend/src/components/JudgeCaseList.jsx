import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { FileText } from "lucide-react";
import Navbar from "./Navbar";
import "../assets/css/judgecaselist.css";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const truncate = (text, limit = 80) => {
  if (!text) return "";
  return text.length > limit ? text.substring(0, limit) + "..." : text;
};

export default function JudgeCaseList() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCase, setExpandedCase] = useState(null);
  const [trialDates, setTrialDates] = useState({});
  const [editingTrialDate, setEditingTrialDate] = useState({});
  const [courtFeedback, setCourtFeedback] = useState({});

  const userEmail = localStorage.getItem("userEmail");

  useEffect(() => {
    fetchCases();
  }, []);

  // Function to handle changes in the feedback textarea
  const handleCourtFeedbackChange = (caseId, value) => {
    setCourtFeedback({ ...courtFeedback, [caseId]: value });
  };

  const submitCourtFeedback = async (caseId) => {
    const newFeedbackEntry = courtFeedback[caseId];
    if (!newFeedbackEntry || newFeedbackEntry.trim() === "") {
      alert("Please enter your feedback.");
      return;
    }
    try {
      // 1. Fetch case info (submitted_by and dateassigned)
      const { data: caseData, error: caseError } = await supabase
        .from("cases")
        .select("submitted_by, legalAid, dateassigned")
        .eq("id", caseId)
        .single();
      if (caseError) throw caseError;

      // 2. Fetch the prisoner's family_email using submitted_by
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("family_email")
        .eq("email", caseData.submitted_by)
        .single();
      if (userError) throw userError;

      const familyEmail = userData.family_email;
      const dateassigned = caseData.dateassigned; // This should be a date string

      // 3. Insert a new feedback record into court_feedbacks table
      const { error: insertError } = await supabase
        .from("court_feedbacks")
        .insert([
          {
            case_id: caseId,
            feedback: newFeedbackEntry,
            created_at: new Date().toISOString(),
            dateassigned: dateassigned,
          },
        ]);
      if (insertError) throw insertError;

      alert("Court feedback submitted successfully!");

      // 4. Call backend endpoint /send-feedback with the family email, caseId, new feedback, and dateassigned.
      const response = await fetch("http://localhost:5000/send-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: familyEmail,
          caseId: caseId,
          feedback: newFeedbackEntry,
          dateassigned: dateassigned,
        }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Feedback email sending failed");
      }
    } catch (error) {
      console.error("Error submitting court feedback:", error);
      alert("Failed to submit feedback.");
    }
  };

  const fetchCases = async () => {
    setLoading(true);
    try {
      // Fetch cases assigned to the current judge and order by severity (ascending order)
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .eq("judgeAssigned", userEmail);
      // Define custom order: petty < minor < moderate < serious
      const severityOrder = {
        petty: 1,
        minor: 2,
        moderate: 3,
        serious: 4,
      };
      // Sort so that the most harming (serious) appears on top
      const sortedData = data.sort(
        (a, b) =>
          severityOrder[b.severity.toLowerCase()] -
          severityOrder[a.severity.toLowerCase()]
      );
      setCases(sortedData);
      if (error) throw error;
      setCases(data || []);
    } catch (error) {
      console.error("Error fetching cases:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCaseExpand = (caseId) => {
    setExpandedCase(expandedCase === caseId ? null : caseId);
  };

  const handleTrialDateChange = (caseId, value) => {
    setTrialDates({ ...trialDates, [caseId]: value });
  };

  const toggleTrialDateInput = (caseId) => {
    setEditingTrialDate({
      ...editingTrialDate,
      [caseId]: !editingTrialDate[caseId],
    });
  };

  const saveTrialDate = async (caseId) => {
    const dateValue = trialDates[caseId];
    if (!dateValue) return alert("Please enter a trial date");
    try {
      // 1. Update the trial date in the cases table.
      const { error } = await supabase
        .from("cases")
        .update({ dateassigned: dateValue })
        .eq("id", caseId);
      if (error) throw error;

      // 2. Fetch case details (submitted_by and legalAid)
      const { data: caseData, error: caseError } = await supabase
        .from("cases")
        .select("submitted_by, legalAid")
        .eq("id", caseId)
        .single();
      if (caseError) throw caseError;

      // 3. Fetch the prisoner's family_email using submitted_by
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("family_email")
        .eq("email", caseData.submitted_by)
        .single();
      if (userError) throw userError;

      const familyEmail = userData.family_email;
      const legalAid = caseData.legalAid || "";
      // Store values in localStorage for later use
      localStorage.setItem("selected_prisoner", familyEmail);
      localStorage.setItem("selected_aid", legalAid);

      // 4. Call the new backend endpoint /send-trialdate
      const response = await fetch("http://localhost:5000/send-trialdate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: familyEmail,
          aidEmail: legalAid,
          trialDate: dateValue,
          caseId: caseId,
        }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Trial date email sending failed");
      }

      alert("Trial date saved and notification sent successfully!");
      setEditingTrialDate({ ...editingTrialDate, [caseId]: false });
      fetchCases(); // Refresh list to see updated info
    } catch (error) {
      console.error("Error saving trial date:", error);
      alert("Failed to save trial date.");
    }
  };

  if (loading) {
    return (
      <div className="judge-loading">
        <p>Loading cases...</p>
      </div>
    );
  }

  return (
    <div className="judge-case-page">
      <Navbar />
      <div className="judge-case-container">
        <div className="judge-case-header">
          <FileText className="header-icon" />
          <h1>Assigned Case List</h1>
        </div>
        <div className="judge-case-list">
          {cases.length === 0 ? (
            <div className="judge-empty-state">
              <p>No cases assigned to you.</p>
            </div>
          ) : (
            cases.map((caseItem) => (
              <div key={caseItem.id} className="judge-case-card">
                <div
                  className="judge-case-card-header"
                  onClick={() => toggleCaseExpand(caseItem.id)}
                >
                  <div className="judge-case-info">
                    <h2>
                      CASE-{caseItem.id}{" "}
                      <span
                        className="judge-trial-status-indicator"
                        style={{
                          backgroundColor: caseItem.dateassigned
                            ? "#34d399"
                            : "#da4320",
                        }}
                      ></span>
                    </h2>
                    <div className="judge-case-meta">
                      <div className="judge-case-detail">
                        <span className="judge-case-key">Severity:</span>
                        <span className="judge-case-value">
                          {caseItem.severity}
                        </span>
                      </div>
                      <div className="judge-case-detail">
                        <span className="judge-case-key">Offense:</span>
                        <span className="judge-case-value">
                          {caseItem.offenseNature}
                        </span>
                      </div>
                      <div className="judge-case-detail">
                        <span className="judge-case-key">Age:</span>
                        <span className="judge-case-value">{caseItem.age}</span>
                      </div>
                      <div className="judge-case-detail">
                        <span className="judge-case-key">Gender:</span>
                        <span className="judge-case-value">
                          {caseItem.gender}
                        </span>
                      </div>
                      <div className="judge-case-detail">
                        <span className="judge-case-key">Socioeconomic:</span>
                        <span className="judge-case-value">
                          {caseItem.socioeconomicBackground}
                        </span>
                      </div>
                      <div className="judge-case-detail">
                        <span className="judge-case-key">Employment:</span>
                        <span className="judge-case-value">
                          {caseItem.employmentStatus}
                        </span>
                      </div>
                      <div className="judge-case-detail">
                        <span className="judge-case-key">
                          Criminal History:
                        </span>
                        <span className="judge-case-value">
                          {caseItem.criminalHistory}
                        </span>
                      </div>
                      <div className="judge-case-detail">
                        <span className="judge-case-key">Victim Impact:</span>
                        <span className="judge-case-value">
                          {caseItem.victimImpact}
                        </span>
                      </div>
                      <div className="judge-case-detail">
                        <span className="judge-case-key">Public Interest:</span>
                        <span className="judge-case-value">
                          {caseItem.publicInterest}
                        </span>
                      </div>
                      <div className="judge-case-detail">
                        <span className="judge-case-key">Custody Time:</span>
                        <span className="judge-case-value">
                          {caseItem.custodyTime}
                        </span>
                      </div>
                      <div className="judge-case-detail">
                        <span className="judge-case-key">Adjournments:</span>
                        <span className="judge-case-value">
                          {caseItem.adjournments}
                        </span>
                      </div>
                      <div className="judge-case-detail">
                        <span className="judge-case-key">Bail Amount:</span>
                        <span className="judge-case-value">
                          {caseItem.bailAmount}
                        </span>
                      </div>
                      <div className="judge-case-detail">
                        <span className="judge-case-key">Bail Conditions:</span>
                        <span className="judge-case-value">
                          {caseItem.bailConditions}
                        </span>
                      </div>
                      <div className="judge-case-detail">
                        <span className="judge-case-key">
                          Legal Aid Provider:
                        </span>
                        <span className="judge-case-value">
                          {caseItem.legalAid}
                        </span>
                      </div>
                      <div className="judge-case-detail">
                        <span className="judge-case-key">Description:</span>
                        <span className="judge-case-value">
                          {caseItem.caseDescription
                            ? truncate(caseItem.caseDescription, 300)
                            : "No description available"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {caseItem.id && (
                  <div className="judge-case-documents">
                    <div className="judge-trial-date-section">
                      {editingTrialDate[caseItem.id] ? (
                        <>
                          <input
                            type="date"
                            value={
                              trialDates[caseItem.id] ||
                              caseItem.dateassigned ||
                              ""
                            }
                            onChange={(e) =>
                              handleTrialDateChange(caseItem.id, e.target.value)
                            }
                            className="judge-trial-date-input"
                          />
                          <button
                            className="judge-save-date-button"
                            onClick={() => saveTrialDate(caseItem.id)}
                          >
                            Save Date
                          </button>
                        </>
                      ) : (
                        <button
                          className="judge-input-date-button"
                          onClick={() => toggleTrialDateInput(caseItem.id)}
                        >
                          {caseItem.dateassigned
                            ? "Change Trial Date"
                            : "Input Trial Date"}
                        </button>
                      )}
                    </div>
                    <div className="judge-feedback-section">
                      <textarea
                        placeholder="Enter court feedback here..."
                        value={courtFeedback[caseItem.id] || ""}
                        onChange={(e) =>
                          handleCourtFeedbackChange(caseItem.id, e.target.value)
                        }
                        className="judge-feedback-input"
                      />
                      <button
                        className="judge-submit-feedback-button"
                        onClick={() => submitCourtFeedback(caseItem.id)}
                      >
                        Submit Court Reasoning
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
