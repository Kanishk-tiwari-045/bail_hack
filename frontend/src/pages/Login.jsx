import React, { useState } from 'react';
import { useAuthStore } from '../components/auth';
import { KeyRound, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import '../assets/css/login.css';

// Initialize Supabase client with VITE_ environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);

    if (email === "admin@gmail.com" && password === "pass@123") {
      localStorage.setItem('userEmail', email);
      // If you have a dedicated admin dashboard route:
      navigate('/admin');
      return; // Stop here, skip normal login flow
    }
    
    // After successful login:
    if (!result?.error) {
      localStorage.setItem('userEmail', email); // <-- Add this line
      // ... then fetch role and navigate accordingly
      const { data: userData, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('email', email)
        .single();
    
      if (roleError || !userData) {
        navigate('/dashboard');
      } else {
        const role = userData.role;
        if (role === 'judge') {
          navigate('/dashboard/judge');
        } else if (role === 'legal aid provider') {
          navigate('/dashboard/legal-aid');
        } else {
          navigate('/dashboard');
        }
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>Welcome Back</h1>
          <p>Please sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>Email Address</label>
            <div className="log-input-wrapper">
              <Mail className="input-icon" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="log-input-wrapper">
              <KeyRound className="input-icon" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={isLoading} className="login-button">
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}
