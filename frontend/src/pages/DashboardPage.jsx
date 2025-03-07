import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import UndertrialDashboard from '../components/Dashboard'; // Undertrial Prisoner Dashboard
import JudgeDashboard from '../components/JudgeDashboard'; // Judge Dashboard
import LegalAidDashboard from '../components/LegalDashboard'; // Legal Aid Provider Dashboard
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function DashboardPage() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Assume the user's email is stored in localStorage after login
  const email = localStorage.getItem('userEmail');

  useEffect(() => {
    async function fetchRole() {
      if (!email) {
        // If email isn't set, redirect to login
        navigate('/login');
        return;
      }
      const { data: userData, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('email', email)
        .single();

      if (roleError || !userData) {
        // Fallback role if there's an error fetching
        setRole('normal');
      } else {
        setRole(userData.role);
      }
      setLoading(false);
    }
    fetchRole();
  }, [email, navigate]);

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  // Choose the appropriate dashboard component based on role
  let DashboardComponent;
  if (role === 'judge') {
    DashboardComponent = JudgeDashboard;
  } else if (role === 'legal aid provider') {
    DashboardComponent = LegalAidDashboard;
  } else {
    DashboardComponent = UndertrialDashboard;
  }

  return (
    <div className="dashboard-page">
      <Navbar />
      <DashboardComponent />
    </div>
  );
}
