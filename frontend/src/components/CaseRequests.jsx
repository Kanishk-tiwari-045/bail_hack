import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Navbar from '../components/Navbar';
import { FileText, UserCheck } from 'lucide-react';
import '../assets/css/requestList.css';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const RequestsList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  // Current legal aid provider's email from local storage
  const providerEmail = localStorage.getItem('userEmail');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("requests")
        .select("*, cases:case_id(*)")
        .eq("provider_email", providerEmail)
        .order("created_at", { ascending: false });
  
      if (error) throw error;
  
      // Sort the requests: Accepted first (sorted by severity descending),
      // then Pending, then Declined.
      const sortedRequests = data.sort((a, b) => {
        const statusOrder = { Accepted: 2, Pending: 1, Declined: 3 };
        const orderA = statusOrder[a.status] || 4;
        const orderB = statusOrder[b.status] || 4;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        // If both are accepted, sort by severity descending (higher severity first)
        if (a.status === "Accepted" && b.status === "Accepted") {
          return Number(b.cases?.severity) - Number(a.cases?.severity);
        }
        return 0;
      });
  
      setRequests(sortedRequests);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };  
  
  const handleAcceptRequest = async (requestId, caseId, requestedBy) => {
    try {
      // 1. Update the case: set legalAid to "accepted: <providerEmail>"
      const { error: updateCaseError } = await supabase
        .from('cases')
        .update({ legalAid: `accepted: ${providerEmail}` })
        .eq('id', caseId);
      if (updateCaseError) throw updateCaseError;
  
      // 2. Update the request status to "Accepted"
      const { error: updateRequestError } = await supabase
        .from('requests')
        .update({ status: 'Accepted' })
        .eq('id', requestId);
      if (updateRequestError) throw updateRequestError;
  
      // 3. Fetch the family email (and optional user info) from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('family_email, full_name')
        .eq('email', requestedBy)
        .single();
      if (userError) throw userError;
  
      const familyEmail = userData.family_email;
      if (!familyEmail) {
        alert("No family email found for the prisoner");
        return;
      }
  
      // 4. Insert a record in family_notifications
      //    Adjust column names to match your table schema
      const title = `Case Accepted by: ${providerEmail}`;
      const description = `Your case (ID: ${caseId}) has been accepted for review.`;
      const { error: notifError } = await supabase
        .from('family_notifications')
        .insert([
          {
            prisoner_name: userData.full_name || requestedBy, 
            family_email: familyEmail,
            title: title,
            description: description,
          }
        ]);
      if (notifError) throw notifError;
  
      // 5. Trigger email notification via backend endpoint
      const response = await fetch("http://localhost:5000/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toEmail: familyEmail,
          caseId: caseId,
          providerEmail: providerEmail,
        }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Email sending failed");
      }
  
      alert('Case Accepted! Notification sent to the Client.');
      fetchRequests(); // Refresh the list
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Failed to accept request.');
    }
  };
  
  
  const handleDeclineRequest = async (requestId, caseId) => {
    try {
      // Update the case: set legalAid to NULL so a new request can be sent
      const { error: updateCaseError } = await supabase
        .from('cases')
        .update({ legalAid: null })
        .eq('id', caseId);
      if (updateCaseError) throw updateCaseError;
  
      // Update the request status to "Declined"
      const { error } = await supabase
        .from('requests')
        .update({ status: 'Declined' })
        .eq('id', requestId);
      if (error) throw error;
      alert('Case Declined.');
      fetchRequests(); 
    } catch (error) {
      console.error('Error declining request:', error);
      alert('Failed to decline request.');
    }
  };
  
  if (loading) {
    return <div className="loading">Loading requests...</div>;
  }

  return (
    <div className="requestList-outer">
      <Navbar />
      <div className="requests-list">
        <div className="requestlist-header">
          <FileText className="header-icon" />
          <h1>Received Requests</h1>
        </div>

        {requests.length === 0 ? (
          <p className="no-requests">No requests available.</p>
        ) : (
          requests.map((request) => {
            // 'caseData' is the related object from 'cases:case_id(*)'
            const caseData = request.cases;

            return (
              <div key={request.id} className="request-card">
                <div className="request-info">
                <div className="request-title">
                  <UserCheck className="request-icon" />
                  <h2>CASE-{caseData?.id || request.case_id}</h2>
                </div>
                  <p>
                    <strong>Requested By:</strong> {request.requested_by}
                  </p>
                  <p>
                    <strong>Status:</strong> {request.status}
                  </p>
                </div>
                <br></br>
                {caseData && (
                  <div className="case-details">
                    {/* Make sure these column names match your DB exactly */}
                    <p><strong>Age:</strong> {caseData.age}</p>
                    <p><strong>Offence:</strong> {caseData.offenseNature}</p>
                    <p><strong>Severity:</strong> {caseData.severity}</p>
                    <p><strong>Custody Time:</strong> {caseData.custodyTime}</p>
                    <p><strong>Bail Amount:</strong> {caseData.bailAmount}</p>
                    <p><strong>Case Description:</strong> {caseData.caseDescription}</p>
                  </div>
                )}

                {request.status === 'Pending' && (
                  <div className="request-actions">
                    <button
                      className="accept-btn"
                      onClick={() => handleAcceptRequest(request.id, request.case_id, request.requested_by)}
                    >
                      Accept Case
                    </button>
                    <button
                      className="decline-btn"
                      onClick={() => handleDeclineRequest(request.id, request.case_id)}
                    >
                      Decline Case
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RequestsList;
