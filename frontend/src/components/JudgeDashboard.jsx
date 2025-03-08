import { Link } from "react-router-dom";
import { FaGavel, FaFileAlt, FaCalendarAlt } from "react-icons/fa"; // Importing icons from react-icons
import styles from "../assets/css/judgedashboard.module.css"; // Importing the CSS module for styling

const JudgeDashboard = () => {
  return (
    <div className={styles.dashboard}>
      <header className={styles.dashboardHeader}>
        <h1>Judge Dashboard</h1>
        <div className={styles.notifications}>
          <Link to="/calendar" className={styles.notificationIcon}>
            <FaCalendarAlt size={25} />
          </Link>
        </div>
      </header>
      <div className={styles.dashboardSections}>
        <div className={styles.dashboardSection}>
          <FaGavel size={50} color="#34d399" />
          <Link to="/judge-case-list" className={styles.dashboardLink}>
            Case Assignments
          </Link>
        </div>
        <div className={styles.dashboardSection}>
          <FaFileAlt size={50} color="#34d399" />
          <Link to="/legal-report" className={styles.dashboardLink}>
            Legal Reports
          </Link>
        </div>
      </div>
    </div>
  );
};

export default JudgeDashboard;
