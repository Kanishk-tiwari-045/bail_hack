import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import Navbar from '../components/Navbar';
import { Search, MessageCircle } from "lucide-react";
import "../assets/css/clientrequest.css";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ClientRequest() {
  const [clientChats, setClientChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  
  const userEmail = localStorage.getItem("userEmail"); // Legal aid provider's email
  const navigate = useNavigate();

  useEffect(() => {
    if (!userEmail) {
      alert("You need to be logged in. Redirecting...");
      navigate("/login");
      return;
    }
    
    fetchClientChats();
    
    // Set up real-time listener for new messages
    const channel = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchClientChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate, userEmail]);

  const fetchClientChats = async () => {
    setLoading(true);
    
    try {
      // First, get all unique client emails who have sent messages to this provider
      const { data: clientEmails, error: clientError } = await supabase
        .from("messages")
        .select("from_email")
        .eq("to_email", userEmail)
        .not("from_email", "eq", userEmail) // Exclude self-messages
        .order("created_at", { ascending: false })
        .then(result => {
          // Get unique client emails
          const uniqueEmails = [...new Set(result.data.map(item => item.from_email))];
          return { data: uniqueEmails.map(email => ({ from_email: email })) };
        });

      if (clientError) throw clientError;

      // For each client, get their most recent message
      const clientsWithLastMessage = await Promise.all(
        clientEmails.map(async (client) => {
          const { data: lastMessage, error: messageError } = await supabase
            .from("messages")
            .select("*")
            .or(
              `and(from_email.eq.${client.from_email},to_email.eq.${userEmail})` +
              `,and(from_email.eq.${userEmail},to_email.eq.${client.from_email})`
            )
            .order("created_at", { ascending: false })
            .limit(1);

          if (messageError) throw messageError;

          // Get unread message count
          const { data: unreadCount, error: unreadError } = await supabase
            .from("messages")
            .select("id", { count: "exact" })
            .eq("to_email", userEmail)
            .eq("from_email", client.from_email);

          if (unreadError) throw unreadError;

          return {
            clientEmail: client.from_email,
            lastMessage: lastMessage[0],
            unreadCount: unreadCount.length
          };
        })
      );

      setClientChats(clientsWithLastMessage);
    } catch (error) {
      console.error("Error fetching client chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSelect = (clientEmail) => {
    localStorage.setItem("selectedProviderEmail", clientEmail); // Using the same key for consistency
    navigate("/chat");
  };

  // Filter chats based on search query
  const filteredChats = clientChats.filter(chat => 
    chat.clientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (chat.lastMessage?.message && chat.lastMessage.message.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Format timestamp to show either time or date depending on how recent
  const formatMessageTime = (timestamp) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    
    // If message is from today, show time
    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If message is from this week, show day name
    const diffDays = Math.floor((today - messageDate) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise show date
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Truncate message preview
  const truncateMessage = (message, maxLength = 40) => {
    if (!message) return "";
    return message.length > maxLength 
      ? message.substring(0, maxLength) + "..." 
      : message;
  };

  return (
    <div className="client-request-page">
      <Navbar/>
      <div className="client-container">
        {/* Header */}
        <div className="client-header-parent">
          <h1>Client Messages</h1>
        </div>
        
        {/* Search Bar */}
        <div className="search-container">
          <div className="search-input">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search clients or messages" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Client Chat List */}
        <div className="client-list">
          {loading ? (
            <div className="loading-state">Loading client messages...</div>
          ) : filteredChats.length === 0 ? (
            <div className="empty-state">
              <MessageCircle size={48} />
              <p>No client messages found</p>
              {searchQuery && <p className="search-note">Try a different search term</p>}
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div 
                key={chat.clientEmail} 
                className="client-card" 
                onClick={() => handleChatSelect(chat.clientEmail)}
              >
                <div className="client-avatar">
                  {chat.clientEmail.charAt(0).toUpperCase()}
                </div>
                <div className="client-info">
                  <div className="client-header">
                    <h3>{chat.clientEmail}</h3>
                    <span className="message-time">
                      {chat.lastMessage && formatMessageTime(chat.lastMessage.created_at)}
                    </span>
                  </div>
                  <div className="message-preview">
                    <p>
                      {chat.lastMessage?.from_email === userEmail ? (
                        <span className="you-prefix">You: </span>
                      ) : null}
                      {truncateMessage(chat.lastMessage?.message)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}