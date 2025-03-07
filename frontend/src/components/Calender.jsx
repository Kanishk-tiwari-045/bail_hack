import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  CalendarDays,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  addDays,
  parseISO,
} from "date-fns";
import "../assets/css/calendar.css";
import Navbar from "./Navbar";

// Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isJudge, setIsJudge] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [userEmail, setUserEmail] = useState("");

  // 1) Get userEmail from localStorage
  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (email) {
      console.log("Retrieved userEmail from localStorage:", email);
      setUserEmail(email);
    } else {
      console.log("No userEmail found in localStorage.");
      setLoading(false);
    }
  }, []);

  // 2) Once we have userEmail, fetch user role and then fetch cases
  useEffect(() => {
    if (!userEmail) {
      console.log("No userEmail set yet; skipping fetchData.");
      return;
    }

    const fetchData = async () => {
      try {
        console.log("Fetching user role for email:", userEmail);
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("email", userEmail)
          .single();

        // After fetching userData in fetchData:
        if (userData) {
          const roleLower = userData.role.toLowerCase();
          setIsJudge(roleLower === "judge");
          console.log("User role:", roleLower);
          // Build query based on role:
          let query = supabase.from("cases").select("*");
          if (roleLower === "judge") {
            console.log(
              "User is judge, filtering by judgeAssigned =",
              userEmail
            );
            query = query.eq("judgeAssigned", userEmail);
          } else if (roleLower === "legal aid provider") {
            console.log(
              "User is legal aid provider, filtering by legalAid containing",
              userEmail
            );
            // Use ilike to match regardless of the prefix text (e.g., "accepted:" or "under review:")
            query = query.ilike("legalAid", `%${userEmail}%`);
          } else if (roleLower === "under trial prisoner") {
            console.log(
              "User is under trial prisoner, filtering by submitted_by =",
              userEmail
            );
            query = query.eq("submitted_by", userEmail);
          }
          const { data: caseData, error: caseError } = await query;
          if (caseError) {
            console.error("Error fetching cases:", caseError);
            setCases([]);
          } else {
            console.log("Case data fetched:", caseData);
            // Convert dateAssigned to Date objects if it exists
            const casesWithDates = caseData.map((caseItem) => ({
              ...caseItem,
              dateassigned: caseItem.dateassigned
                ? parseISO(caseItem.dateassigned)
                : null,
            }));
            setCases(casesWithDates);
          }
        }
      } catch (error) {
        console.error("Error in fetchData:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userEmail]);

  // Calendar navigation
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Render top header
  const renderHeader = () => {
    return (
      <div className="calendar-header">
        <div className="calendar-title">
          <CalendarIcon size={24} />
          <span>Court Calendar</span>
        </div>
        <div className="calendar-controls">
          <div className="month-selector">
            <button className="cal-nav-button" onClick={prevMonth}>
              <ChevronLeft size={20} />
            </button>
            <div className="month-name">
              {format(currentMonth, "MMMM yyyy")}
            </div>
            <button className="cal-nav-button" onClick={nextMonth}>
              <ChevronRight size={20} />
            </button>
          </div>
          <button className="today-button" onClick={goToToday}>
            <CalendarDays size={16} />
            Today
          </button>
        </div>
      </div>
    );
  };

  // Render weekday row
  const renderDays = () => {
    const weekdays = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return (
      <div className="calendar-grid">
        {weekdays.map((dayName, i) => (
          <div className="calendar-weekday" key={i}>
            {dayName}
          </div>
        ))}
      </div>
    );
  };

  // Render actual calendar cells
  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, "d");
        const cloneDay = day;

        // Filter cases for this day
        const dayCases = cases.filter(
          (caseItem) =>
            caseItem.dateassigned && isSameDay(caseItem.dateassigned, cloneDay)
        );

        days.push(
          <div
            className={`calendar-day ${
              !isSameMonth(day, monthStart) ? "day-outside-month" : ""
            } ${isSameDay(day, new Date()) ? "day-today" : ""}`}
            key={day.toString()}
          >
            <div className="day-number">{formattedDate}</div>
            <div className="day-events">
              {dayCases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  className="day-event"
                  onClick={() => setSelectedEvent(caseItem)}
                >
                  <div className="event-title" style={{ fontWeight: 600 }}>
                    Case {caseItem.id}
                  </div>
                  <div className="event-details">
                    <span>
                      {caseItem.legalAid ? caseItem.legalAid : "No legal aid"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="calendar-grid" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  // Modal showing event details
  const renderEventModal = () => {
    if (!selectedEvent) return null;

    return (
      <div
        className="event-modal-backdrop"
        onClick={() => setSelectedEvent(null)}
      >
        <div className="event-modal" onClick={(e) => e.stopPropagation()}>
          <div className="event-modal-header">
            <h3 className="event-modal-title">Case Details</h3>
            <button
              className="close-modal"
              onClick={() => setSelectedEvent(null)}
            >
              <X size={20} />
            </button>
          </div>
          <div className="event-modal-content">
            <div className="event-detail-row">
              <div className="event-detail-label">Case ID:</div>
              <div className="event-detail-value">#{selectedEvent.id}</div>
            </div>
            {selectedEvent.dateassigned && (
              <div className="event-detail-row">
                <div className="event-detail-label">Date:</div>
                <div className="event-detail-value">
                  {format(selectedEvent.dateassigned, "MMMM d, yyyy")}
                </div>
              </div>
            )}
            <div className="event-detail-row">
              <div className="event-detail-label">Legal Aid:</div>
              <div className="event-detail-value">
                {selectedEvent.legalAid
                  ? selectedEvent.legalAid
                  : "No legal aid"}
              </div>
            </div>
            <div className="event-detail-row">
              <div className="event-detail-label">Judge:</div>
              <div className="event-detail-value">
                {selectedEvent.judgeAssigned}
              </div>
            </div>
            {selectedEvent.offenseNature && (
              <div className="event-detail-row">
                <div className="event-detail-label">Offense Nature:</div>
                <div className="event-detail-value">
                  {selectedEvent.offenseNature}
                </div>
              </div>
            )}
            {selectedEvent.severity && (
              <div className="event-detail-row">
                <div className="event-detail-label">Severity:</div>
                <div className="event-detail-value">
                  {selectedEvent.severity}
                </div>
              </div>
            )}
          </div>
          <div className="event-modal-actions"></div>
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-page">
      <Navbar />
      <div className="calendar-container">
        {/* Header */}
        <div>{renderHeader()}</div>

        {/* Loading indicator or the actual calendar */}
        {loading ? (
          <div className="calendar-loading">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <>
            {renderDays()}
            {renderCells()}
          </>
        )}

        {/* Modal for event details */}
        {renderEventModal()}
      </div>
    </div>
  );
}
