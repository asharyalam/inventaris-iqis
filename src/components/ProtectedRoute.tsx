"use client";

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from './SessionContextProvider';
import Layout from './Layout'; // Import the new Layout component

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { session, isLoading, userProfile } = useSession();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Memuat...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role || '')) {
    return <Navigate to="/unauthorized" replace />; // Redirect to an unauthorized page
  }

  // Render the Layout component which includes the Header and then the Outlet
  return <Layout />;
};

export default ProtectedRoute;