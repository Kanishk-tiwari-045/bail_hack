import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Navbar from "../components/Navbar";
import { CircleDot } from 'lucide-react';
import { FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import '../assets/css/caselist.css';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const CaseList = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const userEmail = localStorage.getItem('userEmail');

  // Initialize navigate
  const navigate = useNavigate();

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('submitted_by', userEmail);
      if (error) throw error;
  
      // Define custom order: petty < minor < moderate < serious
      const severityOrder = {
        "petty": 1,
        "minor": 2,
        "moderate": 3,
        "serious": 4
      };
      // Sort so that the most harming (serious) appears on top
      const sortedData = data.sort((a, b) => 
        severityOrder[b.severity.toLowerCase()] - severityOrder[a.severity.toLowerCase()]
      );
      setCases(sortedData);
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getCaseStatus = (caseItem) => {
    const legalAidValue = caseItem.legalAid ? caseItem.legalAid.trim() : '';
    if (!legalAidValue) {
      return { color: 'red', status: 'Not Requested', showButton: true };
    }
    // Check if the legalAid field indicates it's under review
    if (legalAidValue.toLowerCase().startsWith("under review")) {
      const parts = legalAidValue.split(":");
      const provider = parts[1] ? parts[1].trim() : "";
      return { color: 'yellow', status: provider ? `Under Review by: ${provider}` : "Under Review", showButton: false };
    }
    // Otherwise, assume it's accepted (provider email is stored)
    return { color: 'green', status: `Accepted by: ${legalAidValue}`, showButton: false };
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to truncate long descriptions
  const truncate = (text, limit = 80) => {
    if (!text) return '';
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  };

  if (loading) {
    return <div className="loading">Loading cases...</div>;
  }

  // New handler to store the case id and navigate to legalAidList page
  const handleFindAid = (caseId) => {
    localStorage.setItem('selectedCaseId', caseId);
    navigate('/legalAidList');
  };

  return (
    <div className="caselist-outer">
      <Navbar />
      <div className="case-list">
        <div className="list-header">
          <FileText className="header-icon" />
          <h1>Current Cases</h1>
        </div>
        {cases.map((caseItem) => {
          const { color, status, showButton } = getCaseStatus(caseItem);
          return (
            <div key={caseItem.id} className="case-card">
              <div className="case-header">
                <div className="case-title">
                  <CircleDot className={`status-dot ${color}`} />
                  <h2>CASE-{caseItem.id}</h2>
                </div>
                <span className="case-date">{formatDate(caseItem.created_at)}</span>
              </div>
              <div className="case-content">
                <div className="case-details">
                  <p><strong>Age:</strong> {caseItem.age}</p>
                  <p><strong>Offense:</strong> {caseItem.offenseNature}</p>
                  <p><strong>Severity:</strong> {caseItem.severity}</p>
                  <p><strong>Custody Time:</strong> {caseItem.custodyTime}</p>
                  <p><strong>Bail Amount:</strong> {caseItem.bailAmount}</p>
                </div>
                <p>
                  <strong>Case Description: </strong>
                  {truncate(caseItem.caseDescription, 150)}
                </p>
                <div className="case-status">
                  {showButton ? (
                    <button
                      className={`find-aid-btn ${color === 'yellow' ? 'under-review' : ''}`}
                      onClick={() => handleFindAid(caseItem.id)}
                    >
                      Find Legal Aid
                    </button>
                  ) : (
                    <p className={`status-text ${color}`}>{status}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CaseList;
