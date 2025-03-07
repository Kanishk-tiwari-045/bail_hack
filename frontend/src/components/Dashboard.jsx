
import { Link } from "react-router-dom";
import { FaRobot, FaBell } from "react-icons/fa"; // Importing the chatbot and bell icons from react-icons
import "../assets/css/dashboard.css"; // Importing the CSS file for styling

const Dashboard = () => {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Undertrial Prisoner Dashboard</h1>
        <Link to="/family" className="notification-icon">
          <FaBell size={25} />
        </Link>
      </header>
      <div className="dashboard-sections">
        <div className="dashboard-section document-management">
          <h2>Easy Document Management</h2>
          <hr />
          <p>Manage and upload your documents easily.</p>
          <Link to="/doc-manager" className="dashboard-link">
            Go to Document Management
          </Link>
        </div>
        <div className="dashboard-section legal-aid-request">
          <h2>Submit your cases</h2>
          <hr />
          <p>Simple and fast case registration</p>
          <Link to="/cases" className="dashboard-link">
            Go to Case Form Submission
          </Link>
        </div>
        <div className="dashboard-section schedule-management">
          <h2>Working Calendar</h2>
          <hr />
          <p>Manage your court schedule and hearings.</p>
          <Link to="/calendar" className="dashboard-link">
            Go to Schedule Management
          </Link>
        </div>
      </div>
      <Link to="/chatbot" className="chatbot-button">
        <FaRobot size={30} />
        <span>Chatbot</span>
      </Link>
    </div>
  );
};

export default Dashboard;
