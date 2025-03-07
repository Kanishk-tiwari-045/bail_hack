import { Link } from "react-router-dom";
import {
  FaRobot,
  FaBell,
  FaFileAlt,
  FaGavel,
  FaCalendarAlt,
} from "react-icons/fa"; // Importing icons from react-icons
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
          <FaFileAlt size={50} color="#F5A623" />
          <Link to="/doc-manager" className="dashboard-link">
            Go to Document Management
          </Link>
        </div>
        <div className="dashboard-section legal-aid-request">
          <FaGavel size={50} color="#F5A623" />
          <Link to="/cases" className="dashboard-link">
            Submit your cases
          </Link>
        </div>
        <div className="dashboard-section schedule-management">
          <FaCalendarAlt size={50} color="#F5A623" />
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
