import { Link } from "react-router-dom";
import {
  FaRobot,
  FaBell,
  FaFileAlt,
  FaGavel,
  FaCalendarAlt,
} from "react-icons/fa"; // Importing icons from react-icons
import styles from "../assets/css/dashboard.module.css"; // Importing the CSS module for styling

const Dashboard = () => {
  return (
    <div className={styles.dashboard}>
      <header className={styles.dashboardHeader}>
        <h1>Undertrial Prisoner Dashboard</h1>
        <div className={styles.notifications}>
          <Link to="/family" className={styles.notificationIcon}>
            <FaBell size={25} />
          </Link>
          <Link to="/calendar" className={styles.notificationIcon}>
            <FaCalendarAlt size={25} />
          </Link>
        </div>
      </header>
      <div className={styles.dashboardSections}>
        <div className={styles.dashboardSection}>
          <FaFileAlt size={50} color="#F5A623" />
          <Link to="/doc-manager" className={styles.dashboardLink}>
            Go to Document Management
          </Link>
        </div>
        <div className={styles.dashboardSection}>
          <FaGavel size={50} color="#F5A623" />
          <Link to="/cases" className={styles.dashboardLink}>
            Submit your cases
          </Link>
        </div>

        <div className={styles.dashboardSection}>
          <FaFileAlt size={50} color="#F5A623" />
          <Link to="/resource" className={styles.dashboardLink}>
            Go to Resource Center
          </Link>
        </div>
        <div className={styles.dashboardSection}>
          <FaFileAlt size={50} color="#F5A623" />
          <Link to="/timeline" className={styles.dashboardLink}>
            View your Case timeline
          </Link>
        </div>
      </div>
      <Link to="/chatbot" className={styles.chatbotButton}>
        <FaRobot size={30} />
        <span>Chatbot</span>
      </Link>
    </div>
  );
};

export default Dashboard;
