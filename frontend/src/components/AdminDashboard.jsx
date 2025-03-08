import { Link } from "react-router-dom";
import {
  FaRobot,
  FaBell,
  FaClipboard
} from "react-icons/fa"; // Using react-icons for icons
import styles from "../assets/css/dashboard.module.css"; // CSS module

const AdminDashboard = () => {
  return (
    <div className={styles.dashboard}>
      <header className={styles.dashboardHeader}>
        <h1>Admin Dashboard</h1>
        <Link to="/notifications" className={styles.notificationIcon}>
          <FaBell size={25} />
        </Link>
      </header>
      <div className={styles.dashboardSections}>
        <div className={styles.dashboardSection}>
          <FaClipboard size={50} color="#F5A623" />
          <Link to="/cases" className={styles.dashboardLink}>
            Case Form Submission
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

export default AdminDashboard;
