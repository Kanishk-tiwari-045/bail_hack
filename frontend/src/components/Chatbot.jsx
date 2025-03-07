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
  // Set sidebar always visible (default true)
  const [showConversations, setShowConversations] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  // Fetch conversation list on component mount
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
      const { error } = await supabase
        .from("chatbot_messages")
        .insert([
          {
            conv_id: conversationId,
            role: message.role,
            content: message.content,
            timestamp: message.timestamp,
          },
        ]);
      if (error) throw error;
      // Optionally update conversation title for the first user message.
      const userMessages = messages.filter((m) => m.role === "user");
      if (userMessages.length === 1 && message.role === "user") {
        updateConversationTitle(conversationId, message.content);
      }
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  const updateConversationTitle = async (conversationId, content) => {
    const title = content.length > 30 ? content.substring(0, 27) + "..." : content;
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
              "Hello! I'm your legal assistant. How can I help you with your bail-related questions today?",
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
    if (!window.confirm("Are you sure you want to delete this conversation?")) return;
    try {
      await supabase.from("chatbot_messages").delete().eq("conv_id", conversationId);
      const { error } = await supabase.from("chatbot_conv").delete().eq("id", conversationId);
      if (error) throw error;
      setConversations(conversations.filter((conv) => conv.id !== conversationId));
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        setMessages([
          {
            role: "assistant",
            content:
              "Hello! I'm your legal assistant. How can I help you with your bail-related questions today?",
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

// RapidAPI constants for GPT-4 endpoint
const RAPID_API_KEY = "5389ccde0bmshe2d75f6589a7b8cp14764bjsn2f728f9e89d7";
const RAPID_API_HOST = "cheapest-gpt-4-turbo-gpt-4-vision-chatgpt-openai-ai-api.p.rapidapi.com";
const RAPID_API_URL = "https://cheapest-gpt-4-turbo-gpt-4-vision-chatgpt-openai-ai-api.p.rapidapi.com/v1/chat/completions";

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
      console.log("Sending request to RapidAPI with payload:", {
        messages: [{ role: "user", content: userMessage.content }],
        model: "gpt-4o",
        max_tokens: 100,
        temperature: 0.9,
      });
  
      const response = await fetch(RAPID_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-key": RAPID_API_KEY,
          "x-rapidapi-host": RAPID_API_HOST,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: userMessage.content }],
          model: "gpt-4o",
          max_tokens: 100,
          temperature: 0.9,
        }),
      });
      console.log("RapidAPI response status:", response.status);
      const data = await response.json();
      console.log("RapidAPI response data:", data);
  
      // Extract the assistant's response from the choices array
      const assistantMessageContent =
        data?.choices && data.choices.length > 0
          ? data.choices[0].message.content
          : "Sorry, I didn't get a response.";
  
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
          "I'm sorry, I encountered an error processing your request. Please try again later.",
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
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: "long" });
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="chatbot-page">
      <Navbar />
      <div className="chatbot-container show-sidebar">
        <div className="conversations-sidebar">
          <div className="sidebar-header">
            <h2>Conversations</h2>
            <button
              className="new-chat-button"
              onClick={() => {
                setCurrentConversationId(null);
                setMessages([
                  {
                    role: "assistant",
                    content:
                      "Hello! I'm your legal assistant. How can I help you with your bail-related questions today?",
                    timestamp: new Date().toISOString(),
                  },
                ]);
                setShowConversations(false);
              }}
            >
              + Chat
            </button>
          </div>
          <div className="conversations-list">
            {conversations.length === 0 ? (
              <div className="no-conversations">
                <p>No previous conversations</p>
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
                  {message.role === "assistant" ? <Bot size={20} /> : <User size={20} />}
                </div>
                <div className="ai-message-content">
                  <div className="ai-message-text">{message.content}</div>
                  <div className="ai-message-footer">
                    <span className="ai-message-time">{formatTimestamp(message.timestamp)}</span>
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
                  placeholder="Ask a question about bail..."
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
