import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  Book, 
  Search, 
  Filter,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Scale,
  Gavel,
  ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "./Navbar";
import "../assets/css/resource.css";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Resource() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from("ipc_details")
        .select("*")
        .order("Section", { ascending: true });

      if (error) throw error;
      // If your API’s returned data structure changes, you can modify the transformation below.
      // For example, if the field "Section" becomes "sectionName", change data accordingly.
      setResources(data || []);
    } catch (error) {
      console.error(t("resource.fetchError"), error);
    } finally {
      setLoading(false);
    }
  };

  // Example categories array
  const categories = [
    { id: "all", label: t("resource.allCategories") },
    { id: "Cyber Crimes", label: t("resource.cyberCrimes") },
    { id: "Crimes Against SC/ST Communities", label: t("resource.crimesSCST") },
    { id: "Crimes Against Women", label: t("resource.crimesWomen") },
    { id: "Crimes Against Children", label: t("resource.crimesChildren") },
    { id: "Economic Offenses", label: t("resource.economicOffenses") },
  ];

  const filteredResources = resources.filter(resource => {
    const matchesSearch =
      resource.Section?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.Category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource["IPC Title"]?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource["CrPC Title"]?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource["BNS Title"]?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource["IPC Description"]?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource["CrPC Description"]?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource["BNS Description"]?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      resource.Category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category) => {
    switch (category) {
      case "IPC":
        return <Scale size={24} />;
      case "CrPC":
        return <Gavel size={24} />;
      case "BNS":
        return <BookOpen size={24} />;
      default:
        return <Book size={24} />;
    }
  };

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <div className="resource-page">
      <Navbar />
      <div className="resource-container">
        {/* Header */}
        <div className="resource-header">
          <div className="header-left">
            <ArrowLeft
              className="back-arrow"
              onClick={() => navigate("/dashboard")}
            />
            <h1>{t("resource.centerTitle")}</h1>
          </div>
          <div className="header-right">
            <Book size={24} />
          </div>
        </div>

        {/* Search and Filter */}
        <div className="search-filter-container">
          <div className="search-bar">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder={t("resource.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="category-filters">
            <Filter size={16} className="filter-icon" />
            {categories.map((category) => (
              <button
                key={category.id}
                className={`category-button ${
                  selectedCategory === category.id ? "active" : ""
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Resource List */}
        <div className="resource-list">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>{t("resource.loading")}</p>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="empty-state">
              <Book size={48} />
              <p>{t("resource.noResources")}</p>
              <button
                className="reset-search"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
              >
                {t("resource.resetSearch")}
              </button>
            </div>
          ) : (
            filteredResources.map((resource) => (
              <div
                key={resource.Section}
                className={`resource-card ${
                  expandedSection === resource.Section ? "expanded" : ""
                }`}
              >
                <div
                  className="resource-header-content"
                  onClick={() => toggleSection(resource.Section)}
                >
                  <div className="resource-icon">
                    {getCategoryIcon(resource.Category)}
                  </div>
                  <div className="resource-title">
                    <h2>{resource.Section}</h2>
                    <span className="category-badge">{resource.Category}</span>
                  </div>
                  <div className="expand-icon">
                    {expandedSection === resource.Section ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </div>
                </div>

                {expandedSection === resource.Section && (
                  <div className="resource-details">
                    {resource["IPC Title"] && (
                      <div className="detail-section">
                        <h3>{t("resource.ipcTitle")}</h3>
                        <h4>{resource["IPC Title"]}</h4>
                        <p>{resource["IPC Description"]}</p>
                      </div>
                    )}
                    {resource["CrPC Title"] && (
                      <div className="detail-section">
                        <h3>{t("resource.crpcTitle")}</h3>
                        <h4>{resource["CrPC Title"]}</h4>
                        <p>{resource["CrPC Description"]}</p>
                      </div>
                    )}
                    {resource["BNS Title"] && (
                      <div className="detail-section">
                        <h3>{t("resource.bnsTitle")}</h3>
                        <h4>{resource["BNS Title"]}</h4>
                        <p>{resource["BNS Description"]}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
