"use client";

import React from 'react';
import { useSession } from './SessionContextProvider';
import MainLayout from './MainLayout';
import { useNavigate } from 'react-router-dom';

interface AdminPageLayoutProps {
  children: React.ReactNode;
}

const AdminPageLayout: React.FC<AdminPageLayoutProps> = ({ children }) => {
  const { user, userProfile, isLoading } = useSession();
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Memuat...</div>;
  }

  if (!user || !userProfile) {
    navigate('/login');
    return null;
  }

  if (userProfile.role !== 'Admin') {
    // Redirect non-admin users or show an unauthorized message
    navigate('/'); // Redirect to main dashboard for non-admins
    return null;
  }

  const userFirstName = userProfile.first_name || user.email || '';
  const userInstansi = userProfile.instansi || 'N/A';
  const userRole = userProfile.role || 'Pengguna';

  return (
    <MainLayout firstName={userFirstName} instansi={userInstansi} role={userRole}>
      {children}
    </MainLayout>
  );
};

export default AdminPageLayout;