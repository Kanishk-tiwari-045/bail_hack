import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Gavel,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../assets/css/timeline.css";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Timeline() {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [cases, setCases] = useState([]);
  const [expandedFeedback, setExpandedFeedback] = useState(null);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const { data, error } = await supabase
        .from("cases")
        .select("id, offenseNature")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCases(data || []);
      
      if (data && data.length > 0) {
        setSelectedCase(data[0].id);
        fetchFeedbacks(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching cases:", error);
    }
  };

  const fetchFeedbacks = async (caseId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("court_feedbacks")
        .select("*")
        .eq("case_id", caseId)
        .order("dateassigned", { ascending: true });

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCaseChange = (caseId) => {
    setSelectedCase(caseId);
    fetchFeedbacks(caseId);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="timeline-page">
      <Navbar/>
      <div className="timeline-container">
        {/* Header */}
        <div className="timeline-header">
          <div className="timeline-header-left">
            <h1>Case Timeline</h1>
          </div>
        </div>

        {/* Case Selector */}
        <div className="timeline-case-selector">
          <select 
            value={selectedCase || ''} 
            onChange={(e) => handleCaseChange(e.target.value)}
            className="timeline-case-select"
          >
            <option value="">Select a case</option>
            {cases.map((caseItem) => (
              <option key={caseItem.id} value={caseItem.id}>
                Case {caseItem.id} - {caseItem.offenseNature || 'Untitled Case'}
              </option>
            ))}
          </select>
        </div>

        {/* Timeline Content */}
        <div className="timeline-content">
          {loading ? (
            <div className="timeline-loading">
              <div className="timeline-loading-spinner"></div>
              <p>Loading timeline...</p>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="timeline-empty">
              <AlertCircle size={48} />
              <p>No hearing dates found for this case</p>
            </div>
          ) : (
            <div className="timeline-events">
              {feedbacks.map((feedback, index) => (
                <div 
                  key={feedback.id} 
                  className={`timeline-event ${
                    index === feedbacks.length - 1 ? 'timeline-event-last' : ''
                  }`}
                >
                  <div className="timeline-event-marker">
                    <div className="timeline-event-dot"></div>
                    {index !== feedbacks.length - 1 && <div className="timeline-event-line"></div>}
                  </div>
                  
                  <div className="timeline-event-content">
                    <div 
                      className="timeline-event-header"
                      onClick={() => setExpandedFeedback(
                        expandedFeedback === feedback.id ? null : feedback.id
                      )}
                    >
                      <div className="timeline-event-date">
                        <Calendar size={16} />
                        <span>{formatDate(feedback.dateassigned)}</span>
                        <Clock size={16} />
                        <span>{formatTime(feedback.dateassigned)}</span>
                      </div>
                      <button className="timeline-event-expand">
                        {expandedFeedback === feedback.id ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                      </button>
                    </div>
                    
                    {expandedFeedback === feedback.id && (
                      <div className="timeline-event-details">
                        <div className="timeline-event-feedback">
                          <h3>Court Feedback</h3>
                          <p>{feedback.feedback}</p>
                        </div>
                        <div className="timeline-event-meta">
                          <span className="timeline-event-created">
                            Created: {formatDate(feedback.created_at)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}