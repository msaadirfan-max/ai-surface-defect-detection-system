import React, { createContext, useState, useEffect, useContext } from "react";
import { type User } from "../types/index";
import toast from "react-hot-toast";

interface AuthContextType {
  // Define the shape of the context value
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

// Create the context with an initial undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component that wraps the application and provides auth state
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load token and user from localStorage on startup otherwise on reload we will lose the state and user will be logged out
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    try {
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error parsing stored user data:", error);
      toast.error("Error loading user data. Please log in again.");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    setLoading(false);
  }, []);

  // Memoize the login and logout functions to prevent unnecessary re-renders
  const login = React.useMemo(() => {
    return (newToken: string, newUser: User) => {
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));
    };
  }, []);

  const logout = React.useMemo(() => {
    return () => {
      setToken(null);
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    };
  }, []);

  // Safely memoize derived auth state to stay in sync perfectly
  const isAuthenticated = token !== null;
  const isAdmin = user?.role === "admin";

  // Provide the context value to children components
  return (
    <AuthContext.Provider  // Adding Values in AuthContext
      value={{ token, user, isAuthenticated, isAdmin, login, logout, loading }}
    >
      {!loading && children}    
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext in functional components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
