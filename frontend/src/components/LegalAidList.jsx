import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Star, Clock } from 'lucide-react';
import '../assets/css/legalaidList.css';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const LegalAidList = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const selectedCaseId = localStorage.getItem('selectedCaseId');
  const userEmail = localStorage.getItem('userEmail'); // current user's email
  const navigate = useNavigate();

  useEffect(() => {
    fetchLegalAidProviders();
  }, []);

  const handleOpenChat = (providerEmail) => {
    // For example, store the provider’s email in localStorage
    localStorage.setItem("selectedProviderEmail", providerEmail);
    // Then navigate to the chat page
    navigate("/chat");
  };
  
  const fetchLegalAidProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'legal aid provider')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProviders(data);
    } catch (error) {
      console.error('Error fetching legal aid providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReview = async (providerEmail) => {
    if (!selectedCaseId) {
      alert('No case selected.');
      return;
    }
    
    // Save the selected provider's email to localStorage
    localStorage.setItem('selectedProviderEmail', providerEmail);
  
    try {
      // 1) Check if there's already a "Pending" or "Accepted" request for this case_id
      const { data: existingRequests, error: existingError } = await supabase
        .from('requests')
        .select('*')
        .eq('case_id', selectedCaseId)
        .in('status', ['Pending', 'Accepted']);
  
      if (existingError) throw existingError;
  
      // If there's at least one row with status "Pending" or "Accepted", don't allow a new request
      if (existingRequests && existingRequests.length > 0) {
        alert('A request is already pending or accepted for this case. You cannot create another.');
        return;
      }
  
      // 2) Update the case: mark it as "under review" with the provider's email
      const { error: updateCaseError } = await supabase
        .from('cases')
        .update({ legalAid: `under review: ${providerEmail}` })
        .eq('id', selectedCaseId);
  
      if (updateCaseError) throw updateCaseError;
  
      // 3) Insert a new request with status "Pending"
      const { data, error } = await supabase
        .from('requests')
        .insert([
          {
            case_id: selectedCaseId,
            requested_by: userEmail,
            provider_email: providerEmail,
            status: 'Pending',
          },
        ]);
      if (error) throw error;
  
      alert('Request sent successfully!');
    } catch (error) {
      console.error('Error sending request:', error);
      alert('Failed to send request.');
    }
  };  

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="legalList-outer">
      <Navbar />
      <div className="legal-aid-list">
        <div className="legallist-header">
          <UserCheck className="header-icon" />
          <h1>Legal Aid Providers</h1>
        </div>

        <div className="providers-grid">
          {providers.map((provider) => (
            <div key={provider.id} className="provider-card">
              <div className="provider-header">
                <div className="provider-avatar">
                  {provider.full_name?.charAt(0) || provider.email.charAt(0)}
                </div>
                <div className="provider-info">
                  <h2>{provider.full_name || 'Legal Aid Provider'}</h2>
                  <p className="provider-email">{provider.email}</p>
                </div>
              </div>

              <div className="provider-stats">
                <div className="stat">
                  <Star className="stat-icon" />
                  <span>{provider.cases_handled || 0} Cases Handled</span>
                </div>
                <div className="stat">
                  <Clock className="stat-icon" />
                  <span>Member since {formatDate(provider.created_at)}</span>
                </div>
              </div>
              <button
                className="chat-btn"
                onClick={() => handleOpenChat(provider.email)}
              >
                Start Chat
              </button>
              <button
                className="request-review-btn"
                onClick={() => handleRequestReview(provider.email)}
              >
                Request Review
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LegalAidList;