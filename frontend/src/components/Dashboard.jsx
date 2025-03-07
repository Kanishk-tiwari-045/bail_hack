import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <div className="dashboard">
      <h1 style={{color: "#34d399"}}>Undertrial Prisoner Dashboard</h1>
      <div className="dashboard-sections">
        <div className="dashboard-section document-management">
          <h2>Easy Document Management</h2>
          <hr></hr>
          <p>Manage and upload your documents easily.</p>
          <Link to="/doc-manager" className="dashboard-link">
            Go to Document Management
          </Link>
        </div>
        <div className="dashboard-section legal-aid-request">
          <h2>Submit your cases</h2>
          <hr></hr>
          <p>Simple and fast case registration</p>
          <Link to="/cases" className="dashboard-link">
            Go to Case from submission
          </Link>
        </div>
        <div className="dashboard-section family-notifications">
          <h2>Family Notifications</h2>
          <hr></hr>
          <p>Notify your family about your case status.</p>
          <Link to="/family" className="dashboard-link">
            Go to Family Notifications
          </Link>
        </div>
        <div className="dashboard-section ai-chatbot">
          <h2>AI Chatbot</h2>
          <hr></hr>
          <p>Ask your legal questions to our AI chatbot.</p>
          <Link to="/chatbot" className="dashboard-link">
            Go to AI Chatbot
          </Link>
        </div>
        <div className="dashboard-section schedule-management">
          <h2>Working Calendar</h2>
          <hr></hr>
          <p>Manage your court schedule and hearings.</p>
          <Link to="/calender" className="dashboard-link">
            Go to Schedule Management
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
