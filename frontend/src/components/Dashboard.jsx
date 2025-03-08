import React from "react";
import { Link } from "react-router-dom";
import { FaRobot, FaBell, FaFileAlt, FaGavel, FaCalendarAlt } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import styles from "../assets/css/dashboard.module.css";

const Dashboard = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.dashboard}>
      <header className={styles.dashboardHeader}>
        <h1>{t("dashboard.title")}</h1>
        <div className={styles.notifications}>
          <Link to="/family" className={styles.notificationIcon} title={t("dashboard.notifications")}>
            <FaBell size={25} />
          </Link>
          <Link to="/calendar" className={styles.notificationIcon} title={t("dashboard.calendar")}>
            <FaCalendarAlt size={25} />
          </Link>
        </div>
      </header>
      <div className={styles.dashboardSections}>
        <div className={styles.dashboardSection}>
          <FaFileAlt size={50} color="#F5A623" />
          <Link to="/doc-manager" className={styles.dashboardLink}>
            {t("dashboard.documentManagement")}
          </Link>
        </div>
        <div className={styles.dashboardSection}>
          <FaGavel size={50} color="#F5A623" />
          <Link to="/cases" className={styles.dashboardLink}>
            {t("dashboard.caseSubmission")}
          </Link>
        </div>
        <div className={styles.dashboardSection}>
          <FaFileAlt size={50} color="#F5A623" />
          <Link to="/resource" className={styles.dashboardLink}>
            {t("dashboard.resourceCenter")}
          </Link>
        </div>
        <div className={styles.dashboardSection}>
          <FaFileAlt size={50} color="#F5A623" />
          <Link to="/timeline" className={styles.dashboardLink}>
            {t("dashboard.caseTimeline")}
          </Link>
        </div>
      </div>
      <Link to="/chatbot" className={styles.chatbotButton}>
        <FaRobot size={30} />
        <span>{t("dashboard.chatbot")}</span>
      </Link>
    </div>
  );
};

export default Dashboard;
