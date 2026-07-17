import React from "react";
import ReactDom from "react-dom/client";
import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Upload from "./pages/Upload";
import Register from "./pages/Register";
import History from "./pages/History";
import AdminDashboard from "./pages/AdminDashboard";

import "./index.css";

// Render the application with AuthProvider to provide authentication context
ReactDom.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
          <Route path="/" element={<Navigate replace to="/login" />} />
          <Route path="*" element={<Navigate replace to="/login" />} />
        </Routes>
        
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
