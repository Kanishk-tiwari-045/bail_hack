import { create } from "zustand";

const API_URL = "http://localhost:5000"; // Ensure this is correct

export const useAuthStore = create((set) => ({
  user: null,
  isLoading: false,
  error: null,

  signup: async (email, password, officialInfo = {}) => {
    try {
      set({ isLoading: true, error: null });
      // Construct payload including official info if provided
      const payload = { email, password, ...officialInfo };

      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Signup failed");

      set({ isLoading: false });
      return data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { error: error.message };
    }
  },

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      
      console.log("Logging in with:", { email, password });
      
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      console.log("Login response:", { status: response.status, data });
      
      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }
      
      localStorage.setItem("token", data.token);
      set({ user: { email, token: data.token }, isLoading: false });
      return data;
    } catch (error) {
      console.error("Login error:", error);
      set({ error: error.message, isLoading: false });
      return { error: error.message };
    }
  },  

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    set({ user: null });
  },
}));
