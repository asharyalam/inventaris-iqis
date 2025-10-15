"use client";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/components/SessionContextProvider";
import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  const { session, isLoading, canAccessAdminDashboard } = useSession(); // Updated to use canAccessAdminDashboard
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (session) {
        if (canAccessAdminDashboard) { // Use the new flag for redirection
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        navigate('/login', { replace: true });
      }
    }
  }, [session, isLoading, canAccessAdminDashboard, navigate]); // Add canAccessAdminDashboard to dependencies

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Memuat Aplikasi...</h1>
          <p className="text-xl text-gray-600">Harap tunggu sebentar.</p>
        </div>
        <MadeWithDyad />
      </div>
    );
  }

  return null; // Will redirect, so no content needed here
};

export default Index;