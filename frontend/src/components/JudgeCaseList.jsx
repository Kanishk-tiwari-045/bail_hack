import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { FileText, X, User, Gavel } from "lucide-react";
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
  const [similarCases, setSimilarCases] = useState(null);
  const [showSimilarCasesModal, setShowSimilarCasesModal] = useState(false);
  // New state for bail analysis
  const [bailAnalysis, setBailAnalysis] = useState(null);
  const [showBailModal, setShowBailModal] = useState(false);
  const [fetchingBail, setFetchingBail] = useState({});
  // Existing states
  const [fetchingSimilar, setFetchingSimilar] = useState({});
  const [submittingFeedback, setSubmittingFeedback] = useState({});
  const [savingTrialDate, setSavingTrialDate] = useState({});

  const userEmail = localStorage.getItem("userEmail");

  useEffect(() => {
    fetchCases();
  }, []);

  const handleCourtFeedbackChange = (caseId, value) => {
    setCourtFeedback({ ...courtFeedback, [caseId]: value });
  };

  const submitCourtFeedback = async (caseId) => {
    const newFeedbackEntry = courtFeedback[caseId];
    if (!newFeedbackEntry || newFeedbackEntry.trim() === "") {
      alert("Please enter your feedback.");
      return;
    }
    setSubmittingFeedback({ ...submittingFeedback, [caseId]: true });
    try {
      const { data: caseData, error: caseError } = await supabase
        .from("cases")
        .select("submitted_by, legalAid, dateassigned")
        .eq("id", caseId)
        .single();
      if (caseError) throw caseError;

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("family_email")
        .eq("email", caseData.submitted_by)
        .single();
      if (userError) throw userError;

      const familyEmail = userData.family_email;
      const dateassigned = caseData.dateassigned;

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
    } finally {
      setSubmittingFeedback({ ...submittingFeedback, [caseId]: false });
    }
  };

  const handleFetchSimilarCases = async (caseId) => {
    const caseItem = cases.find((c) => c.id === caseId);
    if (!caseItem) return;
    const caseDescription = caseItem.caseDescription;
    if (!caseDescription) {
      alert("No case description available for fetching similar cases.");
      return;
    }
    setFetchingSimilar({ ...fetchingSimilar, [caseId]: true });
    try {
      const response = await fetch("http://localhost:5000/find-similar-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseDetails: caseDescription }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to fetch similar cases");
      }
      const similarCasesResponse = await response.json();
      console.log("Similar cases fetched:", similarCasesResponse);
      setSimilarCases(similarCasesResponse);
      setShowSimilarCasesModal(true);
    } catch (error) {
      console.error("Error fetching similar cases:", error);
      alert("Failed to fetch similar cases.");
    } finally {
      setFetchingSimilar({ ...fetchingSimilar, [caseId]: false });
    }
  };

  // New bail analysis handler
  const handleBailAnalysis = async (caseId) => {
    const caseItem = cases.find((c) => c.id === caseId);
    if (!caseItem) return;
    setFetchingBail({ ...fetchingBail, [caseId]: true });
    try {
      const response = await fetch("http://localhost:5000/analyze-bail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseDescription: caseItem.caseDescription,
          sections: [caseItem.offenseNature], // Assuming offenseNature as section
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to analyze bail");
      }
      const bailData = await response.json();
      setBailAnalysis(bailData);
      setShowBailModal(true);
    } catch (error) {
      console.error("Error analyzing bail:", error);
      alert("Failed to analyze bail status");
    } finally {
      setFetchingBail({ ...fetchingBail, [caseId]: false });
    }
  };

  const renderSimilarCasesModal = () => {
    if (!showSimilarCasesModal || !similarCases) return null;
    return (
      <div
        className="similar-cases-modal-backdrop"
        onClick={() => setShowSimilarCasesModal(false)}
      >
        <div
          className="similar-cases-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="similar-cases-modal-header">
            <h3>Similar Cases</h3>
            <button
              className="similar-cases-modal-close"
              onClick={() => setShowSimilarCasesModal(false)}
              aria-label="Close similar cases modal"
            >
              <X size={20} />
            </button>
          </div>
          <table className="similar-cases-table">
            <thead>
              <tr>
                <th>Case Number</th>
                <th>Judge</th>
                <th>Petitioner</th>
                <th>Statement</th>
                <th>Sections</th>
                <th>Judgement</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(similarCases) ? (
                similarCases.map((caseItem, index) => (
                  <tr key={index}>
                    <td>{caseItem.caseNumber || "N/A"}</td>
                    <td>{caseItem.caseJudge || "N/A"}</td>
                    <td>{caseItem.casePetitioner || "N/A"}</td>
                    <td>
                      {truncate(caseItem.caseStatement || "No statement", 100)}
                    </td>
                    <td>{truncate(caseItem.caseSections || "N/A", 50)}</td>
                    <td>
                      {truncate(caseItem.caseJudgement || "No judgement", 100)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No structured data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // New bail analysis modal
  const renderBailAnalysisModal = () => {
    if (!showBailModal || !bailAnalysis) return null;
    return (
      <div
        className="similar-cases-modal-backdrop"
        onClick={() => setShowBailModal(false)}
      >
        <div
          className="similar-cases-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="similar-cases-modal-header">
            <h3>Bail Analysis</h3>
            <button
              className="similar-cases-modal-close"
              onClick={() => setShowBailModal(false)}
            >
              <X size={20} />
            </button>
          </div>
          <div className="bail-analysis-content">
            <p>
              <strong>Bail Decision:</strong>{" "}
              {bailAnalysis.conclusion.bailDecision}
            </p>
            <p>
              <strong>Reasoning:</strong> {bailAnalysis.conclusion.reasoning}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const fetchCases = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .eq("judgeAssigned", userEmail);
      const severityOrder = {
        petty: 1,
        minor: 2,
        moderate: 3,
        serious: 4,
      };
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
    setSavingTrialDate({ ...savingTrialDate, [caseId]: true });
    try {
      const { error } = await supabase
        .from("cases")
        .update({ dateassigned: dateValue })
        .eq("id", caseId);
      if (error) throw error;

      const { data: caseData, error: caseError } = await supabase
        .from("cases")
        .select("submitted_by, legalAid")
        .eq("id", caseId)
        .single();
      if (caseError) throw caseError;

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("family_email")
        .eq("email", caseData.submitted_by)
        .single();
      if (userError) throw userError;

      const familyEmail = userData.family_email;
      const legalAid = caseData.legalAid || "";
      localStorage.setItem("selected_prisoner", familyEmail);
      localStorage.setItem("selected_aid", legalAid);

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
      fetchCases();
    } catch (error) {
      console.error("Error saving trial date:", error);
      alert("Failed to save trial date.");
    } finally {
      setSavingTrialDate({ ...savingTrialDate, [caseId]: false });
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
                            : "#f59e0b",
                        }}
                        title={
                          caseItem.dateassigned
                            ? "Trial Date Set"
                            : "No Trial Date"
                        }
                      ></span>
                    </h2>
                    <div className="judge-case-meta">
                      <div className="judge-case-section judge-personal-details">
                        <h3>
                          <User size={16} /> Personal Details
                        </h3>
                        <div className="judge-case-detail">
                          <span className="judge-case-key">Age:</span>
                          <span className="judge-case-value">
                            {caseItem.age}
                          </span>
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
                      </div>
                      <div className="judge-case-section judge-case-details">
                        <h3>
                          <Gavel size={16} /> Case Details
                        </h3>
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
                          <span className="judge-case-key">Victim Impact:</span>
                          <span className="judge-case-value">
                            {caseItem.victimImpact}
                          </span>
                        </div>
                        <div className="judge-case-detail">
                          <span className="judge-case-key">
                            Public Interest:
                          </span>
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
                          <span className="judge-case-key">
                            Bail Conditions:
                          </span>
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
                      </div>
                      <div className="judge-case-detail judge-case-description">
                        <span className="judge-case-key">Description:</span>
                        <span className="judge-case-value">
                          {caseItem.caseDescription
                            ? truncate(caseItem.caseDescription, 300)
                            : "No description available"}
                        </span>
                        <button
                          className="judge-fetch-similar-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFetchSimilarCases(caseItem.id);
                          }}
                          disabled={fetchingSimilar[caseItem.id]}
                          aria-label={`Fetch similar cases for CASE-${caseItem.id}`}
                        >
                          {fetchingSimilar[caseItem.id]
                            ? "Fetching..."
                            : "Fetch Similar Cases"}
                        </button>
                        {/* New bail analysis button */}
                        <button
                          className="judge-analyze-bail-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBailAnalysis(caseItem.id);
                          }}
                          disabled={fetchingBail[caseItem.id]}
                          aria-label={`Analyze bail for CASE-${caseItem.id}`}
                        >
                          {fetchingBail[caseItem.id]
                            ? "Analyzing..."
                            : "Analyze Bail"}
                        </button>
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
                            disabled={savingTrialDate[caseItem.id]}
                          >
                            {savingTrialDate[caseItem.id]
                              ? "Saving..."
                              : "Save Date"}
                          </button>
                        </>
                      ) : (
                        <>
                          {caseItem.dateassigned && (
                            <p className="judge-trial-date-display">
                              Trial Date: {caseItem.dateassigned}
                            </p>
                          )}
                          <button
                            className="judge-input-date-button"
                            onClick={() => toggleTrialDateInput(caseItem.id)}
                          >
                            {caseItem.dateassigned
                              ? "Change Trial Date"
                              : "Input Trial Date"}
                          </button>
                        </>
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
                        maxLength={500}
                      />
                      <small>
                        {(courtFeedback[caseItem.id] || "").length}/500
                      </small>
                      <button
                        className="judge-submit-feedback-button"
                        onClick={() => submitCourtFeedback(caseItem.id)}
                        disabled={submittingFeedback[caseItem.id]}
                      >
                        {submittingFeedback[caseItem.id]
                          ? "Submitting..."
                          : "Submit Court Reasoning"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      {renderSimilarCasesModal()}
      {renderBailAnalysisModal()}
    </div>
  );
}
