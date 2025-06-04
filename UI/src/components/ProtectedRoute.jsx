import React from 'react';
import { Navigate } from 'react-router-dom';

// These are placeholders—swap them out for real auth logic.
const isAuthenticated = () => sessionStorage.getItem('loggedIn') === 'true';
const isAdmin = () => sessionStorage.getItem('role') === 'admin';

const ProtectedRoute = ({ children, requireAdmin }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export default ProtectedRoute;
