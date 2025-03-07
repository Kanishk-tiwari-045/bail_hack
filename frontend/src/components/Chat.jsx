import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "../assets/css/chat.css";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { Send, Paperclip, Mic, MoreVertical, ArrowLeft } from "lucide-react";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const userEmail = localStorage.getItem("userEmail");         // Current user
  const selectedProviderEmail = localStorage.getItem("selectedProviderEmail"); // Provider's email
  
  const navigate = useNavigate();
  
  // Auto-scroll to bottom when messages change
  const messagesEndRef = React.useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!userEmail || !selectedProviderEmail) {
      alert("No previous chat Information");
      return;
    }
    fetchMessages();

    // Realtime subscription using Supabase Realtime
    const channel = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newRow = payload.new;
          if (
            (newRow.from_email === userEmail && newRow.to_email === selectedProviderEmail) ||
            (newRow.from_email === selectedProviderEmail && newRow.to_email === userEmail)
          ) {
            fetchMessages();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate, userEmail, selectedProviderEmail]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(from_email.eq.${userEmail},to_email.eq.${selectedProviderEmail})` +
          `,and(from_email.eq.${selectedProviderEmail},to_email.eq.${userEmail})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }
    setMessages(data);
  };

  // Add this function within your Chat component (above the return statement)
const handleBack = async () => {
    // Remove the selected provider email from local storage
    localStorage.removeItem("selectedProviderEmail");
    
    const email = localStorage.getItem("userEmail");
    if (!email) {
      navigate("/login");
      return;
    }
    
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("email", email)
      .single();
    
    if (error) {
      console.error("Error fetching user role:", error);
      return;
    }
    
    if (data.role === "legal aid provider") {
      navigate("/client-requests");
    } else if (data.role === "under trial prisoner") {
      navigate("/legalAidList");
    } else {
      navigate("/");
    }
  };  

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const { error } = await supabase.from("messages").insert([
      {
        from_email: userEmail,
        to_email: selectedProviderEmail,
        message: newMessage.trim(),
      },
    ]);
    if (error) {
      console.error("Error sending message:", error);
    } else {
      setNewMessage("");
      // Realtime listener should update messages; otherwise, call fetchMessages()
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
    } else if (isTyping && e.target.value.length === 0) {
      setIsTyping(false);
    }
  };

  // Format date for message grouping
  const formatMessageDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatMessageDate(message.created_at);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className="chat-page">
        <Navbar/>
      <div className="chat-container">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="header-left">
          <ArrowLeft className="back-arrow" onClick={handleBack} />
            <div className="avatar">
              {selectedProviderEmail && selectedProviderEmail.charAt(0).toUpperCase()}
            </div>
            <div className="header-info">
              <h2>{selectedProviderEmail}</h2>
              <span className="status">{isTyping ? "typing..." : "online"}</span>
            </div>
          </div>
          <div className="header-actions">
            <MoreVertical size={20} />
          </div>
        </div>
        
        {/* Chat Messages */}
        <div className="chat-messages">
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date} className="message-group">
              <div className="date-divider">
                <span>{date}</span>
              </div>
              
              {msgs.map((msg, index) => {
                const isSent = msg.from_email === userEmail;
                const showAvatar = index === 0 || 
                  msgs[index - 1]?.from_email !== msg.from_email;
                
                return (
                  <div
                    key={msg.id}
                    className={`chat-message ${
                      isSent ? "sent" : "received"
                    }`}
                  >
                    <div className="message-content">
                      <p className="message-text">{msg.message}</p>
                      <span className="message-time">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {isSent && (
                          <span className="message-status">✓✓</span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Chat Input */}
        <form className="chat-input" onSubmit={sendMessage}>
          <div className="input-actions">
            <Paperclip size={20} />
          </div>
          <input
            type="text"
            placeholder="Type a message"
            value={newMessage}
            onChange={handleInputChange}
          />
          <button type="submit">
            {newMessage.trim() ? <Send size={20} /> : <Mic size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
}