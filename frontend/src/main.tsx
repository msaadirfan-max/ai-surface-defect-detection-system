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
import {Toaster} from "react-hot-toast";
import {AnimatePresence} from "framer-motion";

import "./index.css";

// Main entry point of the React application, rendering the app into the root element
ReactDom.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" reverseOrder={false} />
         <AnimatePresence mode = 'wait'>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
            <Route path="/" element={<Navigate replace to="/login" />} />
            <Route path="*" element={<Navigate replace to="/login" />} />
          </Routes>
        </AnimatePresence>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
