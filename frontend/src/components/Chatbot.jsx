import React, { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Send, Bot, User, ArrowLeft, Trash, Copy, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../assets/css/chatbot.css";
import Navbar from "./Navbar";

// Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ChatBot() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I'm your legal assistant. How can I help you with your bail-related questions today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [showConversations, setShowConversations] = useState(true);
  const [language, setLanguage] = useState("english"); // New state for language
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");
    if (userEmail) {
      fetchConversations(userEmail);
    }
  }, []);

  const fetchConversations = async (userEmail) => {
    try {
      const { data, error } = await supabase
        .from("chatbot_conv")
        .select("*")
        .eq("user_email", userEmail)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const createNewConversation = async () => {
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) return null;
    try {
      const { data, error } = await supabase
        .from("chatbot_conv")
        .insert([
          {
            user_email: userEmail,
            title: "New Conversation",
            created_at: new Date().toISOString(),
          },
        ])
        .select();
      if (error) throw error;
      setConversations([data[0], ...conversations]);
      setCurrentConversationId(data[0].id);
      return data[0].id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return null;
    }
  };

  const saveMessageToConversation = async (conversationId, message) => {
    try {
      const { error } = await supabase.from("chatbot_messages").insert([
        {
          conv_id: conversationId,
          role: message.role,
          content: message.content,
          timestamp: message.timestamp,
        },
      ]);
      if (error) throw error;
      const userMessages = messages.filter((m) => m.role === "user");
      if (userMessages.length === 1 && message.role === "user") {
        updateConversationTitle(conversationId, message.content);
      }
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  const updateConversationTitle = async (conversationId, content) => {
    const title =
      content.length > 30 ? content.substring(0, 27) + "..." : content;
    try {
      const { error } = await supabase
        .from("chatbot_conv")
        .update({ title, created_at: new Date().toISOString() })
        .eq("id", conversationId);
      if (error) throw error;
      setConversations(
        conversations.map((conv) =>
          conv.id === conversationId ? { ...conv, title } : conv
        )
      );
    } catch (error) {
      console.error("Error updating conversation title:", error);
    }
  };

  const loadConversation = async (conversationId) => {
    try {
      const { data, error } = await supabase
        .from("chatbot_messages")
        .select("*")
        .eq("conv_id", conversationId)
        .order("timestamp", { ascending: true });
      if (error) throw error;
      if (data && data.length > 0) {
        setMessages(
          data.map((msg) => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
          }))
        );
      } else {
        setMessages([
          {
            role: "assistant",
            content:
              language === "hindi"
                ? "हाय! मैं आपका कानूनी सहायक हूँ। मैं आज आपके जमानत से संबंधित सवालों में कैसे मदद कर सकता हूँ?"
                : "Hello! I'm your legal assistant. How can I help you with your bail-related questions today?",
            timestamp: new Date().toISOString(),
          },
        ]);
      }
      setCurrentConversationId(conversationId);
      setShowConversations(false);
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  const deleteConversation = async (conversationId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this conversation?"))
      return;
    try {
      await supabase
        .from("chatbot_messages")
        .delete()
        .eq("conv_id", conversationId);
      const { error } = await supabase
        .from("chatbot_conv")
        .delete()
        .eq("id", conversationId);
      if (error) throw error;
      setConversations(
        conversations.filter((conv) => conv.id !== conversationId)
      );
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        setMessages([
          {
            role: "assistant",
            content:
              language === "hindi"
                ? "हाय! मैं आपका कानूनी सहायक हूँ। मैं आज आपके जमानत से संबंधित सवालों में कैसे मदद कर सकता हूँ?"
                : "Hello! I'm your legal assistant. How can I help you with your bail-related questions today?",
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    let conversationId = currentConversationId;
    if (!conversationId) {
      conversationId = await createNewConversation();
      if (!conversationId) return;
    }
    const userMessage = {
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    await saveMessageToConversation(conversationId, userMessage);
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/legal-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMessage.content, language }),
      });
      const data = await response.json();
      const assistantMessageContent =
        data.Answer || "Sorry, I didn't get a response.";
      const assistantMessage = {
        role: "assistant",
        content: assistantMessageContent,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      await saveMessageToConversation(conversationId, assistantMessage);
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage = {
        role: "assistant",
        content:
          language === "hindi"
            ? "मुझे खेद है, आपकी अनुरोध को संसाधित करने में त्रुटि हुई। कृपया बाद में पुनः प्रयास करें।"
            : "I'm sorry, I encountered an error processing your request. Please try again later.",
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
      await saveMessageToConversation(conversationId, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => console.log("Text copied to clipboard"),
      (err) => console.error("Could not copy text: ", err)
    );
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatConversationDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return language === "hindi" ? "आज" : "Today";
    if (diffDays === 1) return language === "hindi" ? "कल" : "Yesterday";
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: "long" });
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="chatbot-page">
      <Navbar />
      <div className="chatbot-container show-sidebar">
        <div className="conversations-sidebar">
          <div className="sidebar-header">
            <h2>{language === "hindi" ? "बातचीत" : "Conversations"}</h2>
            <button
              className="new-chat-button"
              onClick={() => {
                setCurrentConversationId(null);
                setMessages([
                  {
                    role: "assistant",
                    content:
                      language === "hindi"
                        ? "हाय! मैं आपका कानूनी सहायक हूँ। मैं आज आपके जमानत से संबंधित सवालों में कैसे मदद कर सकता हूँ?"
                        : "Hello! I'm your legal assistant. How can I help you with your bail-related questions today?",
                    timestamp: new Date().toISOString(),
                  },
                ]);
                setShowConversations(false);
              }}
            >
              + {language === "hindi" ? "चैट" : "Chat"}
            </button>
          </div>
          <div className="language-selector">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="english">English</option>
              <option value="hindi">हिन्दी</option>
            </select>
          </div>
          <div className="conversations-list">
            {conversations.length === 0 ? (
              <div className="no-conversations">
                <p>
                  {language === "hindi"
                    ? "कोई पिछली बातचीत नहीं"
                    : "No previous conversations"}
                </p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`conversation-item ${
                    currentConversationId === conversation.id ? "active" : ""
                  }`}
                  onClick={() => loadConversation(conversation.id)}
                >
                  <div className="conversation-info">
                    <span className="conversation-title">
                      {conversation.title}
                    </span>
                    <span className="conversation-date">
                      {formatConversationDate(conversation.created_at)}
                    </span>
                  </div>
                  <button
                    className="delete-conversation"
                    onClick={(e) => deleteConversation(conversation.id, e)}
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="ai-chat-main">
          <div className="ai-chat-messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`ai-message ${
                  message.role === "assistant" ? "assistant" : "user"
                } ${message.isError ? "error" : ""}`}
              >
                <div className="ai-message-avatar">
                  {message.role === "assistant" ? (
                    <Bot size={20} />
                  ) : (
                    <User size={20} />
                  )}
                </div>
                <div className="ai-message-content">
                  <div className="ai-message-text">{message.content}</div>
                  <div className="ai-message-footer">
                    <span className="ai-message-time">
                      {formatTimestamp(message.timestamp)}
                    </span>
                    {message.role === "assistant" && !message.isError && (
                      <button
                        className="copy-button"
                        onClick={() => copyToClipboard(message.content)}
                      >
                        <Copy size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="ai-message assistant loading">
                <div className="ai-message-avatar">
                  <Bot size={20} />
                </div>
                <div className="ai-message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="ai-chat-input-container">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            >
              <div className="ai-input-wrapper">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    language === "hindi"
                      ? "जमानत के बारे में सवाल पूछें..."
                      : "Ask a question about bail..."
                  }
                  rows={1}
                />
                <button
                  type="submit"
                  className="send-button"
                  disabled={!inputValue.trim() || isLoading}
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
