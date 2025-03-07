import { Link } from "react-router-dom";

const JudgeDashboard = () => {
  return (
    <div className="dashboard">
      <h1 style={{color: "#34d399"}}>Judge Dashboard</h1>
      <div className="dashboard-sections">
        <div className="dashboard-section case-overview">
          <h2>Case Assignments</h2>
          <hr></hr>
          <p>Review cases and make feedbacks.</p>
          <Link to="/judge-case-list" className="dashboard-link">
            Go to Case Overview
          </Link>
        </div>
        <div className="dashboard-section legal-reports">
          <h2>Legal Reports</h2>
          <hr></hr>
          <p>Access detailed legal reports and case files.</p>
          <Link to="/legal-report" className="dashboard-link">
            Go to Legal Reports
          </Link>
        </div>
        <div className="dashboard-section schedule-management">
          <h2>Scheduling</h2>
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

export default JudgeDashboard;
