import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Check, 
  X, 
  Upload, 
  Save, 
  ArrowLeft,
  Folder,
  Clock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "../assets/css/docmanage.css";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY; 
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default function DocManage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCase, setExpandedCase] = useState(null);
  const [expandedDocs, setExpandedDocs] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [documents, setDocuments] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  // Required documents for each case
  const requiredDocuments = [
    "Personal Identification",
    "Court Summons",
    "Police Report",
    "Witness Statements",
    "Medical Records",
    "Previous Case History",
    "Character References"
  ];

  useEffect(() => {
    fetchCases();
    fetchDocuments();
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .order("id", { ascending: true });
      if (error) throw error;
      setCases(data || []);
    } catch (error) {
      console.error("Error fetching cases:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("doc_manage")
        .select("*");
      if (error) throw error;
      // Organize documents by case_id
      const docsMap = {};
      data.forEach(doc => {
        if (!docsMap[doc.case_id]) {
          docsMap[doc.case_id] = [];
        }
        docsMap[doc.case_id].push(doc);
      });
      setDocuments(docsMap);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const toggleCaseExpand = (caseId) => {
    setExpandedCase(expandedCase === caseId ? null : caseId);
    if (!expandedDocs[caseId]) {
      const initialExpandedState = {};
      initialExpandedState[requiredDocuments[0]] = true;
      setExpandedDocs({
        ...expandedDocs,
        [caseId]: initialExpandedState
      });
    }
  };

  const toggleDocExpand = (caseId, docName) => {
    setExpandedDocs({
      ...expandedDocs,
      [caseId]: {
        ...expandedDocs[caseId],
        [docName]: !expandedDocs[caseId]?.[docName]
      }
    });
  };

  const handleFileUpload = async (caseId, docName, file) => {
    console.log("handleFileUpload called with:", { caseId, docName, file });
    if (!file) {
      console.log("No file provided. Exiting function.");
      return;
    }
  
    const uploadedBy = localStorage.getItem("userEmail");
    if (!uploadedBy) {
      console.error("User email not found in localStorage");
      return;
    }
  
    // Replace spaces in docName with underscores for a URL-safe name.
    const safeDocName = docName.replace(/\s+/g, "_");
    let fileExt = file.name.split('.').pop();
    fileExt = fileExt.toLowerCase(); // force lowercase extension
    const filePath = `${caseId}/${safeDocName}.${fileExt}`;
    console.log("Constructed file details:", { safeDocName, fileExt, filePath, uploadedBy });
  
    try {
      console.log("Starting file upload to bucket 'doc_manage' with path:", filePath);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("doc_manage")
        .upload(filePath, file, { upsert: true });
      console.log("Upload response:", { uploadData, uploadError });
      if (uploadError) throw uploadError;
  
      console.log("Retrieving public URL for filePath:", filePath);
      const { data: publicData } = supabase.storage.from("doc_manage").getPublicUrl(filePath);
      const publicUrl = publicData.publicUrl;
      console.log("Public URL retrieved:", publicUrl);
  
      console.log("Inserting metadata into doc_manage table with uploaded_by:", uploadedBy);
      const { error: insertError } = await supabase
        .from("doc_manage")
        .upsert([
          {
            case_id: caseId,
            document_name: file.name,
            file_path: filePath,
            file_url: publicUrl,
            created_at: new Date().toISOString(),
            uploaded_by: uploadedBy,
            docType: docName, // <--- NEW: Save the document type
          },
        ]);
      console.log("Insert response:", { insertError });
      if (insertError) throw insertError;
  
      // Update local state as an array for this case.
      setDocuments((prevDocs) => {
        const prevArray = Array.isArray(prevDocs[caseId]) ? prevDocs[caseId] : [];
        // Remove any existing document with the same docType (if replacing)
        const newArray = prevArray.filter(doc => doc.docType !== docName);
        newArray.push({
          document_name: file.name,
          file_url: publicUrl,
          docType: docName,
        });
        return {
          ...prevDocs,
          [caseId]: newArray,
        };
      });
  
      console.log(`${docName} uploaded successfully for Case ID ${caseId}`);
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadProgress((prev) => ({
        ...prev,
        [`${caseId}-${docName}`]: -1, // Set error state
      }));
    }
  };  

  const truncate = (text, limit = 300) => {
    if (!text) return '';
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  };

  const saveProgress = async (caseId) => {
    try {
      const { error } = await supabase
        .from('cases')
        .update({ 
          last_updated: new Date().toISOString(),
          documents_updated: true
        })
        .eq('id', caseId);
      if (error) throw error;
      
      alert("Progress saved successfully!");
    } catch (error) {
      console.error("Error saving progress:", error);
      alert("Failed to save progress. Please try again.");
    }
  };

  const isDocumentUploaded = (caseId, docName) => {
    if (!documents[caseId]) return false;
    // Compare against the stored docType instead of document_name
    return documents[caseId].some(doc => doc.docType === docName);
  };
  
  const getDocumentDetails = (caseId, docName) => {
    if (!documents[caseId]) return null;
    // Find document details by matching docType
    return documents[caseId].find(doc => doc.docType === docName);
  };
  

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const currentUserEmail = localStorage.getItem("userEmail")?.toLowerCase();
  const filteredCases = cases.filter(
    (caseItem) => caseItem.submitted_by?.toLowerCase() === currentUserEmail
  );


  return (
    <div className="docmanage-page">
      <Navbar />
      <div className="docmanage-container">
        {/* Header */}
        <div className="docmanage-header">
          <div className="header-left">
            <h1>Document Management</h1>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Search cases by title, client name or case number..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        {/* Cases List */}
        <div className="cases-list">
          {loading ? (
            <div className="loading-state">
              <Clock size={32} className="loading-icon" />
              <p>Loading cases...</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="empty-state">
              <Folder size={48} />
              <p>No cases found</p>
              {searchQuery && <p className="search-note">Try a different search term</p>}
            </div>
          ) : (
            filteredCases.map((caseItem) => (
              <div key={caseItem.id} className="doc-case-card">
                <div 
                  className="case-header" 
                  onClick={() => toggleCaseExpand(caseItem.id)}
                >
                  <div className="case-info">
                    <h2>CASE-{caseItem.id}</h2>
                    <div className="case-meta">
                      <div className="case-detail">
                        <strong>
                          <span className="case-key">Severity: </span>
                        </strong>
                        <span className="case-value">{caseItem.severity}</span>
                      </div>
                      <div className="case-detail">
                        <strong>
                          <span className="case-key">Offense: </span>
                        </strong>
                        <span className="case-value">{caseItem.offenseNature}</span>
                      </div>
                      <div className="case-detail">
                        <strong>
                          <span className="case-key">Opened: </span>
                        </strong>
                        <span className="case-value">{formatDate(caseItem.created_at)}</span>
                      </div>
                      <div className="case-detail">
                        <strong>
                          <span className="case-key">Description: </span>
                        </strong>
                        <span className="case-value">
                          {caseItem.caseDescription
                            ? truncate(caseItem.caseDescription, 300)
                            : "No description available"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="case-actions">
                    {expandedCase === caseItem.id ? (
                      <ChevronUp size={24} />
                    ) : (
                      <ChevronDown size={24} />
                    )}
                  </div>
                </div>
                
                {expandedCase === caseItem.id && (
                  <div className="case-documents">
                    <div className="documents-header">
                      <h3>Required Documents</h3>
                      <button 
                        className="save-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          saveProgress(caseItem.id);
                        }}
                      >
                        <Save size={16} />
                        Save Progress
                      </button>
                    </div>

                    <div className="documents-list">
                      {requiredDocuments.map((docName, index) => {
                        const isUploaded = isDocumentUploaded(caseItem.id, docName);
                        const docDetails = getDocumentDetails(caseItem.id, docName);
                        const isExpanded = expandedDocs[caseItem.id]?.[docName];
                        const uploadKey = `${caseItem.id}-${docName}`;
                        const progress = uploadProgress[uploadKey] || 0;

                        return (
                          <div 
                            key={index} 
                            className={`document-item ${isUploaded ? 'uploaded' : ''} ${isExpanded ? 'expanded' : ''}`}
                          >
                            <div 
                              className="document-header"
                              onClick={() => toggleDocExpand(caseItem.id, docName)}
                            >
                              <div className="document-checkbox">
                                {isUploaded ? (
                                  <div className="checkbox checked">
                                    <Check size={16} />
                                  </div>
                                ) : (
                                  <div className="checkbox"></div>
                                )}
                              </div>
                              <div className="document-info">
                                <span className="document-name">{docName}</span>
                                {isUploaded && (
                                  <span className="document-filename">{docDetails.document_name}</span>
                                )}
                              </div>
                              <div className="document-expand">
                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </div>
                            </div>
                            {isExpanded && (
                              <div className="document-content">
                                {isUploaded ? (
                                  <div className="document-details">
                                    <div className="document-preview">
                                      <FileText size={24} />
                                      <span>{docDetails.document_name}</span>
                                    </div>
                                    <div className="document-actions">
                                      <a 
                                        href={docDetails.file_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="view-button"
                                      >
                                        View Document
                                      </a>
                                      <label className="replace-button">
                                        Replace
                                        <input 
                                          type="file" 
                                          onChange={(e) => {
                                            if (e.target.files[0]) {
                                              handleFileUpload(caseItem.id, docName, e.target.files[0]);
                                            }
                                          }}
                                          style={{ display: 'none' }}
                                        />
                                      </label>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="document-upload">
                                    <label className="upload-area">
                                      <input 
                                        type="file" 
                                        accept=".pdf,.png,.jpg,.docx"
                                        onChange={(e) => {
                                          const file = e.target.files[0];
                                          if (file) {
                                            handleFileUpload(caseItem.id, docName, file);
                                          }
                                        }}
                                        style={{ display: "none" }}
                                      />
                                      <div className="upload-content">
                                        <Upload size={24} />
                                        <span>Click to upload {docName}</span>
                                        <span className="upload-note">PDF, DOC, DOCX, JPG or PNG</span>
                                      </div>
                                    </label>
                                    {progress > 0 && progress < 100 && (
                                      <div className="progress-container">
                                        <div 
                                          className="doc-progress-bar" 
                                          style={{ width: `${progress}%` }}
                                        ></div>
                                        <span className="progress-text">{progress}%</span>
                                      </div>
                                    )}
                                    {progress === -1 && (
                                      <div className="upload-error">
                                        <X size={16} />
                                        <span>Upload failed. Please try again.</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
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
