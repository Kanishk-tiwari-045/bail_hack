import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Gavel,
  Clock,
  Search
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../assets/css/legalreport.css";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function LegalReport() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [documents, setDocuments] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedCase, setExpandedCase] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const judgeEmail = localStorage.getItem("userEmail");
    if (!judgeEmail) {
      navigate("/login");
      return;
    }
    fetchAssignedCases(judgeEmail);
  }, [navigate]);

  const fetchAssignedCases = async (judgeEmail) => {
    try {
      // Fetch cases assigned to the judge
      const { data: casesData, error: casesError } = await supabase
        .from("cases")
        .select("*")
        .eq("judgeAssigned", judgeEmail)
        .order("created_at", { ascending: false });

      if (casesError) throw casesError;

      setCases(casesData || []);

      // Fetch documents for all cases
      if (casesData && casesData.length > 0) {
        const caseIds = casesData.map(c => c.id);
        const { data: docsData, error: docsError } = await supabase
          .from("doc_manage")
          .select("*")
          .in("case_id", caseIds);

        if (docsError) throw docsError;

        // Organize documents by case_id
        const docsMap = {};
        docsData?.forEach(doc => {
          if (!docsMap[doc.case_id]) {
            docsMap[doc.case_id] = [];
          }
          // Extract filename from file_path
          const fileName = doc.file_path.split('/').pop();
          docsMap[doc.case_id].push({
            ...doc,
            fileName: fileName
          });
        });
        setDocuments(docsMap);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCaseExpand = (caseId) => {
    setExpandedCase(expandedCase === caseId ? null : caseId);
  };

  const truncate = (text, limit = 300) => {
    if (!text) return '';
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Filter cases based on search query
  const filteredCases = cases.filter(caseItem =>
    caseItem.severity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    caseItem.offenseNature?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    caseItem.caseDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(caseItem.id).includes(searchQuery)
  );

  return (
    <div className="legal-report-page">
      <Navbar />
      <div className="legal-report-container">
        <div className="legal-report-header">
          <div className="header-content">
            <h1>
              <Gavel className="header-icon" />
              Legal Case Reports
            </h1>
            <div className="rep-search-container">
              <Search className="rep-search-icon" />
              <input
                type="text"
                placeholder="Search cases by ID, severity, or offense..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rep-search-input"
              />
            </div>
          </div>
        </div>

        <div className="cases-container">
          {loading ? (
            <div className="loading-state">
              <Clock className="loading-icon" />
              <p>Loading assigned cases...</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="empty-state">
              <Gavel size={48} />
              <p>No cases found</p>
              {searchQuery && <p className="rep-search-note">Try a different search term</p>}
            </div>
          ) : (
            filteredCases.map((caseItem) => (
              <div key={caseItem.id} className="rep-case-card">
                <div 
                  className="case-header"
                  onClick={() => toggleCaseExpand(caseItem.id)}
                >
                  <div className="case-info">
                    <div className="case-title">
                      <h2>Case {caseItem.id}</h2>
                    </div>
                    <div className="case-meta">
                      <div className="meta-item">
                        <strong>Offense:</strong> {caseItem.offenseNature}
                      </div>
                      <div className="meta-item">
                        <strong>Severity:</strong> {caseItem.severity}
                      </div>
                      <div className="meta-item">
                        <strong>Filed:</strong> {formatDate(caseItem.created_at)}
                      </div>
                      <div className="meta-item">
                        <strong>Status:</strong> {caseItem.status || 'Pending'}
                      </div>
                    </div>
                    <p className="case-description">
                      {truncate(caseItem.caseDescription)}
                    </p>
                  </div>
                  <div className="expand-icon">
                    {expandedCase === caseItem.id ? (
                      <ChevronUp size={24} />
                    ) : (
                      <ChevronDown size={24} />
                    )}
                  </div>
                </div>

                {expandedCase === caseItem.id && (
                  <div className="case-documents">
                    <h3>Case Documents</h3>
                    <div className="documents-grid">
                      {documents[caseItem.id]?.length > 0 ? (
                        documents[caseItem.id].map((doc, index) => (
                          <div key={index} className="document-card">
                            <div className="document-icon">
                              <FileText size={24} />
                            </div>
                            <div className="document-info">
                              <span className="document-name">{doc.fileName}</span>
                              <span className="document-date">
                                {formatDate(doc.created_at)}
                              </span>
                            </div>
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="view-button"
                            >
                              View
                            </a>
                          </div>
                        ))
                      ) : (
                        <div className="no-documents">
                          <p>No documents uploaded for this case</p>
                        </div>
                      )}
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